/**
 * Timesheet endpoints
 * Generated from OpenAPI spec - Timesheets tag
 */

import { apiClient } from '../client';
import type {
  TimesheetListResponse,
  TimesheetResponse,
} from '../schemas';
import {
  TimesheetListResponseSchema,
  TimesheetResponseSchema,
} from '../schemas';

interface TimesheetQueryParams {
  user_id?: string;
  week_start?: string;
  status?: string;
  team?: string;
  from?: string;
  to?: string;
  page?: string;
  page_size?: string;
}

/**
 * TimesheetsController_findAll
 * GET /timesheets
 * Retrieve timesheets with optional filters
 */
export async function findAllTimesheets(params?: TimesheetQueryParams): Promise<TimesheetListResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
  }
  const queryString = searchParams.toString();
  const path = queryString ? `/timesheets?${queryString}` : '/timesheets';

  return apiClient.request<TimesheetListResponse>(path, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimesheetsController_findAll',
    schema: TimesheetListResponseSchema,
  });
}

/**
 * TimesheetsController_create
 * POST /timesheets
 * Create a new draft timesheet for a user and week
 */
export async function createTimesheet(data: unknown): Promise<TimesheetResponse> {
  return apiClient.request<TimesheetResponse>('/timesheets', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimesheetsController_create',
    schema: TimesheetResponseSchema,
  });
}

/**
 * TimesheetsController_findOne
 * GET /timesheets/{id}
 * Retrieve a timesheet by its ID, including associated time entries
 */
export async function findTimesheetById(id: string): Promise<TimesheetResponse> {
  return apiClient.request<TimesheetResponse>(`/timesheets/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimesheetsController_findOne',
    schema: TimesheetResponseSchema,
  });
}

/**
 * TimesheetsController_remove
 * DELETE /timesheets/{id}
 * Delete a draft timesheet
 */
export async function deleteTimesheet(id: string): Promise<void> {
  return apiClient.request<void>(`/timesheets/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'TimesheetsController_remove',
  });
}

/**
 * TimesheetsController_submit
 * POST /timesheets/{id}/submit
 * Submit a draft timesheet for manager approval
 */
export async function submitTimesheet(id: string): Promise<TimesheetResponse> {
  return apiClient.request<TimesheetResponse>(`/timesheets/${id}/submit`, {
    method: 'POST',
    requiresAuth: true,
    operationId: 'TimesheetsController_submit',
    schema: TimesheetResponseSchema,
  });
}

/**
 * TimesheetsController_approve
 * POST /timesheets/{id}/approve
 * Approve a pending timesheet
 */
export async function approveTimesheet(id: string): Promise<TimesheetResponse> {
  return apiClient.request<TimesheetResponse>(`/timesheets/${id}/approve`, {
    method: 'POST',
    requiresAuth: true,
    operationId: 'TimesheetsController_approve',
    schema: TimesheetResponseSchema,
  });
}

/**
 * TimesheetsController_reject
 * POST /timesheets/{id}/reject
 * Reject a pending timesheet with an optional review note
 */
export async function rejectTimesheet(id: string, data?: unknown): Promise<TimesheetResponse> {
  return apiClient.request<TimesheetResponse>(`/timesheets/${id}/reject`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    requiresAuth: true,
    operationId: 'TimesheetsController_reject',
    schema: TimesheetResponseSchema,
  });
}
