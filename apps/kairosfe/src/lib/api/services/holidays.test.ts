/**
 * Comprehensive tests for Holidays Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { holidaysService } from './holidays';
import * as holidaysEndpoints from '../endpoints/holidays';
import type { HolidayDto } from '../schemas';

// Mock all endpoint functions
vi.mock('../endpoints/holidays');

describe('holidaysService', () => {
  const mockHoliday: HolidayDto = {
    id: 'holiday-1',
    tenantId: 'tenant-1',
    name: 'New Year',
    date: '2025-01-01',
    isRecurring: true,
    createdAt: '2024-12-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  };

  const mockHoliday2: HolidayDto = {
    id: 'holiday-2',
    tenantId: 'tenant-1',
    name: 'Company Anniversary',
    date: '2025-03-15',
    isRecurring: false,
    createdAt: '2024-12-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all holidays', async () => {
      const mockResponse = {
        data: [mockHoliday, mockHoliday2],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(holidaysEndpoints.findAllHolidays).mockResolvedValue(mockResponse);

      const result = await holidaysService.getAll();

      expect(holidaysEndpoints.findAllHolidays).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
    });

    it('should handle empty holidays list', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(holidaysEndpoints.findAllHolidays).mockResolvedValue(mockResponse);

      const result = await holidaysService.getAll();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle getAll error', async () => {
      vi.mocked(holidaysEndpoints.findAllHolidays).mockRejectedValue(
        new Error('Failed to fetch holidays')
      );

      await expect(holidaysService.getAll()).rejects.toThrow('Failed to fetch holidays');
    });
  });

  describe('getById', () => {
    it('should fetch holiday by ID', async () => {
      const mockResponse = {
        data: mockHoliday,
      };

      vi.mocked(holidaysEndpoints.findHolidayById).mockResolvedValue(mockResponse);

      const result = await holidaysService.getById('holiday-1');

      expect(holidaysEndpoints.findHolidayById).toHaveBeenCalledWith('holiday-1');
      expect(result).toEqual(mockResponse);
      expect(result.data.name).toBe('New Year');
    });

    it('should fetch non-recurring holiday', async () => {
      const mockResponse = {
        data: mockHoliday2,
      };

      vi.mocked(holidaysEndpoints.findHolidayById).mockResolvedValue(mockResponse);

      const result = await holidaysService.getById('holiday-2');

      expect(result.data.isRecurring).toBe(false);
    });

    it('should handle holiday not found error', async () => {
      vi.mocked(holidaysEndpoints.findHolidayById).mockRejectedValue(
        new Error('Holiday not found')
      );

      await expect(holidaysService.getById('non-existent')).rejects.toThrow(
        'Holiday not found'
      );
    });
  });

  describe('create', () => {
    it('should create recurring holiday', async () => {
      const createData = {
        name: 'Christmas',
        date: '2025-12-25',
        isRecurring: true,
      };

      const mockResponse = {
        data: {
          ...mockHoliday,
          ...createData,
          id: 'holiday-new',
        },
      };

      vi.mocked(holidaysEndpoints.createHoliday).mockResolvedValue(mockResponse);

      const result = await holidaysService.create(createData);

      expect(holidaysEndpoints.createHoliday).toHaveBeenCalledWith(createData);
      expect(result.data.name).toBe('Christmas');
      expect(result.data.isRecurring).toBe(true);
    });

    it('should create non-recurring holiday', async () => {
      const createData = {
        name: 'Special Event',
        date: '2025-06-15',
        isRecurring: false,
      };

      const mockResponse = {
        data: {
          ...mockHoliday2,
          ...createData,
          id: 'holiday-special',
        },
      };

      vi.mocked(holidaysEndpoints.createHoliday).mockResolvedValue(mockResponse);

      const result = await holidaysService.create(createData);

      expect(holidaysEndpoints.createHoliday).toHaveBeenCalledWith(createData);
      expect(result.data.isRecurring).toBe(false);
    });

    it('should handle creation error', async () => {
      const createData = {
        name: 'Invalid Date',
        date: 'invalid-date',
        isRecurring: false,
      };

      vi.mocked(holidaysEndpoints.createHoliday).mockRejectedValue(
        new Error('Invalid date format')
      );

      await expect(holidaysService.create(createData)).rejects.toThrow('Invalid date format');
    });

    it('should handle duplicate holiday error', async () => {
      const createData = {
        name: 'New Year',
        date: '2025-01-01',
        isRecurring: true,
      };

      vi.mocked(holidaysEndpoints.createHoliday).mockRejectedValue(
        new Error('Holiday already exists for this date')
      );

      await expect(holidaysService.create(createData)).rejects.toThrow(
        'Holiday already exists for this date'
      );
    });
  });

  describe('update', () => {
    it('should update holiday name', async () => {
      const updateData = {
        name: 'New Year Day',
      };

      const mockResponse = {
        data: {
          ...mockHoliday,
          name: 'New Year Day',
        },
      };

      vi.mocked(holidaysEndpoints.updateHoliday).mockResolvedValue(mockResponse);

      const result = await holidaysService.update('holiday-1', updateData);

      expect(holidaysEndpoints.updateHoliday).toHaveBeenCalledWith('holiday-1', updateData);
      expect(result.data.name).toBe('New Year Day');
    });

    it('should update holiday date', async () => {
      const updateData = {
        date: '2025-01-02',
      };

      const mockResponse = {
        data: {
          ...mockHoliday,
          date: '2025-01-02',
        },
      };

      vi.mocked(holidaysEndpoints.updateHoliday).mockResolvedValue(mockResponse);

      const result = await holidaysService.update('holiday-1', updateData);

      expect(result.data.date).toBe('2025-01-02');
    });

    it('should update recurring flag', async () => {
      const updateData = {
        isRecurring: false,
      };

      const mockResponse = {
        data: {
          ...mockHoliday,
          isRecurring: false,
        },
      };

      vi.mocked(holidaysEndpoints.updateHoliday).mockResolvedValue(mockResponse);

      const result = await holidaysService.update('holiday-1', updateData);

      expect(result.data.isRecurring).toBe(false);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        name: 'Updated Holiday',
        date: '2025-07-04',
        isRecurring: true,
      };

      const mockResponse = {
        data: {
          ...mockHoliday,
          ...updateData,
        },
      };

      vi.mocked(holidaysEndpoints.updateHoliday).mockResolvedValue(mockResponse);

      const result = await holidaysService.update('holiday-1', updateData);

      expect(holidaysEndpoints.updateHoliday).toHaveBeenCalledWith('holiday-1', updateData);
      expect(result.data.name).toBe('Updated Holiday');
      expect(result.data.date).toBe('2025-07-04');
      expect(result.data.isRecurring).toBe(true);
    });

    it('should handle update error', async () => {
      vi.mocked(holidaysEndpoints.updateHoliday).mockRejectedValue(
        new Error('Holiday not found')
      );

      await expect(
        holidaysService.update('non-existent', { name: 'Test' })
      ).rejects.toThrow('Holiday not found');
    });

    it('should handle invalid date format error', async () => {
      const updateData = {
        date: '2025/01/01', // Invalid format
      };

      vi.mocked(holidaysEndpoints.updateHoliday).mockRejectedValue(
        new Error('Invalid date format')
      );

      await expect(holidaysService.update('holiday-1', updateData)).rejects.toThrow(
        'Invalid date format'
      );
    });
  });

  describe('delete', () => {
    it('should delete holiday', async () => {
      vi.mocked(holidaysEndpoints.deleteHoliday).mockResolvedValue(undefined);

      await holidaysService.delete('holiday-1');

      expect(holidaysEndpoints.deleteHoliday).toHaveBeenCalledWith('holiday-1');
    });

    it('should handle deletion error', async () => {
      vi.mocked(holidaysEndpoints.deleteHoliday).mockRejectedValue(
        new Error('Holiday not found')
      );

      await expect(holidaysService.delete('non-existent')).rejects.toThrow(
        'Holiday not found'
      );
    });

    it('should handle protected holiday deletion error', async () => {
      vi.mocked(holidaysEndpoints.deleteHoliday).mockRejectedValue(
        new Error('Cannot delete system holiday')
      );

      await expect(holidaysService.delete('system-holiday')).rejects.toThrow(
        'Cannot delete system holiday'
      );
    });
  });
});
