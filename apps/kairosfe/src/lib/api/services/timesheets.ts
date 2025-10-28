import { apiClient } from '../client';
import type { Timesheet, TimeEntry, WeeklyStats, ProjectStats, Project, Task } from '@kairos/shared';

export interface CreateTimesheetRequest {
  weekStart: string; // ISO date string (Monday)
}

export interface CreateTimeEntryRequest {
  timesheetId: string;
  projectId: string;
  taskId: string;
  date: string;
  hours: number;
  notes?: string;
}

export interface UpdateTimeEntryRequest {
  projectId?: string;
  taskId?: string;
  hours?: number;
  notes?: string;
}

// Timesheets
export async function getTimesheets(params: {
  userId?: string;
  weekStart?: string;
  status?: string;
  team?: boolean;
}): Promise<Timesheet[]> {
  const queryParams = new URLSearchParams();
  if (params.userId) queryParams.append('user_id', params.userId);
  if (params.weekStart) queryParams.append('week_start', params.weekStart);
  if (params.status) queryParams.append('status', params.status);
  if (params.team !== undefined) queryParams.append('team', params.team.toString());

  const query = queryParams.toString();
  return apiClient.get<Timesheet[]>(`/timesheets${query ? `?${query}` : ''}`, true);
}

export async function getTimesheet(id: string): Promise<Timesheet> {
  return apiClient.get<Timesheet>(`/timesheets/${id}`, true);
}

export async function createTimesheet(data: CreateTimesheetRequest): Promise<Timesheet> {
  return apiClient.post<Timesheet>('/timesheets', data, true);
}

export async function submitTimesheet(id: string): Promise<Timesheet> {
  return apiClient.post<Timesheet>(`/timesheets/${id}/submit`, {}, true);
}

export async function approveTimesheet(id: string): Promise<Timesheet> {
  return apiClient.post<Timesheet>(`/timesheets/${id}/approve`, {}, true);
}

export async function rejectTimesheet(id: string, reason: string): Promise<Timesheet> {
  return apiClient.post<Timesheet>(`/timesheets/${id}/reject`, { reason }, true);
}

// Time Entries
export async function getTimeEntries(params: {
  timesheetId?: string;
  userId?: string;
  weekStart?: string;
}): Promise<TimeEntry[]> {
  const queryParams = new URLSearchParams();
  if (params.timesheetId) queryParams.append('timesheet_id', params.timesheetId);
  if (params.userId) queryParams.append('user_id', params.userId);
  if (params.weekStart) queryParams.append('week_start', params.weekStart);

  const query = queryParams.toString();
  return apiClient.get<TimeEntry[]>(`/time-entries${query ? `?${query}` : ''}`, true);
}

export async function createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntry> {
  return apiClient.post<TimeEntry>('/time-entries', data, true);
}

export async function updateTimeEntry(id: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
  return apiClient.patch<TimeEntry>(`/time-entries/${id}`, data, true);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  return apiClient.delete<void>(`/time-entries/${id}`, true);
}

// Stats
export async function getWeeklyStats(params: {
  userId: string;
  weekStart?: string;
}): Promise<WeeklyStats> {
  const queryParams = new URLSearchParams();
  queryParams.append('user_id', params.userId);
  if (params.weekStart) queryParams.append('week_start', params.weekStart);

  return apiClient.get<WeeklyStats>(`/time-entries/stats/weekly?${queryParams.toString()}`, true);
}

export async function getProjectStats(params: {
  userId: string;
  from?: string;
  to?: string;
}): Promise<ProjectStats[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('user_id', params.userId);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);

  return apiClient.get<ProjectStats[]>(`/time-entries/stats/project?${queryParams.toString()}`, true);
}

// Projects and Tasks
export async function searchProjects(query: string): Promise<Project[]> {
  return apiClient.get<Project[]>(`/search/projects?q=${encodeURIComponent(query)}`, true);
}

export async function searchTasks(query: string, projectId?: string): Promise<Task[]> {
  const params = new URLSearchParams({ q: query });
  if (projectId) params.append('project_id', projectId);
  return apiClient.get<Task[]>(`/search/tasks?${params.toString()}`, true);
}
