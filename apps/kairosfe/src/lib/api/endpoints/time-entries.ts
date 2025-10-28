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
} from '../schemas';
import {
  TimeEntryListResponseSchema,
  TimeEntryResponseSchema,
  WeeklyHoursDtoSchema,
  ProjectHoursDtoSchema,
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
