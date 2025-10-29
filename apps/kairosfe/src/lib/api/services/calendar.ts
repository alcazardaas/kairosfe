import { apiClient } from '../client';
import type { CalendarData, CalendarParams, Holiday, HolidaysResponse, HolidaysParams } from '@kairos/shared';

/**
 * Get calendar data (holidays and leaves) for a date range
 */
export async function getCalendarData(params: CalendarParams): Promise<CalendarData> {
  const queryParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  if (params.userId) {
    queryParams.append('user_id', params.userId);
  }

  if (params.include && params.include.length > 0) {
    queryParams.append('include', params.include.join(','));
  }

  const response = await apiClient.get<{ data: any[]; meta: any }>(`/calendar?${queryParams.toString()}`, true);

  // The API returns { data: array of calendar items, meta: {...} }
  // Transform to CalendarData format
  return {
    events: [], // Will need to map from response.data
    holidays: [],
    leaves: []
  };
}

/**
 * Get holidays with advanced filtering and pagination
 * @param params - Optional query parameters for filtering holidays
 * @returns Paginated holidays response with metadata
 */
export async function getHolidays(params?: HolidaysParams): Promise<HolidaysResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.tenant_id) queryParams.append('tenant_id', params.tenant_id);
  if (params?.country_code) queryParams.append('country_code', params.country_code);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.upcoming !== undefined) queryParams.append('upcoming', params.upcoming.toString());
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = `/holidays${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<HolidaysResponse>(endpoint, true);
}

/**
 * Check if a date range overlaps with holidays or existing leaves
 */
export interface OverlapCheck {
  hasOverlap: boolean;
  holidays: Holiday[];
  leaves: { userId: string; userName: string; startDate: string; endDate: string }[];
  message?: string;
}

export async function checkDateOverlap(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<OverlapCheck> {
  const queryParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  if (userId) {
    queryParams.append('user_id', userId);
  }

  return apiClient.get<OverlapCheck>(`/calendar/check-overlap?${queryParams.toString()}`, true);
}
