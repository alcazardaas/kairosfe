/**
 * Timesheet Policy endpoints
 * Generated from OpenAPI spec - Timesheet Policies tag
 */

import { apiClient } from '../client';
import type {
  TimesheetPolicyListResponse,
  TimesheetPolicyResponse,
} from '../schemas';
import {
  TimesheetPolicyListResponseSchema,
  TimesheetPolicyResponseSchema,
} from '../schemas';

/**
 * TimesheetPoliciesController_findAll
 * GET /timesheet-policies
 * Retrieve all timesheet policies across tenants
 */
export async function findAllTimesheetPolicies(): Promise<TimesheetPolicyListResponse> {
  return apiClient.request<TimesheetPolicyListResponse>('/timesheet-policies', {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimesheetPoliciesController_findAll',
    schema: TimesheetPolicyListResponseSchema,
  });
}

/**
 * TimesheetPoliciesController_create
 * POST /timesheet-policies
 * Create a new timesheet policy for a tenant
 */
export async function createTimesheetPolicy(data: unknown): Promise<TimesheetPolicyResponse> {
  return apiClient.request<TimesheetPolicyResponse>('/timesheet-policies', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimesheetPoliciesController_create',
    schema: TimesheetPolicyResponseSchema,
  });
}

/**
 * TimesheetPoliciesController_findOne
 * GET /timesheet-policies/{tenantId}
 * Retrieve the timesheet policy configuration for a specific tenant
 */
export async function findTimesheetPolicyByTenantId(tenantId: string): Promise<TimesheetPolicyResponse> {
  return apiClient.request<TimesheetPolicyResponse>(`/timesheet-policies/${tenantId}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimesheetPoliciesController_findOne',
    schema: TimesheetPolicyResponseSchema,
  });
}

/**
 * TimesheetPoliciesController_update
 * PATCH /timesheet-policies/{tenantId}
 * Update the timesheet policy configuration for a tenant
 */
export async function updateTimesheetPolicy(tenantId: string, data: unknown): Promise<TimesheetPolicyResponse> {
  return apiClient.request<TimesheetPolicyResponse>(`/timesheet-policies/${tenantId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimesheetPoliciesController_update',
    schema: TimesheetPolicyResponseSchema,
  });
}

/**
 * TimesheetPoliciesController_remove
 * DELETE /timesheet-policies/{tenantId}
 * Delete the timesheet policy for a tenant
 */
export async function deleteTimesheetPolicy(tenantId: string): Promise<void> {
  return apiClient.request<void>(`/timesheet-policies/${tenantId}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'TimesheetPoliciesController_remove',
  });
}
