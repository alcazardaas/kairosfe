/**
 * Calendar endpoints
 * Generated from OpenAPI spec - Calendar tag
 */

import { apiClient } from '../client';
import type { CalendarResponse } from '../schemas';
import { CalendarResponseSchema } from '../schemas';

interface CalendarQueryParams {
  userId?: string;
  from: string;
  to: string;
  include?: string;
}

/**
 * CalendarController_getCalendar
 * GET /calendar
 * Retrieve a unified calendar feed including holidays, leave requests, and timesheets for a user
 */
export async function getCalendar(params: CalendarQueryParams): Promise<CalendarResponse> {
  const searchParams = new URLSearchParams();
  if (params.userId) {
    searchParams.append('userId', params.userId);
  }
  searchParams.append('from', params.from);
  searchParams.append('to', params.to);
  if (params.include) {
    searchParams.append('include', params.include);
  }

  return apiClient.request<CalendarResponse>(`/calendar?${searchParams.toString()}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'CalendarController_getCalendar',
    schema: CalendarResponseSchema,
  });
}
