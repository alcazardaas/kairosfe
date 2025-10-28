/**
 * Time Entries Service
 * Service layer for time entry operations
 */

import {
  findAllTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getWeeklyHours,
  getProjectHours,
} from '../endpoints/time-entries';
import type {
  TimeEntryListResponse,
  TimeEntryResponse,
  WeeklyHoursDto,
  ProjectHoursDto,
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
  tenantId: string;
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

    if (params?.userId) queryParams.append('user_id', params.userId);
    if (params?.weekStartDate) queryParams.append('week_start_date', params.weekStartDate);
    if (params?.weekEndDate) queryParams.append('week_end_date', params.weekEndDate);
    if (params?.projectId) queryParams.append('project_id', params.projectId);
    if (params?.dayOfWeek !== undefined) queryParams.append('day_of_week', params.dayOfWeek.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    return findAllTimeEntries(queryParams);
  },

  /**
   * Create a new time entry
   * @param data - Time entry data
   */
  async create(data: CreateTimeEntryParams): Promise<TimeEntryResponse> {
    return createTimeEntry({
      tenant_id: data.tenantId,
      user_id: data.userId,
      project_id: data.projectId,
      task_id: data.taskId,
      week_start_date: data.weekStartDate,
      day_of_week: data.dayOfWeek,
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
    return updateTimeEntry(id, data);
  },

  /**
   * Delete a time entry
   * @param id - Time entry ID
   */
  async delete(id: string): Promise<void> {
    return deleteTimeEntry(id);
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
};
