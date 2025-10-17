import type { AuthResponse, RefreshTokenResponse } from '@kairos/shared';
import { useAuthStore } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  _isRetry?: boolean; // Internal flag to prevent infinite retry loops
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string> | null = null;

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

        return data.token;
      } catch (error) {
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
    const { requiresAuth = false, _isRetry = false, ...fetchConfig } = config;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchConfig,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...fetchConfig.headers,
      },
    });

    // Handle 401 - attempt token refresh
    if (response.status === 401 && requiresAuth && !_isRetry) {
      try {
        await this.refreshAccessToken();

        // Retry the original request with new token
        return this.request<T>(endpoint, {
          ...config,
          _isRetry: true, // Prevent infinite retry loop
        });
      } catch (error) {
        // Refresh failed - user has been logged out
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {} as T;
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
