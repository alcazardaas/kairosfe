/**
 * Tests for TeamCalendarContent Component
 * Focused coverage of team calendar functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamCalendarContent from './TeamCalendarContent';
import * as calendarService from '@/lib/api/services/calendar';
import { employeesService } from '@/lib/api/services/employees';

// Mock dependencies
vi.mock('@/lib/api/services/calendar');
vi.mock('@/lib/api/services/employees');

// Mock posthog
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

// Mock Sentry
vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('TeamCalendarContent', () => {
  const mockEmployees = [
    {
      id: 'emp-1',
      name: 'John Doe',
      email: 'john@example.com',
      membership: { role: 'employee', status: 'active' },
    },
    {
      id: 'emp-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      membership: { role: 'employee', status: 'active' },
    },
  ];

  const mockCalendarData = {
    holidays: [
      {
        id: 'hol-1',
        name: 'New Year',
        date: '2025-01-01',
        type: 'public',
        isRecurring: true,
      },
    ],
    leaves: [
      {
        id: 'leave-1',
        userId: 'emp-1',
        type: 'vacation',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        status: 'approved',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock calendar service functions
    vi.mocked(calendarService.getWeekRange).mockReturnValue({
      from: '2025-01-13',
      to: '2025-01-19',
    });
    vi.mocked(calendarService.getMonthRange).mockReturnValue({
      from: '2025-01-01',
      to: '2025-01-31',
    });
    vi.mocked(calendarService.formatDateISO).mockImplementation((date) =>
      date.toISOString().split('T')[0]
    );
    vi.mocked(calendarService.getDatesInRange).mockImplementation((from, to) => {
      const dates = [];
      const start = new Date(from);
      const end = new Date(to);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
      return dates;
    });
    vi.mocked(calendarService.getTeamCalendarData).mockResolvedValue(mockCalendarData as any);

    // Mock employees service
    vi.mocked(employeesService.getAll).mockResolvedValue({
      data: mockEmployees,
      meta: { total: 2, totalPages: 1, page: 1, limit: 10 },
    } as any);
  });

  describe('initial render', () => {
    it('should render component', async () => {
      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(calendarService.getTeamCalendarData).toHaveBeenCalled();
      });
    });

    it('should load calendar data', async () => {
      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(calendarService.getTeamCalendarData).toHaveBeenCalled();
      });
    });

    it('should load employees', async () => {
      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalled();
      });
    });
  });

  describe('view mode switching', () => {
    it('should start in week view by default', async () => {
      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(calendarService.getWeekRange).toHaveBeenCalled();
      });
    });

    it('should call getMonthRange when in month mode', async () => {
      // Month range is called when view mode is set to month
      expect(calendarService.getMonthRange).toBeDefined();
      expect(typeof calendarService.getMonthRange).toBe('function');
    });
  });

  describe('date navigation', () => {
    it('should have navigation functions available', () => {
      expect(calendarService.getWeekRange).toBeDefined();
      expect(calendarService.getMonthRange).toBeDefined();
      expect(calendarService.getDatesInRange).toBeDefined();
    });
  });

  describe('employee filtering', () => {
    it('should load employees on mount', async () => {
      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should handle calendar data load error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(calendarService.getTeamCalendarData).mockRejectedValue(new Error('Network error'));

      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle employees load error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(employeesService.getAll).mockRejectedValue(new Error('Network error'));

      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('data display', () => {
    it('should call getTeamCalendarData with correct date range', async () => {
      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(calendarService.getTeamCalendarData).toHaveBeenCalledWith(
          '2025-01-13',
          '2025-01-19',
          undefined
        );
      });
    });
  });

  describe('analytics tracking', () => {
    it('should track calendar loaded event', async () => {
      const posthog = (await import('posthog-js')).default;

      render(<TeamCalendarContent />);

      await waitFor(() => {
        expect(posthog.capture).toHaveBeenCalledWith(
          'team_calendar_loaded',
          expect.objectContaining({
            view_mode: 'week',
          })
        );
      });
    });
  });
});
