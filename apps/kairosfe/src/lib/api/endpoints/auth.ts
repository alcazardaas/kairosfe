/**
 * Authentication endpoints
 * Generated from OpenAPI spec - Authentication tag
 */

import { apiClient } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  MeResponse,
} from '../schemas';
import {
  LoginResponseSchema,
  RefreshResponseSchema,
  MeResponseSchema,
} from '../schemas';

/**
 * AuthController_login
 * POST /auth/login
 * Authenticate user and create a new session
 */
export async function login(data: LoginRequest, userAgent: string): Promise<LoginResponse> {
  return apiClient.request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'user-agent': userAgent,
    },
    operationId: 'AuthController_login',
    schema: LoginResponseSchema,
  });
}

/**
 * AuthController_refresh
 * POST /auth/refresh
 * Use refresh token to obtain a new session token
 */
export async function refreshToken(data: RefreshRequest): Promise<RefreshResponse> {
  return apiClient.request<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(data),
    operationId: 'AuthController_refresh',
    schema: RefreshResponseSchema,
  });
}

/**
 * AuthController_logout
 * POST /auth/logout
 * Invalidates the current session token immediately
 */
export async function logout(): Promise<void> {
  return apiClient.request<void>('/auth/logout', {
    method: 'POST',
    requiresAuth: true,
    operationId: 'AuthController_logout',
  });
}

/**
 * AuthController_getCurrentUser
 * GET /auth/me
 * Returns current user information, tenant, membership role, and timesheet policy
 */
export async function getCurrentUser(): Promise<MeResponse> {
  return apiClient.request<MeResponse>('/auth/me', {
    method: 'GET',
    requiresAuth: true,
    operationId: 'AuthController_getCurrentUser',
    schema: MeResponseSchema,
  });
}
