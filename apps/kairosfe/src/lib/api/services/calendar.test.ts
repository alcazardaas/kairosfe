/**
 * Comprehensive tests for Calendar Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCalendarData,
  getTeamCalendarData,
  getHolidays,
  checkDateOverlap,
  getWeekRange,
  getMonthRange,
  getDatesInRange,
  formatDateISO,
} from './calendar';
import { apiClient } from '../client';

// Mock API client
vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('calendar service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCalendarData', () => {
    it('should fetch calendar data with date range', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            type: 'holiday' as const,
            date: '2025-01-01',
            name: 'New Year',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar?from=2025-01-01&to=2025-01-31',
        true
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('holiday');
      expect(result.events[0].title).toBe('New Year');
    });

    it('should fetch calendar data with userId filter', async () => {
      const mockResponse = {
        data: [
          {
            id: 'leave-1',
            type: 'leave' as const,
            startDate: '2025-01-15',
            userName: 'John Doe',
            benefitTypeName: 'Vacation',
            userId: 'user-1',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
        userId: 'user-1',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar?from=2025-01-01&to=2025-01-31&userId=user-1',
        true
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('leave');
      expect(result.events[0].userId).toBe('user-1');
    });

    it('should fetch calendar data with include filter', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            type: 'holiday' as const,
            date: '2025-01-01',
            name: 'New Year',
          },
          {
            id: 'leave-1',
            type: 'leave' as const,
            startDate: '2025-01-15',
            userName: 'John Doe',
            benefitTypeName: 'Vacation',
            userId: 'user-1',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
        include: ['holidays', 'leave'],
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar?from=2025-01-01&to=2025-01-31&include=holidays%2Cleave',
        true
      );
      expect(result.events).toHaveLength(2);
    });

    it('should transform holiday items to events', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            type: 'holiday' as const,
            date: '2025-12-25',
            name: 'Christmas Day',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-12-01',
        to: '2025-12-31',
      });

      expect(result.events[0]).toEqual({
        id: 'holiday-1',
        type: 'holiday',
        date: '2025-12-25',
        title: 'Christmas Day',
      });
    });

    it('should transform leave items to events with default titles', async () => {
      const mockResponse = {
        data: [
          {
            id: 'leave-1',
            type: 'leave' as const,
            startDate: '2025-01-15',
            userId: 'user-1',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result.events[0].title).toBe('Leave - Leave');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result.events).toHaveLength(0);
      expect(result.holidays).toHaveLength(0);
      expect(result.leaves).toHaveLength(0);
    });

    it('should handle missing data field in response', async () => {
      const mockResponse = {};

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result.events).toHaveLength(0);
    });

    it('should ignore incomplete holiday items', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            type: 'holiday' as const,
            date: '2025-01-01',
            // Missing 'name' field
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result.events).toHaveLength(0);
    });

    it('should ignore incomplete leave items', async () => {
      const mockResponse = {
        data: [
          {
            id: 'leave-1',
            type: 'leave' as const,
            // Missing 'startDate' field
            userName: 'John Doe',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getCalendarData({
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result.events).toHaveLength(0);
    });
  });

  describe('getTeamCalendarData', () => {
    it('should fetch team calendar data without specific users', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            type: 'holiday' as const,
            date: '2025-01-01',
            name: 'New Year',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTeamCalendarData('2025-01-01', '2025-01-31');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar?from=2025-01-01&to=2025-01-31&include=holidays%2Cleave',
        true
      );
      expect(result.events).toHaveLength(1);
    });

    it('should fetch team calendar data for specific users', async () => {
      const mockResponse1 = {
        data: [
          {
            id: 'leave-1',
            type: 'leave' as const,
            startDate: '2025-01-15',
            userName: 'User 1',
            benefitTypeName: 'Vacation',
            userId: 'user-1',
          },
        ],
      };

      const mockResponse2 = {
        data: [
          {
            id: 'leave-2',
            type: 'leave' as const,
            startDate: '2025-01-20',
            userName: 'User 2',
            benefitTypeName: 'Sick Leave',
            userId: 'user-2',
          },
        ],
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await getTeamCalendarData('2025-01-01', '2025-01-31', [
        'user-1',
        'user-2',
      ]);

      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(result.events).toHaveLength(2);
      expect(result.leaves).toHaveLength(0); // leaves array remains empty (legacy structure)
    });

    it('should combine events from multiple users', async () => {
      const mockResponse1 = {
        data: [
          {
            id: 'leave-1',
            type: 'leave' as const,
            startDate: '2025-01-15',
            userName: 'User 1',
            benefitTypeName: 'Vacation',
            userId: 'user-1',
          },
        ],
      };

      const mockResponse2 = {
        data: [
          {
            id: 'leave-2',
            type: 'leave' as const,
            startDate: '2025-01-20',
            userName: 'User 2',
            benefitTypeName: 'Sick Leave',
            userId: 'user-2',
          },
        ],
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await getTeamCalendarData('2025-01-01', '2025-01-31', [
        'user-1',
        'user-2',
      ]);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].userId).toBe('user-1');
      expect(result.events[1].userId).toBe('user-2');
    });

    it('should handle empty userIds array', async () => {
      const mockResponse = {
        data: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTeamCalendarData('2025-01-01', '2025-01-31', []);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar?from=2025-01-01&to=2025-01-31&include=holidays%2Cleave',
        true
      );
      expect(result.events).toHaveLength(0);
    });
  });

  describe('getHolidays', () => {
    it('should fetch holidays without parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            name: 'New Year',
            date: '2025-01-01',
            countryCode: 'US',
            type: 'public',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getHolidays();

      expect(apiClient.get).toHaveBeenCalledWith('/holidays', true);
      expect(result.data).toHaveLength(1);
    });

    it('should fetch holidays with pagination', async () => {
      const mockResponse = {
        data: [],
        total: 100,
        page: 2,
        pageSize: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({ page: 2, limit: 20 });

      expect(apiClient.get).toHaveBeenCalledWith('/holidays?page=2&limit=20', true);
    });

    it('should fetch holidays with country filter', async () => {
      const mockResponse = {
        data: [
          {
            id: 'holiday-1',
            name: 'Independence Day',
            date: '2025-07-04',
            countryCode: 'US',
            type: 'public',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({ countryCode: 'US' });

      expect(apiClient.get).toHaveBeenCalledWith('/holidays?countryCode=US', true);
    });

    it('should fetch holidays with type filter', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({ type: 'religious' });

      expect(apiClient.get).toHaveBeenCalledWith('/holidays?type=religious', true);
    });

    it('should fetch holidays with date range', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/holidays?startDate=2025-01-01&endDate=2025-12-31',
        true
      );
    });

    it('should fetch upcoming holidays', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({ upcoming: true });

      expect(apiClient.get).toHaveBeenCalledWith('/holidays?upcoming=true', true);
    });

    it('should fetch holidays for specific year', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({ year: 2025 });

      expect(apiClient.get).toHaveBeenCalledWith('/holidays?year=2025', true);
    });

    it('should fetch holidays with search', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({ search: 'Christmas' });

      expect(apiClient.get).toHaveBeenCalledWith('/holidays?search=Christmas', true);
    });

    it('should fetch holidays with all parameters combined', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getHolidays({
        page: 1,
        limit: 10,
        sort: 'date',
        tenantId: 'tenant-1',
        countryCode: 'US',
        type: 'public',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        upcoming: false,
        year: 2025,
        search: 'Day',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/holidays?page=1&limit=10&sort=date&tenantId=tenant-1&countryCode=US&type=public&startDate=2025-01-01&endDate=2025-12-31&upcoming=false&year=2025&search=Day',
        true
      );
    });
  });

  describe('checkDateOverlap', () => {
    it('should check overlap without userId', async () => {
      const mockResponse = {
        hasOverlap: false,
        holidays: [],
        leaves: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await checkDateOverlap('2025-01-15', '2025-01-20');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar/check-overlap?startDate=2025-01-15&endDate=2025-01-20',
        true
      );
      expect(result.hasOverlap).toBe(false);
    });

    it('should check overlap with userId', async () => {
      const mockResponse = {
        hasOverlap: true,
        holidays: [
          {
            id: 'holiday-1',
            name: 'New Year',
            date: '2025-01-01',
            countryCode: 'US',
            type: 'public',
          },
        ],
        leaves: [],
        message: 'Date range includes 1 holiday',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await checkDateOverlap('2025-01-01', '2025-01-05', 'user-1');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/calendar/check-overlap?startDate=2025-01-01&endDate=2025-01-05&userId=user-1',
        true
      );
      expect(result.hasOverlap).toBe(true);
      expect(result.holidays).toHaveLength(1);
    });

    it('should handle overlap with existing leaves', async () => {
      const mockResponse = {
        hasOverlap: true,
        holidays: [],
        leaves: [
          {
            userId: 'user-1',
            userName: 'John Doe',
            startDate: '2025-01-15',
            endDate: '2025-01-20',
          },
        ],
        message: 'Overlaps with existing leave request',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await checkDateOverlap('2025-01-18', '2025-01-22', 'user-1');

      expect(result.hasOverlap).toBe(true);
      expect(result.leaves).toHaveLength(1);
    });
  });

  describe('getWeekRange', () => {
    it('should get week range for a Monday', () => {
      const date = new Date('2025-01-13'); // Monday
      const result = getWeekRange(date);

      expect(result.from).toBe('2025-01-12'); // Sunday
      expect(result.to).toBe('2025-01-18'); // Saturday
    });

    it('should get week range for a Sunday', () => {
      const date = new Date('2025-01-12'); // Sunday
      const result = getWeekRange(date);

      expect(result.from).toBe('2025-01-12'); // Same Sunday
      expect(result.to).toBe('2025-01-18'); // Saturday
    });

    it('should get week range for a Saturday', () => {
      const date = new Date('2025-01-18'); // Saturday
      const result = getWeekRange(date);

      expect(result.from).toBe('2025-01-12'); // Sunday
      expect(result.to).toBe('2025-01-18'); // Same Saturday
    });

    it('should get week range for mid-week', () => {
      const date = new Date('2025-01-15'); // Wednesday
      const result = getWeekRange(date);

      expect(result.from).toBe('2025-01-12'); // Sunday
      expect(result.to).toBe('2025-01-18'); // Saturday
    });
  });

  describe('getMonthRange', () => {
    it('should get month range for January', () => {
      const date = new Date('2025-01-15');
      const result = getMonthRange(date);

      expect(result.from).toBe('2025-01-01');
      expect(result.to).toBe('2025-01-31');
    });

    it('should get month range for February (non-leap year)', () => {
      const date = new Date('2025-02-15');
      const result = getMonthRange(date);

      expect(result.from).toBe('2025-02-01');
      expect(result.to).toBe('2025-02-28');
    });

    it('should get month range for February (leap year)', () => {
      const date = new Date('2024-02-15');
      const result = getMonthRange(date);

      expect(result.from).toBe('2024-02-01');
      expect(result.to).toBe('2024-02-29');
    });

    it('should get month range for December', () => {
      const date = new Date('2025-12-15');
      const result = getMonthRange(date);

      expect(result.from).toBe('2025-12-01');
      expect(result.to).toBe('2025-12-31');
    });

    it('should get month range for first day of month', () => {
      const date = new Date('2025-03-01');
      const result = getMonthRange(date);

      expect(result.from).toBe('2025-03-01');
      expect(result.to).toBe('2025-03-31');
    });

    it('should get month range for last day of month', () => {
      const date = new Date('2025-04-30');
      const result = getMonthRange(date);

      expect(result.from).toBe('2025-04-01');
      expect(result.to).toBe('2025-04-30');
    });
  });

  describe('getDatesInRange', () => {
    it('should get dates in a single-day range', () => {
      const result = getDatesInRange('2025-01-15', '2025-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].toISOString().split('T')[0]).toBe('2025-01-15');
    });

    it('should get dates in a week range', () => {
      const result = getDatesInRange('2025-01-13', '2025-01-19');

      expect(result).toHaveLength(7);
      expect(result[0].toISOString().split('T')[0]).toBe('2025-01-13');
      expect(result[6].toISOString().split('T')[0]).toBe('2025-01-19');
    });

    it('should get dates in a month range', () => {
      const result = getDatesInRange('2025-01-01', '2025-01-31');

      expect(result).toHaveLength(31);
    });

    it('should handle range spanning multiple months', () => {
      const result = getDatesInRange('2025-01-30', '2025-02-02');

      expect(result).toHaveLength(4);
      expect(result[0].toISOString().split('T')[0]).toBe('2025-01-30');
      expect(result[3].toISOString().split('T')[0]).toBe('2025-02-02');
    });
  });

  describe('formatDateISO', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2025-01-15T10:30:00.000Z');
      const result = formatDateISO(date);

      expect(result).toBe('2025-01-15');
    });

    it('should handle single-digit months and days', () => {
      const date = new Date('2025-03-05T00:00:00.000Z');
      const result = formatDateISO(date);

      expect(result).toBe('2025-03-05');
    });

    it('should handle end of year', () => {
      const date = new Date('2025-12-31T23:59:59.999Z');
      const result = formatDateISO(date);

      expect(result).toBe('2025-12-31');
    });

    it('should handle start of year', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = formatDateISO(date);

      expect(result).toBe('2025-01-01');
    });
  });
});
