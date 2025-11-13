/**
 * Comprehensive tests for Timesheets Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timesheetsService } from './timesheets';
import * as timesheetsEndpoints from '../endpoints/timesheets';
import type { TimesheetDto } from '../schemas';

// Mock all endpoint functions
vi.mock('../endpoints/timesheets');

describe('timesheetsService', () => {
  const mockTimesheet: TimesheetDto = {
    id: '1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    weekStartDate: '2025-01-13',
    status: 'draft',
    totalHours: 40,
    submittedAt: null,
    reviewedAt: null,
    reviewedByUserId: null,
    reviewNote: null,
    createdAt: '2025-01-13T10:00:00.000Z',
    updatedAt: '2025-01-13T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch timesheets without parameters', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      const result = await timesheetsService.getAll();

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });

    it('should fetch timesheets with userId filter', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({ userId: 'user-1' });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });

    it('should fetch timesheets with weekStart filter', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({ weekStart: '2025-01-13' });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        weekStartDate: '2025-01-13',
      });
    });

    it('should fetch timesheets with status filter', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({ status: 'pending' });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        status: 'pending',
      });
    });

    it('should fetch timesheets with team filter', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({ team: 'true' });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        team: 'true',
      });
    });

    it('should fetch timesheets with date range filters', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-01-31',
      });
    });

    it('should fetch timesheets with pagination', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 100,
        page: 2,
        pageSize: 20,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({ page: 2, pageSize: 20 });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        page: '2',
        limit: '20',
      });
    });

    it('should fetch timesheets with all parameters combined', async () => {
      const mockResponse = {
        data: [mockTimesheet],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timesheetsEndpoints.findAllTimesheets).mockResolvedValue(mockResponse);

      await timesheetsService.getAll({
        userId: 'user-1',
        weekStart: '2025-01-13',
        status: 'draft',
        team: 'true',
        from: '2025-01-01',
        to: '2025-01-31',
        page: 1,
        pageSize: 10,
      });

      expect(timesheetsEndpoints.findAllTimesheets).toHaveBeenCalledWith({
        userId: 'user-1',
        weekStartDate: '2025-01-13',
        status: 'draft',
        team: 'true',
        from: '2025-01-01',
        to: '2025-01-31',
        page: '1',
        limit: '10',
      });
    });
  });

  describe('getById', () => {
    it('should fetch timesheet by ID', async () => {
      const mockResponse = {
        data: mockTimesheet,
      };

      vi.mocked(timesheetsEndpoints.findTimesheetById).mockResolvedValue(mockResponse);

      const result = await timesheetsService.getById('1');

      expect(timesheetsEndpoints.findTimesheetById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTimesheet);
    });

    it('should throw error if timesheet not found', async () => {
      vi.mocked(timesheetsEndpoints.findTimesheetById).mockRejectedValue(
        new Error('Timesheet not found')
      );

      await expect(timesheetsService.getById('non-existent')).rejects.toThrow(
        'Timesheet not found'
      );
    });
  });

  describe('getCurrent', () => {
    it('should fetch current week timesheet', async () => {
      const mockResponse = {
        data: mockTimesheet,
      };

      vi.mocked(timesheetsEndpoints.getCurrentTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.getCurrent();

      expect(timesheetsEndpoints.getCurrentTimesheet).toHaveBeenCalled();
      expect(result).toEqual(mockTimesheet);
    });

    it('should handle error when no current timesheet exists', async () => {
      vi.mocked(timesheetsEndpoints.getCurrentTimesheet).mockRejectedValue(
        new Error('No timesheet for current week')
      );

      await expect(timesheetsService.getCurrent()).rejects.toThrow(
        'No timesheet for current week'
      );
    });
  });

  describe('create', () => {
    it('should create new timesheet', async () => {
      const mockResponse = {
        data: mockTimesheet,
      };

      vi.mocked(timesheetsEndpoints.createTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.create('2025-01-13', 'user-1');

      expect(timesheetsEndpoints.createTimesheet).toHaveBeenCalledWith({
        weekStartDate: '2025-01-13',
        userId: 'user-1',
      });
      expect(result).toEqual(mockTimesheet);
    });

    it('should handle creation error', async () => {
      vi.mocked(timesheetsEndpoints.createTimesheet).mockRejectedValue(
        new Error('Timesheet already exists for this week')
      );

      await expect(
        timesheetsService.create('2025-01-13', 'user-1')
      ).rejects.toThrow('Timesheet already exists for this week');
    });
  });

  describe('validate', () => {
    it('should validate timesheet successfully', async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
      };

      vi.mocked(timesheetsEndpoints.validateTimesheet).mockResolvedValue(
        mockValidationResult
      );

      const result = await timesheetsService.validate('1');

      expect(timesheetsEndpoints.validateTimesheet).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockValidationResult);
      expect(result.isValid).toBe(true);
    });

    it('should validate timesheet with errors', async () => {
      const mockValidationResult = {
        isValid: false,
        errors: ['Total hours exceed policy limit', 'Missing required entries'],
      };

      vi.mocked(timesheetsEndpoints.validateTimesheet).mockResolvedValue(
        mockValidationResult
      );

      const result = await timesheetsService.validate('1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('submit', () => {
    it('should submit timesheet for approval', async () => {
      const submittedTimesheet = {
        ...mockTimesheet,
        status: 'pending' as const,
        submittedAt: '2025-01-15T10:00:00.000Z',
      };

      const mockResponse = {
        data: submittedTimesheet,
      };

      vi.mocked(timesheetsEndpoints.submitTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.submit('1');

      expect(timesheetsEndpoints.submitTimesheet).toHaveBeenCalledWith('1');
      expect(result).toEqual(submittedTimesheet);
      expect(result.status).toBe('pending');
      expect(result.submittedAt).toBeTruthy();
    });

    it('should handle submission error', async () => {
      vi.mocked(timesheetsEndpoints.submitTimesheet).mockRejectedValue(
        new Error('Cannot submit incomplete timesheet')
      );

      await expect(timesheetsService.submit('1')).rejects.toThrow(
        'Cannot submit incomplete timesheet'
      );
    });
  });

  describe('recall', () => {
    it('should recall submitted timesheet', async () => {
      const recalledTimesheet = {
        ...mockTimesheet,
        status: 'draft' as const,
        submittedAt: null,
      };

      const mockResponse = {
        data: recalledTimesheet,
      };

      vi.mocked(timesheetsEndpoints.recallTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.recall('1');

      expect(timesheetsEndpoints.recallTimesheet).toHaveBeenCalledWith('1');
      expect(result).toEqual(recalledTimesheet);
      expect(result.status).toBe('draft');
      expect(result.submittedAt).toBeNull();
    });

    it('should handle recall error', async () => {
      vi.mocked(timesheetsEndpoints.recallTimesheet).mockRejectedValue(
        new Error('Cannot recall approved timesheet')
      );

      await expect(timesheetsService.recall('1')).rejects.toThrow(
        'Cannot recall approved timesheet'
      );
    });
  });

  describe('approve', () => {
    it('should approve pending timesheet', async () => {
      const approvedTimesheet = {
        ...mockTimesheet,
        status: 'approved' as const,
        reviewedAt: '2025-01-16T10:00:00.000Z',
        reviewedByUserId: 'manager-1',
      };

      const mockResponse = {
        data: approvedTimesheet,
      };

      vi.mocked(timesheetsEndpoints.approveTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.approve('1');

      expect(timesheetsEndpoints.approveTimesheet).toHaveBeenCalledWith('1');
      expect(result).toEqual(approvedTimesheet);
      expect(result.status).toBe('approved');
      expect(result.reviewedAt).toBeTruthy();
      expect(result.reviewedByUserId).toBeTruthy();
    });

    it('should handle approval error', async () => {
      vi.mocked(timesheetsEndpoints.approveTimesheet).mockRejectedValue(
        new Error('Only pending timesheets can be approved')
      );

      await expect(timesheetsService.approve('1')).rejects.toThrow(
        'Only pending timesheets can be approved'
      );
    });
  });

  describe('reject', () => {
    it('should reject timesheet with review note', async () => {
      const rejectedTimesheet = {
        ...mockTimesheet,
        status: 'rejected' as const,
        reviewedAt: '2025-01-16T10:00:00.000Z',
        reviewedByUserId: 'manager-1',
        reviewNote: 'Please correct the hours for Monday',
      };

      const mockResponse = {
        data: rejectedTimesheet,
      };

      vi.mocked(timesheetsEndpoints.rejectTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.reject(
        '1',
        'Please correct the hours for Monday'
      );

      expect(timesheetsEndpoints.rejectTimesheet).toHaveBeenCalledWith('1', {
        reviewNote: 'Please correct the hours for Monday',
      });
      expect(result).toEqual(rejectedTimesheet);
      expect(result.status).toBe('rejected');
      expect(result.reviewNote).toBe('Please correct the hours for Monday');
    });

    it('should reject timesheet without review note', async () => {
      const rejectedTimesheet = {
        ...mockTimesheet,
        status: 'rejected' as const,
        reviewedAt: '2025-01-16T10:00:00.000Z',
        reviewedByUserId: 'manager-1',
        reviewNote: null,
      };

      const mockResponse = {
        data: rejectedTimesheet,
      };

      vi.mocked(timesheetsEndpoints.rejectTimesheet).mockResolvedValue(mockResponse);

      const result = await timesheetsService.reject('1');

      expect(timesheetsEndpoints.rejectTimesheet).toHaveBeenCalledWith('1', undefined);
      expect(result).toEqual(rejectedTimesheet);
      expect(result.status).toBe('rejected');
    });

    it('should handle rejection error', async () => {
      vi.mocked(timesheetsEndpoints.rejectTimesheet).mockRejectedValue(
        new Error('Only pending timesheets can be rejected')
      );

      await expect(
        timesheetsService.reject('1', 'Test note')
      ).rejects.toThrow('Only pending timesheets can be rejected');
    });
  });
});
