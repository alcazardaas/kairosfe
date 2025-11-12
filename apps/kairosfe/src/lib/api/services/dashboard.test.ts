/**
 * Comprehensive tests for Dashboard Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeeklyStats, getUserProjectStats } from './dashboard';
import { apiClient } from '../client';

// Mock API client
vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboard service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeeklyStats', () => {
    it('should fetch weekly statistics', async () => {
      const mockWeeklyStats = {
        userId: 'user-1',
        weekStartDate: '2025-01-13',
        totalHours: 40,
        dailyBreakdown: [
          { day: 0, hours: 0 },
          { day: 1, hours: 8 },
          { day: 2, hours: 8 },
          { day: 3, hours: 8 },
          { day: 4, hours: 8 },
          { day: 5, hours: 8 },
          { day: 6, hours: 0 },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockWeeklyStats);

      const result = await getWeeklyStats('user-1', '2025-01-13');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/time-entries/stats/weekly/user-1/2025-01-13',
        true
      );
      expect(result).toEqual(mockWeeklyStats);
      expect(result.totalHours).toBe(40);
    });

    it('should fetch weekly statistics with partial hours', async () => {
      const mockWeeklyStats = {
        userId: 'user-2',
        weekStartDate: '2025-01-13',
        totalHours: 25.5,
        dailyBreakdown: [
          { day: 0, hours: 0 },
          { day: 1, hours: 8 },
          { day: 2, hours: 7.5 },
          { day: 3, hours: 6 },
          { day: 4, hours: 4 },
          { day: 5, hours: 0 },
          { day: 6, hours: 0 },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockWeeklyStats);

      const result = await getWeeklyStats('user-2', '2025-01-13');

      expect(result.totalHours).toBe(25.5);
      expect(result.dailyBreakdown).toHaveLength(7);
    });

    it('should fetch weekly statistics with zero hours', async () => {
      const mockWeeklyStats = {
        userId: 'user-3',
        weekStartDate: '2025-01-13',
        totalHours: 0,
        dailyBreakdown: [
          { day: 0, hours: 0 },
          { day: 1, hours: 0 },
          { day: 2, hours: 0 },
          { day: 3, hours: 0 },
          { day: 4, hours: 0 },
          { day: 5, hours: 0 },
          { day: 6, hours: 0 },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockWeeklyStats);

      const result = await getWeeklyStats('user-3', '2025-01-13');

      expect(result.totalHours).toBe(0);
    });

    it('should handle unauthorized error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthorized'));

      await expect(getWeeklyStats('user-1', '2025-01-13')).rejects.toThrow('Unauthorized');
    });

    it('should handle user not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('User not found'));

      await expect(getWeeklyStats('non-existent', '2025-01-13')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getUserProjectStats', () => {
    it('should fetch user project statistics without filters', async () => {
      const mockProjectStats = {
        userId: 'user-1',
        totalHours: 120,
        projects: [
          {
            projectId: 'proj-1',
            projectName: 'Alpha Project',
            hours: 80,
            percentage: 66.67,
          },
          {
            projectId: 'proj-2',
            projectName: 'Beta Project',
            hours: 40,
            percentage: 33.33,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockProjectStats);

      const result = await getUserProjectStats('user-1');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/time-entries/stats/user-projects/user-1',
        true
      );
      expect(result).toEqual(mockProjectStats);
      expect(result.projects).toHaveLength(2);
    });

    it('should fetch user project statistics with week filter', async () => {
      const mockProjectStats = {
        userId: 'user-1',
        totalHours: 40,
        projects: [
          {
            projectId: 'proj-1',
            projectName: 'Alpha Project',
            hours: 40,
            percentage: 100,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockProjectStats);

      const result = await getUserProjectStats('user-1', {
        weekStartDate: '2025-01-13',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/time-entries/stats/user-projects/user-1?weekStartDate=2025-01-13',
        true
      );
      expect(result.totalHours).toBe(40);
    });

    it('should fetch user project statistics with date range', async () => {
      const mockProjectStats = {
        userId: 'user-2',
        totalHours: 160,
        projects: [
          {
            projectId: 'proj-1',
            projectName: 'Alpha Project',
            hours: 100,
            percentage: 62.5,
          },
          {
            projectId: 'proj-2',
            projectName: 'Beta Project',
            hours: 60,
            percentage: 37.5,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockProjectStats);

      const result = await getUserProjectStats('user-2', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/time-entries/stats/user-projects/user-2?startDate=2025-01-01&endDate=2025-01-31',
        true
      );
      expect(result.projects).toHaveLength(2);
    });

    it('should fetch user project statistics with all filters', async () => {
      const mockProjectStats = {
        userId: 'user-3',
        totalHours: 40,
        projects: [
          {
            projectId: 'proj-1',
            projectName: 'Project X',
            hours: 40,
            percentage: 100,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockProjectStats);

      await getUserProjectStats('user-3', {
        weekStartDate: '2025-01-13',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/time-entries/stats/user-projects/user-3?weekStartDate=2025-01-13&startDate=2025-01-01&endDate=2025-01-31',
        true
      );
    });

    it('should handle user with no projects', async () => {
      const mockProjectStats = {
        userId: 'user-4',
        totalHours: 0,
        projects: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockProjectStats);

      const result = await getUserProjectStats('user-4');

      expect(result.totalHours).toBe(0);
      expect(result.projects).toHaveLength(0);
    });

    it('should handle single project with 100% allocation', async () => {
      const mockProjectStats = {
        userId: 'user-5',
        totalHours: 100,
        projects: [
          {
            projectId: 'proj-1',
            projectName: 'Solo Project',
            hours: 100,
            percentage: 100,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockProjectStats);

      const result = await getUserProjectStats('user-5');

      expect(result.projects[0].percentage).toBe(100);
    });

    it('should handle unauthorized error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthorized'));

      await expect(getUserProjectStats('user-1')).rejects.toThrow('Unauthorized');
    });

    it('should handle user not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('User not found'));

      await expect(getUserProjectStats('non-existent')).rejects.toThrow('User not found');
    });

    it('should handle invalid date range error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(
        new Error('Invalid date range: startDate must be before endDate')
      );

      await expect(
        getUserProjectStats('user-1', {
          startDate: '2025-01-31',
          endDate: '2025-01-01',
        })
      ).rejects.toThrow('Invalid date range');
    });
  });
});
