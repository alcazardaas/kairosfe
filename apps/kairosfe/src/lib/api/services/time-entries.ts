/**
 * Time Entries Service
 * Service layer for time entry operations
 */

import {
  findAllTimeEntries,
  createTimeEntry as createTimeEntryEndpoint,
  updateTimeEntry as updateTimeEntryEndpoint,
  deleteTimeEntry as deleteTimeEntryEndpoint,
  getWeeklyHours,
  getProjectHours,
  getWeekView,
  bulkSaveTimeEntries,
  copyWeek,
} from '../endpoints/time-entries';
import type {
  TimeEntryListResponse,
  TimeEntryResponse,
  WeeklyHoursDto,
  ProjectHoursDto,
  WeekViewResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  CopyWeekRequest,
} from '../schemas/time-entries';

export interface GetTimeEntriesParams {
  userId?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  projectId?: string;
  dayOfWeek?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateTimeEntryParams {
  userId: string;
  projectId: string;
  taskId: string | null;
  weekStartDate: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  hours: number;
  note?: string;
}

export interface UpdateTimeEntryParams {
  hours?: number;
  note?: string;
}

export const timeEntriesService = {
  /**
   * Get time entries with optional filtering
   * @param params - Filter parameters
   */
  async getAll(params?: GetTimeEntriesParams): Promise<TimeEntryListResponse> {
    const queryParams = new URLSearchParams();

    // Use camelCase for query parameters (backend accepts both but camelCase is preferred)
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.weekStartDate) queryParams.append('weekStartDate', params.weekStartDate);
    if (params?.weekEndDate) queryParams.append('weekEndDate', params.weekEndDate);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.dayOfWeek !== undefined) queryParams.append('dayOfWeek', params.dayOfWeek.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    return findAllTimeEntries(queryParams);
  },

  /**
   * Create a new time entry
   * @param data - Time entry data
   * Note: tenantId is derived from JWT on backend
   */
  async create(data: CreateTimeEntryParams): Promise<TimeEntryResponse> {
    return createTimeEntryEndpoint({
      // tenantId removed - backend derives from JWT
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      weekStartDate: data.weekStartDate,
      dayOfWeek: data.dayOfWeek,
      hours: data.hours,
      note: data.note,
    });
  },

  /**
   * Update an existing time entry (only hours and note can be updated)
   * @param id - Time entry ID
   * @param data - Updated fields
   */
  async update(id: string, data: UpdateTimeEntryParams): Promise<TimeEntryResponse> {
    return updateTimeEntryEndpoint(id, data);
  },

  /**
   * Delete a time entry
   * @param id - Time entry ID
   */
  async delete(id: string): Promise<void> {
    return deleteTimeEntryEndpoint(id);
  },

  /**
   * Get weekly hours total for a user
   * @param userId - User ID
   * @param weekStartDate - Week start date (YYYY-MM-DD)
   */
  async getWeeklyTotal(userId: string, weekStartDate: string): Promise<WeeklyHoursDto> {
    return getWeeklyHours(userId, weekStartDate);
  },

  /**
   * Get total hours logged to a project
   * @param projectId - Project ID
   */
  async getProjectTotal(projectId: string): Promise<ProjectHoursDto> {
    return getProjectHours(projectId);
  },

  /**
   * Get optimized week view with entries, totals, and project breakdown
   * Epic 1, Story 1: View Weekly Timesheet
   * @param userId - User ID
   * @param weekStartDate - Week start date (YYYY-MM-DD)
   */
  async getWeekView(userId: string, weekStartDate: string): Promise<WeekViewResponse> {
    return getWeekView(userId, weekStartDate);
  },

  /**
   * Bulk save time entries (create/update multiple entries)
   * Epic 2, Story 4 & 5: Fill Week functionality
   * @param request - Bulk operation request
   */
  async bulkSave(request: BulkOperationRequest): Promise<BulkOperationResponse> {
    return bulkSaveTimeEntries(request);
  },

  /**
   * Copy all time entries from one week to another
   * Epic 2, Story 6: Copy Previous Week
   * @param fromWeekStart - Source week start date (YYYY-MM-DD)
   * @param toWeekStart - Target week start date (YYYY-MM-DD)
   */
  async copyWeek(fromWeekStart: string, toWeekStart: string): Promise<BulkOperationResponse> {
    const request: CopyWeekRequest = {
      fromWeekStart,
      toWeekStart,
    };
    return copyWeek(request);
  },
};

// Export named functions for component imports
export const getTimeEntries = timeEntriesService.getAll;
export const createTimeEntry = timeEntriesService.create;
export const updateTimeEntry = timeEntriesService.update;
export const deleteTimeEntry = timeEntriesService.delete;
