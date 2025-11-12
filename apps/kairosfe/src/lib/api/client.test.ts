/**
 * Comprehensive tests for API Client
 * Target: 95%+ coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, ApiError } from './client';
import { useAuthStore } from '../store';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const baseURL = 'http://localhost:3000/api/v1';

describe('ApiClient', () => {
  beforeEach(() => {
    // Reset auth store
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      permissions: [],
      policy: null,
    });
  });

  describe('ApiError class', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError(
        400,
        'BadRequest',
        'Invalid input',
        'op-123',
        'req-456'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.error).toBe('BadRequest');
      expect(error.message).toBe('Invalid input');
      expect(error.operationId).toBe('op-123');
      expect(error.requestId).toBe('req-456');
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without optional properties', () => {
      const error = new ApiError(
        500,
        'InternalError',
        'Server error'
      );

      expect(error.statusCode).toBe(500);
      expect(error.error).toBe('InternalError');
      expect(error.message).toBe('Server error');
      expect(error.operationId).toBeUndefined();
      expect(error.requestId).toBeUndefined();
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const response = await apiClient.get('/timesheets');

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    });

    it('should make GET request with auth', async () => {
      useAuthStore.setState({
        token: 'test-token',
        isAuthenticated: true,
      });

      const response = await apiClient.get('/me', true);

      expect(response).toBeDefined();
    });

    it('should handle 404 error', async () => {
      server.use(
        http.get(`${baseURL}/timesheets/:id`, () => {
          return HttpResponse.json(
            { message: 'Not found', error: 'NotFound', statusCode: 404 },
            { status: 404 }
          );
        })
      );

      await expect(
        apiClient.get('/timesheets/non-existent')
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.get('/timesheets/non-existent');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
        expect((error as ApiError).error).toBe('NotFound');
      }
    });

    it('should handle network error', async () => {
      server.use(
        http.get(`${baseURL}/test-endpoint`, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        apiClient.get('/test-endpoint')
      ).rejects.toThrow();
    }, 15000); // Increased timeout for retry logic
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const data = {
        userId: '1',
        weekStartDate: '2025-01-13',
      };

      const response = await apiClient.post('/timesheets', data);

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id');
    });

    it('should make POST request with auth', async () => {
      useAuthStore.setState({
        token: 'test-token',
        isAuthenticated: true,
      });

      const response = await apiClient.post(
        '/timesheets/1/submit',
        {},
        true
      );

      expect(response).toBeDefined();
    });

    it('should handle validation error', async () => {
      server.use(
        http.post(`${baseURL}/test-validation`, () => {
          return HttpResponse.json(
            {
              message: 'Validation failed',
              error: 'ValidationError',
              statusCode: 400,
            },
            { status: 400 }
          );
        })
      );

      await expect(
        apiClient.post('/test-validation', { invalid: 'data' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const updates = { hours: 10 };

      const response = await apiClient.patch('/time-entries/1', updates);

      expect(response).toBeDefined();
    });

    it('should make PATCH request with auth', async () => {
      useAuthStore.setState({
        token: 'test-token',
        isAuthenticated: true,
      });

      const response = await apiClient.patch(
        '/time-entries/1',
        { hours: 10 },
        true
      );

      expect(response).toBeDefined();
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      server.use(
        http.put(`${baseURL}/test-resource/1`, async () => {
          return HttpResponse.json({ id: '1', updated: true });
        })
      );

      const response = await apiClient.put('/test-resource/1', {
        name: 'Updated',
      });

      expect(response).toBeDefined();
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const response = await apiClient.delete('/time-entries/1');

      expect(response).toBeDefined();
    });

    it('should make DELETE request with auth', async () => {
      useAuthStore.setState({
        token: 'test-token',
        isAuthenticated: true,
      });

      const response = await apiClient.delete('/time-entries/1', true);

      expect(response).toBeDefined();
    });
  });

  describe('Authentication handling', () => {
    it('should include Authorization header when requiresAuth is true', async () => {
      useAuthStore.setState({
        token: 'test-token-123',
        isAuthenticated: true,
      });

      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${baseURL}/protected`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiClient.get('/protected', true);

      expect(capturedHeaders?.get('authorization')).toBe('Bearer test-token-123');
    });

    it('should handle 401 error and refresh token', async () => {
      useAuthStore.setState({
        token: 'expired-token',
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
      });

      let requestCount = 0;

      server.use(
        http.get(`${baseURL}/protected-resource`, () => {
          requestCount++;
          // First request returns 401, second succeeds
          if (requestCount === 1) {
            return HttpResponse.json(
              { message: 'Unauthorized', error: 'Unauthorized', statusCode: 401 },
              { status: 401 }
            );
          }
          return HttpResponse.json({ success: true });
        })
      );

      const response = await apiClient.get('/protected-resource', true);

      expect(response).toBeDefined();
      expect(requestCount).toBe(2); // Original request + retry after refresh
      expect(useAuthStore.getState().token).toBe('new-mock-access-token');
    });

    it('should logout on failed token refresh', async () => {
      useAuthStore.setState({
        token: 'expired-token',
        refreshToken: 'invalid-refresh-token',
        isAuthenticated: true,
      });

      server.use(
        http.get(`${baseURL}/protected-resource`, () => {
          return HttpResponse.json(
            { message: 'Unauthorized', error: 'Unauthorized', statusCode: 401 },
            { status: 401 }
          );
        }),
        http.post(`${baseURL}/auth/refresh`, () => {
          return HttpResponse.json(
            { message: 'Invalid refresh token', error: 'Unauthorized', statusCode: 401 },
            { status: 401 }
          );
        })
      );

      await expect(
        apiClient.get('/protected-resource', true)
      ).rejects.toThrow();

      // User should be logged out
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('should handle 403 Forbidden error', async () => {
      server.use(
        http.get(`${baseURL}/forbidden-resource`, () => {
          return HttpResponse.json(
            { message: 'Forbidden', error: 'Forbidden', statusCode: 403 },
            { status: 403 }
          );
        })
      );

      await expect(
        apiClient.get('/forbidden-resource')
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.get('/forbidden-resource');
      } catch (error) {
        expect((error as ApiError).statusCode).toBe(403);
        expect((error as ApiError).message).toContain('permission');
      }
    });

    it('should handle 429 Rate Limit error', async () => {
      server.use(
        http.get(`${baseURL}/rate-limited`, () => {
          return HttpResponse.json(
            { message: 'Too many requests', error: 'TooManyRequests', statusCode: 429 },
            {
              status: 429,
              headers: { 'retry-after': '60' },
            }
          );
        })
      );

      await expect(
        apiClient.get('/rate-limited')
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.get('/rate-limited');
      } catch (error) {
        expect((error as ApiError).statusCode).toBe(429);
        expect((error as ApiError).message).toContain('Rate limit');
      }
    });
  });

  describe('Response handling', () => {
    it('should handle 204 No Content', async () => {
      server.use(
        http.delete(`${baseURL}/resource/1`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const response = await apiClient.delete('/resource/1');

      expect(response).toEqual({});
    });

    it('should handle JSON response', async () => {
      const response = await apiClient.get('/timesheets');

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
    });

    it('should handle non-JSON response', async () => {
      server.use(
        http.get(`${baseURL}/text-response`, () => {
          return new HttpResponse('Plain text response', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
      );

      const response = await apiClient.get('/text-response');

      // Should return empty object for non-JSON
      expect(response).toEqual({});
    });
  });

  describe('Error handling', () => {
    it('should handle server error (500)', async () => {
      server.use(
        http.get(`${baseURL}/server-error`, () => {
          return HttpResponse.json(
            { message: 'Internal server error', error: 'InternalServerError', statusCode: 500 },
            { status: 500 }
          );
        })
      );

      await expect(
        apiClient.get('/server-error')
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.get('/server-error');
      } catch (error) {
        expect((error as ApiError).statusCode).toBe(500);
      }
    }, 15000); // Increased timeout for retry logic

    it('should handle error with non-JSON response', async () => {
      server.use(
        http.get(`${baseURL}/html-error`, () => {
          return new HttpResponse('<html>Error page</html>', {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
          });
        })
      );

      await expect(
        apiClient.get('/html-error')
      ).rejects.toThrow(ApiError);
    }, 15000); // Increased timeout for retry logic
  });

  describe('Login and Logout', () => {
    it('should call login endpoint', async () => {
      const response = await apiClient.login('test@test.com', 'password123');

      expect(response).toBeDefined();
      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('user');
    });

    it('should handle login failure', async () => {
      await expect(
        apiClient.login('wrong@test.com', 'wrongpassword')
      ).rejects.toThrow(ApiError);
    });

    it('should call logout endpoint and clear state', async () => {
      useAuthStore.setState({
        token: 'test-token',
        refreshToken: 'test-refresh',
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          role: 'employee',
          tenantId: 'tenant-1',
          jobTitle: 'Developer',
          department: 'Engineering',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      });

      await apiClient.logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });

    it('should handle logout even if API call fails', async () => {
      useAuthStore.setState({
        token: 'test-token',
        isAuthenticated: true,
      });

      server.use(
        http.post(`${baseURL}/auth/logout`, () => {
          return HttpResponse.json(
            { message: 'Server error', error: 'InternalServerError', statusCode: 500 },
            { status: 500 }
          );
        })
      );

      // Should not throw
      await expect(apiClient.logout()).resolves.not.toThrow();

      // User should still be logged out
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should skip logout API call if no token', async () => {
      useAuthStore.setState({
        token: null,
        isAuthenticated: false,
      });

      await apiClient.logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('Concurrent refresh token requests', () => {
    it('should reuse in-flight refresh token request', async () => {
      useAuthStore.setState({
        token: 'expired-token',
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
      });

      let refreshCallCount = 0;

      server.use(
        http.post(`${baseURL}/auth/refresh`, () => {
          refreshCallCount++;
          return HttpResponse.json({
            token: 'new-token',
            refreshToken: 'new-refresh',
            expiresIn: 3600,
          });
        }),
        http.get(`${baseURL}/resource-1`, () => {
          if (useAuthStore.getState().token === 'expired-token') {
            return HttpResponse.json(
              { message: 'Unauthorized', error: 'Unauthorized', statusCode: 401 },
              { status: 401 }
            );
          }
          return HttpResponse.json({ id: 1 });
        }),
        http.get(`${baseURL}/resource-2`, () => {
          if (useAuthStore.getState().token === 'expired-token') {
            return HttpResponse.json(
              { message: 'Unauthorized', error: 'Unauthorized', statusCode: 401 },
              { status: 401 }
            );
          }
          return HttpResponse.json({ id: 2 });
        })
      );

      // Make two concurrent requests that will both trigger refresh
      const [response1, response2] = await Promise.all([
        apiClient.get('/resource-1', true),
        apiClient.get('/resource-2', true),
      ]);

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
      // Refresh should only be called once despite two 401s
      expect(refreshCallCount).toBe(1);
    });
  });
});
