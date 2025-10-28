/**
 * Leave Request endpoints
 * Generated from OpenAPI spec - Leave Requests tag
 */

import { apiClient } from '../client';
import type {
  LeaveRequestListResponse,
  LeaveRequestResponse,
  BenefitBalancesResponse,
} from '../schemas';
import {
  LeaveRequestListResponseSchema,
  LeaveRequestResponseSchema,
  BenefitBalancesResponseSchema,
} from '../schemas';

interface LeaveRequestQueryParams {
  mine?: string;
  team?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
  page_size?: string;
}

/**
 * LeaveRequestsController_findAll
 * GET /leave-requests
 * Retrieve leave requests with optional filters
 */
export async function findAllLeaveRequests(params?: LeaveRequestQueryParams): Promise<LeaveRequestListResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
  }
  const queryString = searchParams.toString();
  const path = queryString ? `/leave-requests?${queryString}` : '/leave-requests';

  return apiClient.request<LeaveRequestListResponse>(path, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'LeaveRequestsController_findAll',
    schema: LeaveRequestListResponseSchema,
  });
}

/**
 * LeaveRequestsController_create
 * POST /leave-requests
 * Create a new leave request for PTO, sick leave, or other benefits
 */
export async function createLeaveRequest(data: unknown): Promise<LeaveRequestResponse> {
  return apiClient.request<LeaveRequestResponse>('/leave-requests', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'LeaveRequestsController_create',
    schema: LeaveRequestResponseSchema,
  });
}

/**
 * LeaveRequestsController_findOne
 * GET /leave-requests/{id}
 * Retrieve a leave request by its ID
 */
export async function findLeaveRequestById(id: string): Promise<LeaveRequestResponse> {
  return apiClient.request<LeaveRequestResponse>(`/leave-requests/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'LeaveRequestsController_findOne',
    schema: LeaveRequestResponseSchema,
  });
}

/**
 * LeaveRequestsController_cancel
 * DELETE /leave-requests/{id}
 * Cancel own pending leave request
 */
export async function cancelLeaveRequest(id: string): Promise<LeaveRequestResponse> {
  return apiClient.request<LeaveRequestResponse>(`/leave-requests/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'LeaveRequestsController_cancel',
    schema: LeaveRequestResponseSchema,
  });
}

/**
 * LeaveRequestsController_approve
 * POST /leave-requests/{id}/approve
 * Approve a pending leave request and update user balance
 */
export async function approveLeaveRequest(id: string): Promise<LeaveRequestResponse> {
  return apiClient.request<LeaveRequestResponse>(`/leave-requests/${id}/approve`, {
    method: 'POST',
    requiresAuth: true,
    operationId: 'LeaveRequestsController_approve',
    schema: LeaveRequestResponseSchema,
  });
}

/**
 * LeaveRequestsController_reject
 * POST /leave-requests/{id}/reject
 * Reject a pending leave request with an optional review note
 */
export async function rejectLeaveRequest(id: string, data?: unknown): Promise<LeaveRequestResponse> {
  return apiClient.request<LeaveRequestResponse>(`/leave-requests/${id}/reject`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    requiresAuth: true,
    operationId: 'LeaveRequestsController_reject',
    schema: LeaveRequestResponseSchema,
  });
}

/**
 * LeaveRequestsController_getUserBenefits
 * GET /leave-requests/users/{userId}/benefits
 * Retrieve all benefit balances for a user (PTO, sick leave, etc.)
 */
export async function getUserBenefitBalances(userId: string): Promise<BenefitBalancesResponse> {
  return apiClient.request<BenefitBalancesResponse>(`/leave-requests/users/${userId}/benefits`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'LeaveRequestsController_getUserBenefits',
    schema: BenefitBalancesResponseSchema,
  });
}
