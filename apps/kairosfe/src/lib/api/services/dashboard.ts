/**
 * Dashboard API Service
 * Provides endpoints for dashboard statistics and aggregations
 */

import { apiClient } from '../client';
import type { WeeklyStats, UserProjectStats } from '@kairos/shared';

/**
 * Get weekly statistics with daily breakdown
 * @param userId - User ID
 * @param weekStartDate - Week start date in YYYY-MM-DD format
 * @returns Weekly statistics with hours per day breakdown
 */
export async function getWeeklyStats(
  userId: string,
  weekStartDate: string
): Promise<WeeklyStats> {
  return apiClient.get<WeeklyStats>(
    `/time-entries/stats/weekly/${userId}/${weekStartDate}`,
    true // requiresAuth
  );
}

/**
 * Get user project statistics with percentage distribution
 * @param userId - User ID
 * @param params - Optional query parameters for filtering
 * @returns User project statistics with aggregated hours and percentages
 */
export async function getUserProjectStats(
  userId: string,
  params?: {
    weekStartDate?: string; // YYYY-MM-DD - Filter for specific week
    startDate?: string; // YYYY-MM-DD - Filter from date
    endDate?: string; // YYYY-MM-DD - Filter to date
  }
): Promise<UserProjectStats> {
  const queryParams = new URLSearchParams();

  if (params?.weekStartDate) {
    queryParams.append('weekStartDate', params.weekStartDate);
  }
  if (params?.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    queryParams.append('endDate', params.endDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/time-entries/stats/user-projects/${userId}${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<UserProjectStats>(endpoint, true);
}
