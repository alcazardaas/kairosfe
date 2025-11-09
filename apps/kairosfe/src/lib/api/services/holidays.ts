/**
 * Holidays Service
 * Service layer for holiday operations
 */

import {
  findAllHolidays,
  findHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../endpoints/holidays';
import type { HolidayListResponse, HolidayResponse } from '../schemas/holidays';

export interface CreateHolidayDto {
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  isRecurring: boolean;
}

export interface UpdateHolidayDto {
  name?: string;
  date?: string; // ISO date string (YYYY-MM-DD)
  isRecurring?: boolean;
}

export const holidaysService = {
  /**
   * Get all holidays
   */
  async getAll(): Promise<HolidayListResponse> {
    return findAllHolidays();
  },

  /**
   * Get a single holiday by ID
   */
  async getById(id: string): Promise<HolidayResponse> {
    return findHolidayById(id);
  },

  /**
   * Create a new holiday
   */
  async create(data: CreateHolidayDto): Promise<HolidayResponse> {
    return createHoliday(data);
  },

  /**
   * Update an existing holiday
   */
  async update(id: string, data: UpdateHolidayDto): Promise<HolidayResponse> {
    return updateHoliday(id, data);
  },

  /**
   * Delete a holiday
   */
  async delete(id: string): Promise<void> {
    return deleteHoliday(id);
  },
};
