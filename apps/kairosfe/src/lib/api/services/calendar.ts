import { apiClient } from '../client';
import type { CalendarData, CalendarParams, Holiday } from '@kairos/shared';

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
 * Get public holidays for a specific year
 */
export async function getHolidays(year: number): Promise<Holiday[]> {
  return apiClient.get<Holiday[]>(`/holidays?year=${year}`, true);
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
