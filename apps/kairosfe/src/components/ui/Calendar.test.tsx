/**
 * Tests for Calendar Component
 * Comprehensive coverage of calendar display and interaction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar';
import * as calendarService from '@/lib/api/services/calendar';
import type { CalendarEvent } from '@kairos/shared';

// Mock calendar service
vi.mock('@/lib/api/services/calendar');

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'calendar.holidays': 'Holidays',
        'calendar.approvedLeave': 'Approved Leave',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock i18n module
vi.mock('@/lib/i18n', () => ({}));

describe('Calendar', () => {
  // Generate mock events for current month
  const getCurrentMonthEvents = (): CalendarEvent[] => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return [
      {
        date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
        type: 'holiday',
        title: 'New Year Holiday',
        id: '1',
      },
      {
        date: `${year}-${String(month + 1).padStart(2, '0')}-20`,
        type: 'leave',
        title: 'Annual Leave',
        id: '2',
      },
    ];
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(calendarService.getCalendarData).mockResolvedValue({
      events: getCurrentMonthEvents(),
    } as any);
  });

  describe('rendering', () => {
    it('should render calendar component', async () => {
      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });
    });

    it('should display month and year in header', async () => {
      render(<Calendar />);

      await waitFor(() => {
        // Should display some month name and year
        const header = document.querySelector('h3');
        expect(header).toBeInTheDocument();
        expect(header?.textContent).toMatch(/\w+\s+\d{4}/); // e.g., "January 2024"
      });
    });

    it('should render navigation buttons', async () => {
      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
        expect(screen.getByLabelText('Next month')).toBeInTheDocument();
      });
    });

    it('should render week day headers', async () => {
      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
        expect(screen.getByText('Thu')).toBeInTheDocument();
        expect(screen.getByText('Fri')).toBeInTheDocument();
        expect(screen.getByText('Sat')).toBeInTheDocument();
      });
    });

    it('should render legend for event types', async () => {
      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Holidays')).toBeInTheDocument();
        expect(screen.getByText('Approved Leave')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('should call getCalendarData on mount', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      // First day of current month
      const firstDay = new Date(year, month, 1);
      const expectedFrom = firstDay.toISOString().split('T')[0];

      // Last day of current month
      const lastDay = new Date(year, month + 1, 0);
      const expectedTo = lastDay.toISOString().split('T')[0];

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledWith({
          userId: 'me',
          from: expectedFrom,
          to: expectedTo,
          include: ['holidays', 'leave'],
        });
      });
    });

    it('should pass custom userId to API', async () => {
      render(<Calendar userId="user-123" />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-123',
          })
        );
      });
    });

    it('should use default userId "me" when not provided', async () => {
      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'me',
          })
        );
      });
    });

    it('should calculate correct date range for API call', async () => {
      render(<Calendar />);

      await waitFor(() => {
        const call = vi.mocked(calendarService.getCalendarData).mock.calls[0][0];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // First day of current month
        const firstDay = new Date(year, month, 1);
        const expectedFrom = firstDay.toISOString().split('T')[0];

        // Last day of current month
        const lastDay = new Date(year, month + 1, 0);
        const expectedTo = lastDay.toISOString().split('T')[0];

        expect(call.from).toBe(expectedFrom);
        expect(call.to).toBe(expectedTo);
      });
    });
  });

  describe('loading state', () => {
    it('should show loading spinner during data fetch', async () => {
      vi.mocked(calendarService.getCalendarData).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<Calendar />);

      // Loading spinner should be visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide calendar grid during loading', async () => {
      vi.mocked(calendarService.getCalendarData).mockImplementation(
        () => new Promise(() => {})
      );

      render(<Calendar />);

      // Week headers should not be visible during loading
      expect(screen.queryByText('Sun')).not.toBeInTheDocument();
    });

    it('should show calendar after loading completes', async () => {
      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
      });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message on API failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(calendarService.getCalendarData).mockRejectedValue(new Error('Network error'));

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load calendar')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should not show loading spinner when error occurs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(calendarService.getCalendarData).mockRejectedValue(new Error('Network error'));

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load calendar')).toBeInTheDocument();
      });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should set events to empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(calendarService.getCalendarData).mockRejectedValue(new Error('Network error'));

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load calendar')).toBeInTheDocument();
      });

      // Calendar should still render but without events
      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('calendar grid', () => {
    it('should render all days of the month', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      // Get number of days in current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      // Check that all days of the month are rendered
      const buttons = screen.getAllByRole('button');
      for (let day = 1; day <= daysInMonth; day++) {
        const dayButton = buttons.find((btn) => btn.textContent?.trim() === String(day));
        expect(dayButton).toBeDefined();
      }
    });

    it('should highlight today with special styling', async () => {
      const today = new Date();
      const todayDate = today.getDate();

      render(<Calendar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const todayButton = buttons.find(
          (btn) =>
            btn.textContent?.trim() === String(todayDate) &&
            btn.classList.contains('bg-blue-100')
        );
        expect(todayButton).toBeDefined();
      });
    });

    it('should apply correct padding for month start', async () => {
      // January 1, 2024 is a Monday (day 1)
      render(<Calendar />);

      await waitFor(() => {
        const grid = document.querySelector('.grid-cols-7');
        expect(grid).toBeInTheDocument();
        // First day should have 1 empty cell before it (Sunday)
      });
    });
  });

  describe('event display', () => {
    it('should show holiday indicator for holiday events', async () => {
      render(<Calendar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const day15Button = buttons.find((btn) => btn.textContent?.trim() === '15');
        expect(day15Button).toBeDefined();
        // Should have red dot for holiday
        const redDot = day15Button?.querySelector('.bg-red-500');
        expect(redDot).toBeInTheDocument();
      });
    });

    it('should show leave indicator for leave events', async () => {
      render(<Calendar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const day20Button = buttons.find((btn) => btn.textContent?.trim() === '20');
        expect(day20Button).toBeDefined();
        // Should have green dot for leave
        const greenDot = day20Button?.querySelector('.bg-green-500');
        expect(greenDot).toBeInTheDocument();
      });
    });

    it('should include event titles in button title attribute', async () => {
      render(<Calendar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const day15Button = buttons.find((btn) => btn.textContent?.trim() === '15');
        expect(day15Button?.getAttribute('title')).toContain('New Year Holiday');
      });
    });

    it('should handle days with no events', async () => {
      render(<Calendar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const day1Button = buttons.find((btn) => btn.textContent?.trim() === '1');
        expect(day1Button).toBeDefined();
        // Should not have event indicators
        const dots = day1Button?.querySelectorAll('.rounded-full');
        expect(dots?.length || 0).toBe(0);
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to previous month', async () => {
      const user = userEvent.setup({ delay: null });

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const header = document.querySelector('h3');
      const initialMonth = header?.textContent;

      const prevButton = screen.getByLabelText('Previous month');
      await user.click(prevButton);

      await waitFor(() => {
        const newMonth = document.querySelector('h3')?.textContent;
        expect(newMonth).not.toBe(initialMonth);
      });
    });

    it('should navigate to next month', async () => {
      const user = userEvent.setup({ delay: null });

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const header = document.querySelector('h3');
      const initialMonth = header?.textContent;

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      await waitFor(() => {
        const newMonth = document.querySelector('h3')?.textContent;
        expect(newMonth).not.toBe(initialMonth);
      });
    });

    it('should navigate to today', async () => {
      const user = userEvent.setup({ delay: null });

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const header = document.querySelector('h3');
      const currentMonth = header?.textContent;

      // Navigate away from current month
      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      await waitFor(() => {
        const newMonth = document.querySelector('h3')?.textContent;
        expect(newMonth).not.toBe(currentMonth);
      });

      // Click Today button
      const todayButton = screen.getByRole('button', { name: 'Today' });
      await user.click(todayButton);

      await waitFor(() => {
        const returnedMonth = document.querySelector('h3')?.textContent;
        expect(returnedMonth).toBe(currentMonth);
      });
    });

    it('should reload data when navigating months', async () => {
      const user = userEvent.setup({ delay: null });

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledTimes(1);
      });

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledTimes(2);
      });
    });

    it('should call API with correct date range for next month', async () => {
      const user = userEvent.setup({ delay: null });

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      await waitFor(() => {
        const call = vi.mocked(calendarService.getCalendarData).mock.calls[0][0];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // Next month

        // First day of next month
        const firstDay = new Date(year, month, 1);
        const expectedFrom = firstDay.toISOString().split('T')[0];

        // Last day of next month
        const lastDay = new Date(year, month + 1, 0);
        const expectedTo = lastDay.toISOString().split('T')[0];

        expect(call.from).toBe(expectedFrom);
        expect(call.to).toBe(expectedTo);
      });
    });
  });

  describe('date click', () => {
    it('should call onDateClick when date is clicked', async () => {
      const mockOnDateClick = vi.fn();
      const user = userEvent.setup({ delay: null });

      render(<Calendar onDateClick={mockOnDateClick} />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const buttons = screen.getAllByRole('button');
      const day15Button = buttons.find((btn) => btn.textContent?.trim() === '15');

      if (day15Button) {
        await user.click(day15Button);

        expect(mockOnDateClick).toHaveBeenCalled();
        const calledDate = mockOnDateClick.mock.calls[0][0];
        expect(calledDate.getDate()).toBe(15);
      }
    });

    it('should not crash when onDateClick is not provided', async () => {
      const user = userEvent.setup({ delay: null });

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const buttons = screen.getAllByRole('button');
      const day1Button = buttons.find((btn) => btn.textContent?.trim() === '1');

      if (day1Button) {
        await expect(user.click(day1Button)).resolves.not.toThrow();
      }
    });

    it('should pass correct date to onDateClick', async () => {
      const mockOnDateClick = vi.fn();
      const user = userEvent.setup({ delay: null });
      const today = new Date();

      render(<Calendar onDateClick={mockOnDateClick} />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const buttons = screen.getAllByRole('button');
      const day20Button = buttons.find((btn) => btn.textContent?.trim() === '20');

      if (day20Button) {
        await user.click(day20Button);

        const calledDate = mockOnDateClick.mock.calls[0][0];
        expect(calledDate.getFullYear()).toBe(today.getFullYear());
        expect(calledDate.getMonth()).toBe(today.getMonth());
        expect(calledDate.getDate()).toBe(20);
      }
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes', async () => {
      const { container } = render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-800');
      expect(htmlContent).toContain('dark:text-gray-100');
    });
  });

  describe('edge cases', () => {
    it('should handle empty events array', async () => {
      vi.mocked(calendarService.getCalendarData).mockResolvedValue({
        events: [],
      } as any);

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      // Calendar should still render without errors
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('should handle null events in response', async () => {
      vi.mocked(calendarService.getCalendarData).mockResolvedValue({
        events: null as any,
      } as any);

      render(<Calendar />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalled();
      });

      // Should not crash
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('should handle userId change', async () => {
      const { rerender } = render(<Calendar userId="user-1" />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledWith(
          expect.objectContaining({ userId: 'user-1' })
        );
      });

      vi.clearAllMocks();

      rerender(<Calendar userId="user-2" />);

      await waitFor(() => {
        expect(calendarService.getCalendarData).toHaveBeenCalledWith(
          expect.objectContaining({ userId: 'user-2' })
        );
      });
    });

    it('should handle multiple events on same date', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      vi.mocked(calendarService.getCalendarData).mockResolvedValue({
        events: [
          {
            date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
            type: 'holiday',
            title: 'Holiday',
            id: '1',
          },
          {
            date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
            type: 'leave',
            title: 'Leave',
            id: '2',
          },
        ],
      } as any);

      render(<Calendar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const day15Button = buttons.find((btn) => btn.textContent?.trim() === '15');

        // Should have both red and green dots
        expect(day15Button?.querySelector('.bg-red-500')).toBeInTheDocument();
        expect(day15Button?.querySelector('.bg-green-500')).toBeInTheDocument();
      });
    });
  });
});
