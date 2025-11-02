import { apiClient } from '../client';
import type {
  CalendarData,
  CalendarParams,
  CalendarEvent,
  Holiday,
  LeaveRequest,
  HolidaysResponse,
  HolidaysParams,
} from '@kairos/shared';

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
  const events: CalendarEvent[] = [];
  const holidays: Holiday[] = [];
  const leaves: LeaveRequest[] = [];

  if (response.data && Array.isArray(response.data)) {
    response.data.forEach((item: any) => {
      if (item.type === 'holiday') {
        holidays.push(item as Holiday);
        events.push({
          id: item.id,
          type: 'holiday',
          date: item.date,
          title: item.name,
        });
      } else if (item.type === 'leave') {
        leaves.push(item as LeaveRequest);
        events.push({
          id: item.id,
          type: 'leave',
          date: item.start_date,
          title: `${item.user_name || 'Leave'} - ${item.benefit_type_name || 'Leave'}`,
          userId: item.user_id,
          userName: item.user_name,
        });
      }
    });
  }

  return {
    events,
    holidays,
    leaves,
  };
}

/**
 * Get team calendar data for multiple users
 */
export async function getTeamCalendarData(
  from: string,
  to: string,
  userIds?: string[]
): Promise<CalendarData> {
  // If no specific users, get all team calendar data
  if (!userIds || userIds.length === 0) {
    return getCalendarData({
      from,
      to,
      include: ['holidays', 'leave'],
    });
  }

  // Fetch data for multiple users and combine
  const promises = userIds.map((userId) =>
    getCalendarData({
      from,
      to,
      userId,
      include: ['holidays', 'leave'],
    })
  );

  const results = await Promise.all(promises);

  // Combine all results, deduplicating holidays
  const combinedEvents: CalendarEvent[] = [];
  const combinedHolidays: Holiday[] = [];
  const combinedLeaves: LeaveRequest[] = [];
  const holidayIds = new Set<string>();

  results.forEach((result) => {
    // Add leaves (unique per user)
    combinedLeaves.push(...result.leaves);

    // Add holidays (deduplicate)
    result.holidays.forEach((holiday) => {
      if (!holidayIds.has(holiday.id)) {
        holidayIds.add(holiday.id);
        combinedHolidays.push(holiday);
      }
    });

    // Add events
    combinedEvents.push(...result.events);
  });

  return {
    events: combinedEvents,
    holidays: combinedHolidays,
    leaves: combinedLeaves,
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

/**
 * Date utility functions for calendar operations
 */

/**
 * Get date range for a week containing the given date
 */
export function getWeekRange(date: Date): { from: string; to: string } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day; // Adjust to Sunday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);

  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

/**
 * Get date range for a month containing the given date
 */
export function getMonthRange(date: Date): { from: string; to: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

/**
 * Get array of dates in a range
 */
export function getDatesInRange(from: string, to: string): Date[] {
  const dates: Date[] = [];
  const start = new Date(from);
  const end = new Date(to);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
