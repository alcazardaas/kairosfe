/**
 * Tests for WeekPicker Component
 * Comprehensive coverage of week navigation functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeekPicker from './WeekPicker';
import * as dateUtils from '@/lib/utils/date';

// Mock date utilities
vi.mock('@/lib/utils/date');

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timesheet.currentWeek': 'Current Week',
        'timesheet.thisWeek': 'This Week',
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

describe('WeekPicker', () => {
  const mockOnWeekChange = vi.fn();
  const selectedWeek = new Date('2024-01-15'); // Monday, January 15, 2024

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(dateUtils.getWeekRangeString).mockReturnValue('Jan 15 - Jan 21, 2024');
    vi.mocked(dateUtils.getWeekStart).mockReturnValue(new Date('2024-01-15'));
    vi.mocked(dateUtils.addWeeks).mockImplementation((date, weeks) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + weeks * 7);
      return newDate;
    });
    vi.mocked(dateUtils.isToday).mockReturnValue(false);
  });

  describe('rendering', () => {
    it('should render week picker', () => {
      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
      expect(screen.getByLabelText('Next week')).toBeInTheDocument();
    });

    it('should display week range', () => {
      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.getByText('Jan 15 - Jan 21, 2024')).toBeInTheDocument();
    });

    it('should call getWeekRangeString with selectedWeek', () => {
      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(dateUtils.getWeekRangeString).toHaveBeenCalledWith(selectedWeek);
    });
  });

  describe('navigation', () => {
    it('should call onWeekChange with previous week when clicking previous', async () => {
      const user = userEvent.setup();

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const prevButton = screen.getByLabelText('Previous week');
      await user.click(prevButton);

      expect(dateUtils.addWeeks).toHaveBeenCalledWith(selectedWeek, -1);
      expect(mockOnWeekChange).toHaveBeenCalled();
    });

    it('should call onWeekChange with next week when clicking next', async () => {
      const user = userEvent.setup();

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const nextButton = screen.getByLabelText('Next week');
      await user.click(nextButton);

      expect(dateUtils.addWeeks).toHaveBeenCalledWith(selectedWeek, 1);
      expect(mockOnWeekChange).toHaveBeenCalled();
    });

    it('should navigate backwards correctly', async () => {
      const user = userEvent.setup();
      const prevWeek = new Date('2024-01-08');
      vi.mocked(dateUtils.addWeeks).mockReturnValue(prevWeek);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const prevButton = screen.getByLabelText('Previous week');
      await user.click(prevButton);

      expect(mockOnWeekChange).toHaveBeenCalledWith(prevWeek);
    });

    it('should navigate forwards correctly', async () => {
      const user = userEvent.setup();
      const nextWeek = new Date('2024-01-22');
      vi.mocked(dateUtils.addWeeks).mockReturnValue(nextWeek);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const nextButton = screen.getByLabelText('Next week');
      await user.click(nextButton);

      expect(mockOnWeekChange).toHaveBeenCalledWith(nextWeek);
    });
  });

  describe('this week button', () => {
    it('should show "This Week" button when not on current week', () => {
      vi.mocked(dateUtils.isToday).mockReturnValue(false);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
    });

    it('should not show "This Week" button when on current week', () => {
      vi.mocked(dateUtils.isToday).mockReturnValue(true);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.queryByRole('button', { name: 'This Week' })).not.toBeInTheDocument();
    });

    it('should call onWeekChange with current week when clicking "This Week"', async () => {
      const user = userEvent.setup();
      const currentWeek = new Date('2024-02-01');
      vi.mocked(dateUtils.getWeekStart).mockReturnValue(currentWeek);
      vi.mocked(dateUtils.isToday).mockReturnValue(false);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const thisWeekButton = screen.getByRole('button', { name: 'This Week' });
      await user.click(thisWeekButton);

      expect(dateUtils.getWeekStart).toHaveBeenCalled();
      expect(mockOnWeekChange).toHaveBeenCalledWith(currentWeek);
    });
  });

  describe('current week indicator', () => {
    it('should show "Current Week" label when on current week', () => {
      vi.mocked(dateUtils.isToday).mockReturnValue(true);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.getByText('Current Week')).toBeInTheDocument();
    });

    it('should not show "Current Week" label when not on current week', () => {
      vi.mocked(dateUtils.isToday).mockReturnValue(false);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.queryByText('Current Week')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible previous week button', () => {
      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const prevButton = screen.getByLabelText('Previous week');
      expect(prevButton).toBeInTheDocument();
      expect(prevButton.tagName).toBe('BUTTON');
    });

    it('should have accessible next week button', () => {
      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const nextButton = screen.getByLabelText('Next week');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.tagName).toBe('BUTTON');
    });

    it('should have accessible this week button when visible', () => {
      vi.mocked(dateUtils.isToday).mockReturnValue(false);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const thisWeekButton = screen.getByRole('button', { name: 'This Week' });
      expect(thisWeekButton).toBeInTheDocument();
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes', () => {
      const { container } = render(
        <WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:hover:bg-gray-700');
      expect(htmlContent).toContain('dark:text-gray-100');
    });

    it('should have dark mode class for current week indicator', () => {
      vi.mocked(dateUtils.isToday).mockReturnValue(true);

      const { container } = render(
        <WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />
      );

      const indicator = screen.getByText('Current Week');
      expect(indicator).toHaveClass('dark:text-blue-400');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid previous week clicks', async () => {
      const user = userEvent.setup();

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const prevButton = screen.getByLabelText('Previous week');
      await user.click(prevButton);
      await user.click(prevButton);
      await user.click(prevButton);

      expect(mockOnWeekChange).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid next week clicks', async () => {
      const user = userEvent.setup();

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      const nextButton = screen.getByLabelText('Next week');
      await user.click(nextButton);
      await user.click(nextButton);

      expect(mockOnWeekChange).toHaveBeenCalledTimes(2);
    });

    it('should handle selectedWeek prop changes', () => {
      const { rerender } = render(
        <WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />
      );

      expect(screen.getByText('Jan 15 - Jan 21, 2024')).toBeInTheDocument();

      const newWeek = new Date('2024-02-01');
      vi.mocked(dateUtils.getWeekRangeString).mockReturnValue('Feb 1 - Feb 7, 2024');

      rerender(<WeekPicker selectedWeek={newWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.getByText('Feb 1 - Feb 7, 2024')).toBeInTheDocument();
    });

    it('should handle different week range formats', () => {
      vi.mocked(dateUtils.getWeekRangeString).mockReturnValue('Dec 25, 2023 - Jan 1, 2024');

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(screen.getByText('Dec 25, 2023 - Jan 1, 2024')).toBeInTheDocument();
    });
  });

  describe('integration with date utilities', () => {
    it('should use addWeeks for previous week calculation', async () => {
      const user = userEvent.setup();

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      await user.click(screen.getByLabelText('Previous week'));

      expect(dateUtils.addWeeks).toHaveBeenCalledWith(selectedWeek, -1);
    });

    it('should use addWeeks for next week calculation', async () => {
      const user = userEvent.setup();

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      await user.click(screen.getByLabelText('Next week'));

      expect(dateUtils.addWeeks).toHaveBeenCalledWith(selectedWeek, 1);
    });

    it('should use getWeekStart for this week button', async () => {
      const user = userEvent.setup();
      vi.mocked(dateUtils.isToday).mockReturnValue(false);

      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      await user.click(screen.getByRole('button', { name: 'This Week' }));

      expect(dateUtils.getWeekStart).toHaveBeenCalled();
    });

    it('should use isToday for current week detection', () => {
      render(<WeekPicker selectedWeek={selectedWeek} onWeekChange={mockOnWeekChange} />);

      expect(dateUtils.isToday).toHaveBeenCalled();
    });
  });
});
