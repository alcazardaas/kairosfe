/**
 * Time Entry endpoints
 * Generated from OpenAPI spec - Time Entries tag
 */

import { apiClient } from '../client';
import type {
  TimeEntryListResponse,
  TimeEntryResponse,
  WeeklyHoursDto,
  ProjectHoursDto,
  WeekViewResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  CopyWeekRequest,
} from '../schemas';
import {
  TimeEntryListResponseSchema,
  TimeEntryResponseSchema,
  WeeklyHoursDtoSchema,
  ProjectHoursDtoSchema,
  WeekViewResponseSchema,
  BulkOperationResponseSchema,
} from '../schemas';

/**
 * TimeEntriesController_findAll
 * GET /time-entries
 * Retrieve a paginated list of time entries with optional filtering and sorting
 * @param params - Optional query parameters for filtering
 */
export async function findAllTimeEntries(params?: URLSearchParams): Promise<TimeEntryListResponse> {
  const url = params ? `/time-entries?${params.toString()}` : '/time-entries';
  return apiClient.request<TimeEntryListResponse>(url, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimeEntriesController_findAll',
    schema: TimeEntryListResponseSchema,
  });
}

/**
 * TimeEntriesController_create
 * POST /time-entries
 * Create a new time entry for logging work hours
 */
export async function createTimeEntry(data: unknown): Promise<TimeEntryResponse> {
  return apiClient.request<TimeEntryResponse>('/time-entries', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimeEntriesController_create',
    schema: TimeEntryResponseSchema,
  });
}

/**
 * TimeEntriesController_findOne
 * GET /time-entries/{id}
 * Retrieve a time entry by its ID
 */
export async function findTimeEntryById(id: string): Promise<TimeEntryResponse> {
  return apiClient.request<TimeEntryResponse>(`/time-entries/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimeEntriesController_findOne',
    schema: TimeEntryResponseSchema,
  });
}

/**
 * TimeEntriesController_update
 * PATCH /time-entries/{id}
 * Update an existing time entry by its ID
 */
export async function updateTimeEntry(id: string, data: unknown): Promise<TimeEntryResponse> {
  return apiClient.request<TimeEntryResponse>(`/time-entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimeEntriesController_update',
    schema: TimeEntryResponseSchema,
  });
}

/**
 * TimeEntriesController_remove
 * DELETE /time-entries/{id}
 * Delete a time entry by its ID
 */
export async function deleteTimeEntry(id: string): Promise<void> {
  return apiClient.request<void>(`/time-entries/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'TimeEntriesController_remove',
  });
}

/**
 * TimeEntriesController_getWeeklyHours
 * GET /time-entries/stats/weekly/{userId}/{weekStartDate}
 * Calculate total hours worked by a user for a specific week
 */
export async function getWeeklyHours(userId: string, weekStartDate: string): Promise<WeeklyHoursDto> {
  return apiClient.request<WeeklyHoursDto>(`/time-entries/stats/weekly/${userId}/${weekStartDate}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimeEntriesController_getWeeklyHours',
    schema: WeeklyHoursDtoSchema,
  });
}

/**
 * TimeEntriesController_getProjectHours
 * GET /time-entries/stats/project/{projectId}
 * Calculate total hours logged to a specific project
 */
export async function getProjectHours(projectId: string): Promise<ProjectHoursDto> {
  return apiClient.request<ProjectHoursDto>(`/time-entries/stats/project/${projectId}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimeEntriesController_getProjectHours',
    schema: ProjectHoursDtoSchema,
  });
}

/**
 * TimeEntriesController_getWeekView
 * GET /time-entries/week/{userId}/{weekStartDate}
 * Optimized endpoint to get complete week view with entries, totals, and project breakdown
 * Epic 1, Story 1: View Weekly Timesheet
 */
export async function getWeekView(userId: string, weekStartDate: string): Promise<WeekViewResponse> {
  // Make request without schema validation (we'll transform then validate)
  const backendResponse = await apiClient.request<any>(`/time-entries/week/${userId}/${weekStartDate}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TimeEntriesController_getWeekView',
  });

  // Transform backend response format to frontend format
  const transformedResponse: WeekViewResponse = {
    // Handle null timesheet when no timesheet exists for the week
    timesheet: backendResponse.timesheet ? {
      id: backendResponse.timesheet.id,
      userId: backendResponse.user_id || userId,
      weekStartDate: backendResponse.week_start_date || weekStartDate,
      status: backendResponse.timesheet.status,
      submittedAt: backendResponse.timesheet.submitted_at || null,
      reviewedAt: backendResponse.timesheet.reviewed_at || null,
      reviewNote: backendResponse.timesheet.review_note || null,
    } : null,
    entries: backendResponse.entries || [],
    // Transform dailyTotals from number array to object array
    dailyTotals: (backendResponse.daily_totals || []).map((hours: number, index: number) => ({
      dayOfWeek: index,
      totalHours: hours,
    })),
    weeklyTotal: backendResponse.weekly_total || 0,
    // Transform projectBreakdown from object to array
    projectBreakdown: Object.entries(backendResponse.by_project || {}).map(([projectId, data]: [string, any]) => ({
      projectId,
      projectName: data.project_name || data.projectName || 'Unknown Project',
      totalHours: data.hours || data.totalHours || 0,
    })),
  };

  // Validate the transformed response
  const validationResult = WeekViewResponseSchema.safeParse(transformedResponse);
  if (!validationResult.success) {
    console.error('Transformed response validation failed:', validationResult.error);
  }

  return transformedResponse;
}

/**
 * TimeEntriesController_bulkSave
 * POST /time-entries/bulk
 * Bulk create or update multiple time entries
 * Epic 2, Story 4 & 5: Fill Week & Bulk Operations
 */
export async function bulkSaveTimeEntries(data: BulkOperationRequest): Promise<BulkOperationResponse> {
  return apiClient.request<BulkOperationResponse>('/time-entries/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimeEntriesController_bulkSave',
    schema: BulkOperationResponseSchema,
  });
}

/**
 * TimeEntriesController_copyWeek
 * POST /time-entries/copy-week
 * Copy all time entries from one week to another
 * Epic 2, Story 6: Copy Previous Week
 */
export async function copyWeek(data: CopyWeekRequest): Promise<BulkOperationResponse> {
  return apiClient.request<BulkOperationResponse>('/time-entries/copy-week', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TimeEntriesController_copyWeek',
    schema: BulkOperationResponseSchema,
  });
}
