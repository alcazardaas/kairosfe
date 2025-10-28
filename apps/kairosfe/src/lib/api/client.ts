import type { AuthResponse, RefreshTokenResponse } from '@kairos/shared';
import { useAuthStore } from '../store';
import type { z } from 'zod';
import { ErrorResponseSchema } from './schemas';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const IS_DEV = import.meta.env.DEV;
const USE_MSW = import.meta.env.VITE_USE_MSW === 'true';

// Define custom API error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public operationId?: string,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  _isRetry?: boolean; // Internal flag to prevent infinite retry loops
  _retryCount?: number; // Track retry attempts
  operationId?: string; // For logging and error tracking
  schema?: z.ZodTypeAny; // Optional Zod schema for response validation
}

// Exponential backoff utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string> | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = useAuthStore.getState().token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private log(level: 'info' | 'error' | 'warn', message: string, data?: unknown): void {
    if (IS_DEV || USE_MSW) {
      const prefix = '[API Client]';
      switch (level) {
        case 'info':
          console.info(prefix, message, data || '');
          break;
        case 'error':
          console.error(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
      }
    }
  }

  private shouldRetry(method: string, statusCode: number, retryCount: number): boolean {
    // Only retry idempotent methods (GET)
    if (method.toUpperCase() !== 'GET') {
      return false;
    }

    // Don't retry if max retries reached
    if (retryCount >= this.MAX_RETRIES) {
      return false;
    }

    // Retry on 5xx errors and network errors
    return statusCode >= 500 || statusCode === 0;
  }

  private async sendToSentry(error: ApiError, context: Record<string, unknown>): Promise<void> {
    // Only send to Sentry in production or if configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          api: context,
        },
      });
    }
  }

  private async refreshAccessToken(): Promise<string> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        this.log('info', 'Refreshing access token...');

        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data: RefreshTokenResponse = await response.json();

        // Update tokens in store
        useAuthStore.getState().setTokens(data.token, refreshToken);

        this.log('info', 'Access token refreshed successfully');
        return data.token;
      } catch (error) {
        this.log('error', 'Token refresh failed', error);
        // Refresh failed - log out user
        useAuthStore.getState().logout();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      requiresAuth = false,
      _isRetry = false,
      _retryCount = 0,
      operationId,
      schema,
      ...fetchConfig
    } = config;

    const method = (fetchConfig.method || 'GET').toUpperCase();
    const startTime = Date.now();

    // Log request in dev mode
    this.log('info', `${method} ${endpoint}`, {
      operationId,
      requiresAuth,
      retryCount: _retryCount,
      body: fetchConfig.body,
    });

    try {
      const requestOptions = {
        ...fetchConfig,
        headers: {
          ...this.getHeaders(requiresAuth),
          ...fetchConfig.headers,
        },
      };

      // Debug logging for POST/PATCH/PUT requests
      if (IS_DEV && fetchConfig.body) {
        console.log(`[API Client] ${method} ${endpoint}`);
        console.log('[API Client] Headers:', requestOptions.headers);
        console.log('[API Client] Body:', fetchConfig.body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);

      const duration = Date.now() - startTime;
      const requestId = response.headers.get('x-request-id') || undefined;

      // Handle 401 - attempt token refresh
      if (response.status === 401 && requiresAuth && !_isRetry) {
        this.log('warn', 'Received 401, attempting token refresh...');
        try {
          await this.refreshAccessToken();

          // Retry the original request with new token
          return this.request<T>(endpoint, {
            ...config,
            _isRetry: true, // Prevent infinite retry loop
          });
        } catch (error) {
          // Refresh failed - user has been logged out
          const apiError = new ApiError(
            401,
            'Unauthorized',
            'Session expired. Please log in again.',
            operationId,
            requestId
          );
          this.log('error', 'Session refresh failed', apiError);
          throw apiError;
        }
      }

      // Handle 403 - Forbidden
      if (response.status === 403) {
        const apiError = new ApiError(
          403,
          'Forbidden',
          'You do not have permission to perform this action.',
          operationId,
          requestId
        );
        this.log('warn', 'Permission denied', apiError);
        throw apiError;
      }

      // Handle 429 - Rate Limit
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
        this.log('warn', `Rate limited. Retry after ${waitTime}ms`);

        const apiError = new ApiError(
          429,
          'Too Many Requests',
          `Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`,
          operationId,
          requestId
        );
        throw apiError;
      }

      // Handle other errors
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          errorData = await response.json();
          // Validate error response structure
          const parsed = ErrorResponseSchema.safeParse(errorData);
          if (parsed.success) {
            errorData = parsed.data;
          }
        } else {
          errorData = {
            error: response.statusText,
            message: await response.text(),
            statusCode: response.status,
          };
        }

        const apiError = new ApiError(
          response.status,
          errorData.error || response.statusText,
          errorData.message || 'An error occurred',
          operationId,
          requestId
        );

        // Check if we should retry
        if (this.shouldRetry(method, response.status, _retryCount)) {
          const retryDelay = this.INITIAL_RETRY_DELAY * Math.pow(2, _retryCount);
          this.log('warn', `Retrying request after ${retryDelay}ms (attempt ${_retryCount + 1}/${this.MAX_RETRIES})`);
          await sleep(retryDelay);

          return this.request<T>(endpoint, {
            ...config,
            _retryCount: _retryCount + 1,
          });
        }

        // Send to Sentry for non-4xx errors
        if (response.status >= 500) {
          await this.sendToSentry(apiError, {
            endpoint,
            method,
            operationId,
            requestId,
            duration,
            statusCode: response.status,
          });
        }

        this.log('error', `Request failed: ${method} ${endpoint}`, apiError);
        throw apiError;
      }

      // Handle successful response
      this.log('info', `${method} ${endpoint} completed in ${duration}ms`);

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        // Validate response with schema in dev mode
        if (IS_DEV && schema) {
          const result = schema.safeParse(data);
          if (!result.success) {
            this.log('error', 'Response validation failed', {
              operationId,
              endpoint,
              errors: result.error.errors,
            });

            // Send schema mismatch to Sentry
            const schemaError = new Error('API response schema mismatch');
            await this.sendToSentry(schemaError as ApiError, {
              endpoint,
              operationId,
              validationErrors: result.error.errors,
            });
          }
        }

        return data;
      }

      return {} as T;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new ApiError(
          0,
          'NetworkError',
          'Network request failed. Please check your connection.',
          operationId
        );

        // Retry on network errors
        if (this.shouldRetry(method, 0, _retryCount)) {
          const retryDelay = this.INITIAL_RETRY_DELAY * Math.pow(2, _retryCount);
          this.log('warn', `Network error, retrying after ${retryDelay}ms (attempt ${_retryCount + 1}/${this.MAX_RETRIES})`);
          await sleep(retryDelay);

          return this.request<T>(endpoint, {
            ...config,
            _retryCount: _retryCount + 1,
          });
        }

        this.log('error', 'Network error', networkError);
        throw networkError;
      }

      // Re-throw ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }

      // Wrap unknown errors
      const unknownError = new ApiError(
        500,
        'UnknownError',
        error instanceof Error ? error.message : 'An unknown error occurred',
        operationId
      );
      this.log('error', 'Unknown error', unknownError);
      throw unknownError;
    }
  }

  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(endpoint: string, data: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  async put<T>(endpoint: string, data: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }

  async patch<T>(endpoint: string, data: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  // Auth-specific methods
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', { email, password });
  }

  async logout(): Promise<void> {
    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await this.post('/auth/logout', {}, true);
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    useAuthStore.getState().logout();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
