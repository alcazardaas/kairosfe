/**
 * Comprehensive tests for Time Entries Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timeEntriesService } from './time-entries';
import * as timeEntriesEndpoints from '../endpoints/time-entries';

// Mock all endpoint functions
vi.mock('../endpoints/time-entries');

describe('timeEntriesService', () => {
  const mockTimeEntry = {
    data: {
      id: '1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      projectId: 'proj-1',
      taskId: 'task-1',
      weekStartDate: '2025-01-13',
      dayOfWeek: 1,
      hours: 8,
      note: 'Development work',
      createdAt: '2025-01-13T10:00:00.000Z',
      updatedAt: '2025-01-13T10:00:00.000Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch time entries without parameters', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      const result = await timeEntriesService.getAll();

      expect(timeEntriesEndpoints.findAllTimeEntries).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should fetch time entries with userId filter', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ userId: 'user-1' });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('userId')).toBe('user-1');
    });

    it('should fetch time entries with weekStartDate filter', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ weekStartDate: '2025-01-13' });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('weekStartDate')).toBe('2025-01-13');
    });

    it('should fetch time entries with weekEndDate filter', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ weekEndDate: '2025-01-19' });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('weekEndDate')).toBe('2025-01-19');
    });

    it('should fetch time entries with projectId filter', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ projectId: 'proj-1' });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('projectId')).toBe('proj-1');
    });

    it('should fetch time entries with dayOfWeek filter', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ dayOfWeek: 1 });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('dayOfWeek')).toBe('1');
    });

    it('should handle dayOfWeek 0 (Sunday)', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ dayOfWeek: 0 });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('dayOfWeek')).toBe('0');
    });

    it('should fetch time entries with pagination', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 100,
        page: 2,
        pageSize: 20,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ page: 2, limit: 20 });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('page')).toBe('2');
      expect(callArg.get('limit')).toBe('20');
    });

    it('should fetch time entries with sort parameter', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ sort: 'dayOfWeek:asc' });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('sort')).toBe('dayOfWeek:asc');
    });

    it('should fetch time entries with all parameters combined', async () => {
      const mockResponse = {
        data: [mockTimeEntry.data],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({
        userId: 'user-1',
        weekStartDate: '2025-01-13',
        weekEndDate: '2025-01-19',
        projectId: 'proj-1',
        dayOfWeek: 1,
        page: 1,
        limit: 10,
        sort: 'dayOfWeek:asc',
      });

      const callArg = vi.mocked(timeEntriesEndpoints.findAllTimeEntries).mock.calls[0][0];
      expect(callArg.get('userId')).toBe('user-1');
      expect(callArg.get('weekStartDate')).toBe('2025-01-13');
      expect(callArg.get('weekEndDate')).toBe('2025-01-19');
      expect(callArg.get('projectId')).toBe('proj-1');
      expect(callArg.get('dayOfWeek')).toBe('1');
      expect(callArg.get('page')).toBe('1');
      expect(callArg.get('limit')).toBe('10');
      expect(callArg.get('sort')).toBe('dayOfWeek:asc');
    });
  });

  describe('create', () => {
    it('should create new time entry with all fields', async () => {
      vi.mocked(timeEntriesEndpoints.createTimeEntry).mockResolvedValue(mockTimeEntry);

      const createData = {
        userId: 'user-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        weekStartDate: '2025-01-13',
        dayOfWeek: 1,
        hours: 8,
        note: 'Development work',
      };

      const result = await timeEntriesService.create(createData);

      expect(timeEntriesEndpoints.createTimeEntry).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockTimeEntry);
    });

    it('should create time entry without taskId', async () => {
      vi.mocked(timeEntriesEndpoints.createTimeEntry).mockResolvedValue(mockTimeEntry);

      const createData = {
        userId: 'user-1',
        projectId: 'proj-1',
        taskId: null,
        weekStartDate: '2025-01-13',
        dayOfWeek: 1,
        hours: 8,
      };

      await timeEntriesService.create(createData);

      expect(timeEntriesEndpoints.createTimeEntry).toHaveBeenCalledWith(createData);
    });

    it('should create time entry without note', async () => {
      vi.mocked(timeEntriesEndpoints.createTimeEntry).mockResolvedValue(mockTimeEntry);

      const createData = {
        userId: 'user-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        weekStartDate: '2025-01-13',
        dayOfWeek: 1,
        hours: 8,
      };

      await timeEntriesService.create(createData);

      expect(timeEntriesEndpoints.createTimeEntry).toHaveBeenCalledWith(createData);
    });

    it('should handle creation error', async () => {
      vi.mocked(timeEntriesEndpoints.createTimeEntry).mockRejectedValue(
        new Error('Validation failed')
      );

      const createData = {
        userId: 'user-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        weekStartDate: '2025-01-13',
        dayOfWeek: 1,
        hours: 8,
      };

      await expect(timeEntriesService.create(createData)).rejects.toThrow('Validation failed');
    });
  });

  describe('update', () => {
    it('should update time entry hours', async () => {
      const updatedEntry = {
        ...mockTimeEntry,
        data: { ...mockTimeEntry.data, hours: 10 },
      };

      vi.mocked(timeEntriesEndpoints.updateTimeEntry).mockResolvedValue(updatedEntry);

      const result = await timeEntriesService.update('1', { hours: 10 });

      expect(timeEntriesEndpoints.updateTimeEntry).toHaveBeenCalledWith('1', { hours: 10 });
      expect(result).toEqual(updatedEntry);
      expect(result.data.hours).toBe(10);
    });

    it('should update time entry note', async () => {
      const updatedEntry = {
        ...mockTimeEntry,
        data: { ...mockTimeEntry.data, note: 'Updated note' },
      };

      vi.mocked(timeEntriesEndpoints.updateTimeEntry).mockResolvedValue(updatedEntry);

      const result = await timeEntriesService.update('1', { note: 'Updated note' });

      expect(timeEntriesEndpoints.updateTimeEntry).toHaveBeenCalledWith('1', {
        note: 'Updated note',
      });
      expect(result.data.note).toBe('Updated note');
    });

    it('should update both hours and note', async () => {
      const updatedEntry = {
        ...mockTimeEntry,
        data: { ...mockTimeEntry.data, hours: 10, note: 'Updated note' },
      };

      vi.mocked(timeEntriesEndpoints.updateTimeEntry).mockResolvedValue(updatedEntry);

      const result = await timeEntriesService.update('1', { hours: 10, note: 'Updated note' });

      expect(timeEntriesEndpoints.updateTimeEntry).toHaveBeenCalledWith('1', {
        hours: 10,
        note: 'Updated note',
      });
      expect(result.data.hours).toBe(10);
      expect(result.data.note).toBe('Updated note');
    });

    it('should handle update error', async () => {
      vi.mocked(timeEntriesEndpoints.updateTimeEntry).mockRejectedValue(
        new Error('Time entry not found')
      );

      await expect(timeEntriesService.update('non-existent', { hours: 10 })).rejects.toThrow(
        'Time entry not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete time entry', async () => {
      vi.mocked(timeEntriesEndpoints.deleteTimeEntry).mockResolvedValue(undefined);

      await timeEntriesService.delete('1');

      expect(timeEntriesEndpoints.deleteTimeEntry).toHaveBeenCalledWith('1');
    });

    it('should handle deletion error', async () => {
      vi.mocked(timeEntriesEndpoints.deleteTimeEntry).mockRejectedValue(
        new Error('Time entry not found')
      );

      await expect(timeEntriesService.delete('non-existent')).rejects.toThrow(
        'Time entry not found'
      );
    });
  });

  describe('getWeeklyTotal', () => {
    it('should fetch weekly hours total', async () => {
      const mockWeeklyHours = {
        userId: 'user-1',
        weekStartDate: '2025-01-13',
        totalHours: 40,
        dailyHours: [
          { dayOfWeek: 1, hours: 8, date: '2025-01-13' },
          { dayOfWeek: 2, hours: 8, date: '2025-01-14' },
          { dayOfWeek: 3, hours: 8, date: '2025-01-15' },
          { dayOfWeek: 4, hours: 8, date: '2025-01-16' },
          { dayOfWeek: 5, hours: 8, date: '2025-01-17' },
          { dayOfWeek: 6, hours: 0, date: '2025-01-18' },
          { dayOfWeek: 0, hours: 0, date: '2025-01-19' },
        ],
      };

      vi.mocked(timeEntriesEndpoints.getWeeklyHours).mockResolvedValue(mockWeeklyHours);

      const result = await timeEntriesService.getWeeklyTotal('user-1', '2025-01-13');

      expect(timeEntriesEndpoints.getWeeklyHours).toHaveBeenCalledWith('user-1', '2025-01-13');
      expect(result).toEqual(mockWeeklyHours);
      expect(result.totalHours).toBe(40);
      expect(result.dailyHours).toHaveLength(7);
    });
  });

  describe('getProjectTotal', () => {
    it('should fetch project hours total', async () => {
      const mockProjectHours = {
        projectId: 'proj-1',
        totalHours: 120,
      };

      vi.mocked(timeEntriesEndpoints.getProjectHours).mockResolvedValue(mockProjectHours);

      const result = await timeEntriesService.getProjectTotal('proj-1');

      expect(timeEntriesEndpoints.getProjectHours).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(mockProjectHours);
      expect(result.totalHours).toBe(120);
    });
  });

  describe('getWeekView', () => {
    it('should fetch week view with entries and breakdown', async () => {
      const mockWeekView = {
        weekStartDate: '2025-01-13',
        entries: [mockTimeEntry.data],
        dailyTotals: [8, 8, 8, 8, 8, 0, 0],
        weeklyTotal: 40,
        projectBreakdown: [
          {
            projectId: 'proj-1',
            projectName: 'Project 1',
            totalHours: 40,
            percentage: 100,
          },
        ],
      };

      vi.mocked(timeEntriesEndpoints.getWeekView).mockResolvedValue(mockWeekView);

      const result = await timeEntriesService.getWeekView('user-1', '2025-01-13');

      expect(timeEntriesEndpoints.getWeekView).toHaveBeenCalledWith('user-1', '2025-01-13');
      expect(result).toEqual(mockWeekView);
      expect(result.weeklyTotal).toBe(40);
      expect(result.projectBreakdown).toHaveLength(1);
    });
  });

  describe('bulkSave', () => {
    it('should bulk save time entries', async () => {
      const bulkRequest = {
        userId: 'user-1',
        weekStartDate: '2025-01-13',
        entries: [
          { projectId: 'proj-1', taskId: 'task-1', dayOfWeek: 1, hours: 8 },
          { projectId: 'proj-1', taskId: 'task-1', dayOfWeek: 2, hours: 8 },
        ],
      };

      const mockBulkResponse = {
        created: 2,
        updated: 0,
        deleted: 0,
        total: 2,
      };

      vi.mocked(timeEntriesEndpoints.bulkSaveTimeEntries).mockResolvedValue(mockBulkResponse);

      const result = await timeEntriesService.bulkSave(bulkRequest);

      expect(timeEntriesEndpoints.bulkSaveTimeEntries).toHaveBeenCalledWith(bulkRequest);
      expect(result).toEqual(mockBulkResponse);
      expect(result.created).toBe(2);
    });

    it('should handle bulk save error', async () => {
      const bulkRequest = {
        userId: 'user-1',
        weekStartDate: '2025-01-13',
        entries: [],
      };

      vi.mocked(timeEntriesEndpoints.bulkSaveTimeEntries).mockRejectedValue(
        new Error('No entries provided')
      );

      await expect(timeEntriesService.bulkSave(bulkRequest)).rejects.toThrow(
        'No entries provided'
      );
    });
  });

  describe('copyWeek', () => {
    it('should copy time entries from one week to another', async () => {
      const mockCopyResponse = {
        created: 5,
        updated: 0,
        deleted: 0,
        total: 5,
      };

      vi.mocked(timeEntriesEndpoints.copyWeek).mockResolvedValue(mockCopyResponse);

      const result = await timeEntriesService.copyWeek('2025-01-06', '2025-01-13');

      expect(timeEntriesEndpoints.copyWeek).toHaveBeenCalledWith({
        fromWeekStart: '2025-01-06',
        toWeekStart: '2025-01-13',
      });
      expect(result).toEqual(mockCopyResponse);
      expect(result.created).toBe(5);
    });

    it('should handle copy week error', async () => {
      vi.mocked(timeEntriesEndpoints.copyWeek).mockRejectedValue(
        new Error('Source week has no entries')
      );

      await expect(timeEntriesService.copyWeek('2025-01-06', '2025-01-13')).rejects.toThrow(
        'Source week has no entries'
      );
    });
  });
});
