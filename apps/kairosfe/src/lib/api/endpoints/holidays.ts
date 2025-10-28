/**
 * Holiday endpoints
 * Generated from OpenAPI spec - Holidays tag
 */

import { apiClient } from '../client';
import type {
  HolidayListResponse,
  HolidayResponse,
} from '../schemas';
import {
  HolidayListResponseSchema,
  HolidayResponseSchema,
} from '../schemas';

/**
 * HolidaysController_findAll
 * GET /holidays
 * Retrieve a paginated list of holidays with optional filtering
 */
export async function findAllHolidays(): Promise<HolidayListResponse> {
  return apiClient.request<HolidayListResponse>('/holidays', {
    method: 'GET',
    requiresAuth: true,
    operationId: 'HolidaysController_findAll',
    schema: HolidayListResponseSchema,
  });
}

/**
 * HolidaysController_create
 * POST /holidays
 * Create a new holiday for a tenant
 */
export async function createHoliday(data: unknown): Promise<HolidayResponse> {
  return apiClient.request<HolidayResponse>('/holidays', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'HolidaysController_create',
    schema: HolidayResponseSchema,
  });
}

/**
 * HolidaysController_findOne
 * GET /holidays/{id}
 * Retrieve a holiday by its ID
 */
export async function findHolidayById(id: string): Promise<HolidayResponse> {
  return apiClient.request<HolidayResponse>(`/holidays/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'HolidaysController_findOne',
    schema: HolidayResponseSchema,
  });
}

/**
 * HolidaysController_update
 * PATCH /holidays/{id}
 * Update an existing holiday by its ID
 */
export async function updateHoliday(id: string, data: unknown): Promise<HolidayResponse> {
  return apiClient.request<HolidayResponse>(`/holidays/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'HolidaysController_update',
    schema: HolidayResponseSchema,
  });
}

/**
 * HolidaysController_remove
 * DELETE /holidays/{id}
 * Delete a holiday by its ID
 */
export async function deleteHoliday(id: string): Promise<void> {
  return apiClient.request<void>(`/holidays/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'HolidaysController_remove',
  });
}
