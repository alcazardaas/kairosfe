/**
 * Comprehensive tests for Reports Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsService } from './reports';
import * as timeEntriesService from './time-entries';
import * as timesheetsService from './timesheets';
import * as employeesService from './employees';
import * as projectsService from './projects';

// Mock all dependent services
vi.mock('./time-entries');
vi.mock('./timesheets');
vi.mock('./employees');
vi.mock('./projects');

// Mock DOM APIs for CSV export
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();
global.Blob = vi.fn((content, options) => ({ content, options })) as any;

describe('reportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear document.body between tests
    document.body.innerHTML = '';
  });

  describe('getTimesheetReport', () => {
    it('should generate timesheet report with basic data', async () => {
      const mockTimesheets = {
        data: [
          {
            id: 'ts-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            weekStartDate: '2025-01-13',
            status: 'draft' as const,
            totalHours: 40,
            submittedAt: null,
            reviewedAt: null,
            reviewedByUserId: null,
            reviewNote: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 1000,
      };

      const mockEntries = {
        data: [
          {
            id: 'entry-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            projectId: 'proj-1',
            taskId: null,
            weekStartDate: '2025-01-13',
            dayOfWeek: 1,
            hours: 8,
            note: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      const mockProjects = {
        data: [
          {
            id: 'proj-1',
            tenantId: 'tenant-1',
            name: 'Alpha Project',
            clientName: 'Client A',
            description: null,
            startDate: '2025-01-01',
            endDate: null,
            budgetHours: null,
            active: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      const mockEmployees = {
        data: [
          {
            id: 'user-1',
            tenantId: 'tenant-1',
            email: 'user1@test.com',
            name: 'User One',
            role: 'employee' as const,
            active: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      vi.mocked(timesheetsService.timesheetsService.getAll).mockResolvedValue(mockTimesheets);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue(mockEntries);
      vi.mocked(projectsService.projectsService.getAll).mockResolvedValue(mockProjects);
      vi.mocked(employeesService.employeesService.getAll).mockResolvedValue(mockEmployees);

      const result = await reportsService.getTimesheetReport({
        from: '2025-01-13',
        to: '2025-01-19',
      });

      expect(result.totalHours).toBe(8);
      expect(result.statusStats.draft).toBe(1);
      expect(result.projectAllocations).toHaveLength(1);
      expect(result.userStats).toHaveLength(1);
      expect(result.teamUtilization.totalEmployees).toBe(1);
      expect(result.teamUtilization.activeEmployees).toBe(1);
    });

    it('should filter entries by user IDs', async () => {
      const mockTimesheets = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 1000,
      };

      const mockEntries = {
        data: [
          {
            id: 'entry-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            projectId: 'proj-1',
            taskId: null,
            weekStartDate: '2025-01-13',
            dayOfWeek: 1,
            hours: 8,
            note: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
          {
            id: 'entry-2',
            tenantId: 'tenant-1',
            userId: 'user-2',
            projectId: 'proj-1',
            taskId: null,
            weekStartDate: '2025-01-13',
            dayOfWeek: 1,
            hours: 8,
            note: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 100,
      };

      const mockProjects = { data: [], total: 0, page: 1, pageSize: 10 };
      const mockEmployees = { data: [], total: 0, page: 1, pageSize: 100 };

      vi.mocked(timesheetsService.timesheetsService.getAll).mockResolvedValue(mockTimesheets);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue(mockEntries);
      vi.mocked(projectsService.projectsService.getAll).mockResolvedValue(mockProjects);
      vi.mocked(employeesService.employeesService.getAll).mockResolvedValue(mockEmployees);

      const result = await reportsService.getTimesheetReport({
        from: '2025-01-13',
        to: '2025-01-19',
        userIds: ['user-1'],
      });

      expect(result.totalHours).toBe(8);
      expect(result.entryCount).toBe(1);
    });

    it('should filter entries by project IDs', async () => {
      const mockTimesheets = { data: [], total: 0, page: 1, pageSize: 1000 };
      const mockEntries = {
        data: [
          {
            id: 'entry-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            projectId: 'proj-1',
            taskId: null,
            weekStartDate: '2025-01-13',
            dayOfWeek: 1,
            hours: 8,
            note: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
          {
            id: 'entry-2',
            tenantId: 'tenant-1',
            userId: 'user-1',
            projectId: 'proj-2',
            taskId: null,
            weekStartDate: '2025-01-13',
            dayOfWeek: 1,
            hours: 8,
            note: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 100,
      };

      const mockProjects = { data: [], total: 0, page: 1, pageSize: 10 };
      const mockEmployees = { data: [], total: 0, page: 1, pageSize: 100 };

      vi.mocked(timesheetsService.timesheetsService.getAll).mockResolvedValue(mockTimesheets);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue(mockEntries);
      vi.mocked(projectsService.projectsService.getAll).mockResolvedValue(mockProjects);
      vi.mocked(employeesService.employeesService.getAll).mockResolvedValue(mockEmployees);

      const result = await reportsService.getTimesheetReport({
        from: '2025-01-13',
        to: '2025-01-19',
        projectIds: ['proj-1'],
      });

      expect(result.totalHours).toBe(8);
      expect(result.entryCount).toBe(1);
    });

    it('should calculate status stats correctly', async () => {
      const mockTimesheets = {
        data: [
          {
            id: 'ts-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            weekStartDate: '2025-01-13',
            status: 'draft' as const,
            totalHours: 40,
            submittedAt: null,
            reviewedAt: null,
            reviewedByUserId: null,
            reviewNote: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-13T00:00:00.000Z',
          },
          {
            id: 'ts-2',
            userId: 'user-2',
            tenantId: 'tenant-1',
            weekStartDate: '2025-01-13',
            status: 'pending' as const,
            totalHours: 40,
            submittedAt: '2025-01-15T00:00:00.000Z',
            reviewedAt: null,
            reviewedByUserId: null,
            reviewNote: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-15T00:00:00.000Z',
          },
          {
            id: 'ts-3',
            userId: 'user-3',
            tenantId: 'tenant-1',
            weekStartDate: '2025-01-13',
            status: 'approved' as const,
            totalHours: 40,
            submittedAt: '2025-01-15T00:00:00.000Z',
            reviewedAt: '2025-01-16T00:00:00.000Z',
            reviewedByUserId: 'manager-1',
            reviewNote: null,
            createdAt: '2025-01-13T00:00:00.000Z',
            updatedAt: '2025-01-16T00:00:00.000Z',
          },
        ],
        total: 3,
        page: 1,
        pageSize: 1000,
      };

      const mockEntries = { data: [], total: 0, page: 1, pageSize: 100 };
      const mockProjects = { data: [], total: 0, page: 1, pageSize: 10 };
      const mockEmployees = { data: [], total: 0, page: 1, pageSize: 100 };

      vi.mocked(timesheetsService.timesheetsService.getAll).mockResolvedValue(mockTimesheets);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue(mockEntries);
      vi.mocked(projectsService.projectsService.getAll).mockResolvedValue(mockProjects);
      vi.mocked(employeesService.employeesService.getAll).mockResolvedValue(mockEmployees);

      const result = await reportsService.getTimesheetReport({
        from: '2025-01-13',
        to: '2025-01-19',
      });

      expect(result.statusStats.draft).toBe(1);
      expect(result.statusStats.submitted).toBe(1); // pending = submitted
      expect(result.statusStats.approved).toBe(1);
      expect(result.statusStats.rejected).toBe(0);
      expect(result.statusStats.total).toBe(3);
    });

    it('should handle empty data', async () => {
      const mockTimesheets = { data: [], total: 0, page: 1, pageSize: 1000 };
      const mockEntries = { data: [], total: 0, page: 1, pageSize: 100 };
      const mockProjects = { data: [], total: 0, page: 1, pageSize: 10 };
      const mockEmployees = { data: [], total: 0, page: 1, pageSize: 100 };

      vi.mocked(timesheetsService.timesheetsService.getAll).mockResolvedValue(mockTimesheets);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue(mockEntries);
      vi.mocked(projectsService.projectsService.getAll).mockResolvedValue(mockProjects);
      vi.mocked(employeesService.employeesService.getAll).mockResolvedValue(mockEmployees);

      const result = await reportsService.getTimesheetReport({
        from: '2025-01-13',
        to: '2025-01-19',
      });

      expect(result.totalHours).toBe(0);
      expect(result.projectAllocations).toHaveLength(0);
      expect(result.userStats).toHaveLength(0);
      expect(result.teamUtilization.totalEmployees).toBe(0);
      expect(result.teamUtilization.activeEmployees).toBe(0);
    });
  });

  describe('getLeaveReport', () => {
    it('should return empty leave report', async () => {
      const result = await reportsService.getLeaveReport({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result.leaveStats).toEqual([]);
      expect(result.summary.totalRequests).toBe(0);
      expect(result.summary.totalDays).toBe(0);
    });

    it('should return empty leave report with user filter', async () => {
      const result = await reportsService.getLeaveReport({
        from: '2025-01-01',
        to: '2025-01-31',
        userIds: ['user-1'],
      });

      expect(result.leaveStats).toEqual([]);
    });

    it('should return empty leave report with status filter', async () => {
      const result = await reportsService.getLeaveReport({
        from: '2025-01-01',
        to: '2025-01-31',
        status: 'approved',
      });

      expect(result.summary.approvedRequests).toBe(0);
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV', () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
      ];

      // Should not throw
      expect(() => reportsService.exportToCSV(data, 'test.csv')).not.toThrow();

      // Verify Blob was created with correct CSV content
      expect(Blob).toHaveBeenCalledWith(
        [expect.stringContaining('name,age,city\nJohn,30,New York\nJane,25,Boston')],
        { type: 'text/csv' }
      );
    });

    it('should handle CSV with commas in values', () => {
      const data = [{ name: 'Doe, John', company: 'ACME Corp' }];

      reportsService.exportToCSV(data, 'test.csv');

      expect(Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"Doe, John"')],
        { type: 'text/csv' }
      );
    });

    it('should handle CSV with quotes in values', () => {
      const data = [{ name: 'John "Johnny" Doe', role: 'Developer' }];

      reportsService.exportToCSV(data, 'test.csv');

      expect(Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"John ""Johnny"" Doe"')],
        { type: 'text/csv' }
      );
    });

    it('should handle empty data array', () => {
      reportsService.exportToCSV([], 'empty.csv');

      // Should not create blob or link
      expect(Blob).not.toHaveBeenCalled();
    });

    it('should handle null/undefined values', () => {
      const data = [{ name: 'John', age: null, city: undefined }];

      reportsService.exportToCSV(data, 'test.csv');

      expect(Blob).toHaveBeenCalledWith(
        [expect.stringContaining('name,age,city\nJohn,,')],
        { type: 'text/csv' }
      );
    });

    it('should use provided filename (implicit test)', () => {
      const data = [{ id: 1 }];
      const filename = 'custom-report.csv';

      // Should not throw - filename is used internally
      expect(() => reportsService.exportToCSV(data, filename)).not.toThrow();

      // Verify Blob was created
      expect(Blob).toHaveBeenCalled();
    });
  });
});
