/**
 * Timesheets Service
 * Service layer for timesheet operations
 */

import {
  findAllTimesheets,
  findTimesheetById,
  createTimesheet as createTimesheetEndpoint,
  submitTimesheet as submitTimesheetEndpoint,
  approveTimesheet as approveTimesheetEndpoint,
  rejectTimesheet as rejectTimesheetEndpoint,
  validateTimesheet,
  recallTimesheet,
  getCurrentTimesheet,
} from '../endpoints/timesheets';
import type {
  TimesheetListResponse,
  TimesheetDto,
  ValidationResult,
} from '../schemas';

export interface GetTimesheetsParams {
  userId?: string;
  weekStart?: string;
  status?: string;
  team?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const timesheetsService = {
  /**
   * Get timesheets with optional filtering
   * @param params - Filter parameters
   */
  async getAll(params?: GetTimesheetsParams): Promise<TimesheetListResponse> {
    const queryParams: Record<string, string> = {};

    if (params?.userId) queryParams.userId = params.userId;
    if (params?.weekStart) queryParams.weekStartDate = params.weekStart; // Use camelCase weekStartDate
    if (params?.status) queryParams.status = params.status;
    if (params?.team) queryParams.team = params.team;
    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.pageSize) queryParams.limit = params.pageSize.toString();

    return findAllTimesheets(queryParams);
  },

  /**
   * Get a timesheet by ID
   * @param id - Timesheet ID
   */
  async getById(id: string): Promise<TimesheetDto> {
    const response = await findTimesheetById(id);
    return response.data;
  },

  /**
   * Get or create the current week's timesheet
   * Epic 1, Story 1: Simplified access
   */
  async getCurrent(): Promise<TimesheetDto> {
    const response = await getCurrentTimesheet();
    return response.data;
  },

  /**
   * Create a new draft timesheet
   * @param weekStartDate - Week start date (YYYY-MM-DD)
   * @param userId - User ID
   */
  async create(weekStartDate: string, userId: string): Promise<TimesheetDto> {
    const response = await createTimesheetEndpoint({
      weekStartDate: weekStartDate,
      userId: userId,
    });
    return response.data;
  },

  /**
   * Validate a timesheet before submission
   * Epic 3, Story 3: Pre-submission validation
   * @param id - Timesheet ID
   */
  async validate(id: string): Promise<ValidationResult> {
    return validateTimesheet(id);
  },

  /**
   * Submit a timesheet for approval
   * Epic 3, Story 1: Submit timesheet
   * @param id - Timesheet ID
   */
  async submit(id: string): Promise<TimesheetDto> {
    const response = await submitTimesheetEndpoint(id);
    return response.data;
  },

  /**
   * Recall a submitted timesheet back to draft
   * Epic 3, Story 5: Recall submitted timesheet
   * @param id - Timesheet ID
   */
  async recall(id: string): Promise<TimesheetDto> {
    const response = await recallTimesheet(id);
    return response.data;
  },

  /**
   * Approve a pending timesheet (manager action)
   * @param id - Timesheet ID
   */
  async approve(id: string): Promise<TimesheetDto> {
    const response = await approveTimesheetEndpoint(id);
    return response.data;
  },

  /**
   * Reject a pending timesheet (manager action)
   * @param id - Timesheet ID
   * @param reviewNote - Optional rejection reason
   */
  async reject(id: string, reviewNote?: string): Promise<TimesheetDto> {
    const response = await rejectTimesheetEndpoint(id, reviewNote ? { reviewNote: reviewNote } : undefined);
    return response.data;
  },
};

// Export named functions for component imports
export const getTimesheets = timesheetsService.getAll;
export const createTimesheet = timesheetsService.create;
export const submitTimesheet = timesheetsService.submit;
export const approveTimesheet = timesheetsService.approve;
export const rejectTimesheet = timesheetsService.reject;
export const validateTimesheetFn = timesheetsService.validate;
export const recallTimesheetFn = timesheetsService.recall;
