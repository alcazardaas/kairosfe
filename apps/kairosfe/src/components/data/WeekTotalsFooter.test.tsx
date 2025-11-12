/**
 * Comprehensive tests for WeekTotalsFooter Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeekTotalsFooter from './WeekTotalsFooter';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timesheet.totals.daily': 'Daily Totals',
        'timesheet.totals.weekly': 'Weekly Total',
        'timesheet.totals.target': 'target',
      };
      return translations[key] || key;
    },
  }),
}));

describe('WeekTotalsFooter', () => {
  const mockDailyTotals = [0, 8, 8, 8, 8, 8, 0]; // Mon-Fri: 8 hours each

  describe('daily totals rendering', () => {
    it('should render all 7 daily totals', () => {
      render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      // Check that all day abbreviations are present
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('should display hours with one decimal place', () => {
      const totals = [8.5, 7.2, 9.0, 8.3, 6.7, 8.0, 0];
      render(
        <WeekTotalsFooter dailyTotals={totals} weeklyTotal={47.7} />
      );

      expect(screen.getByText('8.5h')).toBeInTheDocument();
      expect(screen.getByText('7.2h')).toBeInTheDocument();
      expect(screen.getByText('9.0h')).toBeInTheDocument();
    });

    it('should handle missing daily totals by filling with 0', () => {
      const incompleteTotals = [8, 8, 8]; // Only 3 days provided
      const { container } = render(
        <WeekTotalsFooter dailyTotals={incompleteTotals} weeklyTotal={24} />
      );

      // Should show 0.0h for missing days
      const zeroHours = container.querySelectorAll('.text-lg');
      const zeroValues = Array.from(zeroHours).filter(
        (el) => el.textContent === '0.0h'
      );
      expect(zeroValues.length).toBe(4); // 4 days missing = 4 zeros
    });

    it('should handle empty daily totals array', () => {
      render(
        <WeekTotalsFooter dailyTotals={[]} weeklyTotal={0} />
      );

      // Should render 7 days with 0.0h each
      const { container } = render(
        <WeekTotalsFooter dailyTotals={[]} weeklyTotal={0} />
      );

      const zeroHours = container.querySelectorAll('.text-lg');
      expect(zeroHours.length).toBeGreaterThan(0);
    });
  });

  describe('weekly total rendering', () => {
    it('should display weekly total with one decimal place', () => {
      render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      expect(screen.getByText('40.0h')).toBeInTheDocument();
    });

    it('should display target hours', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={40}
          targetHours={40}
        />
      );

      expect(screen.getByText(/40h target/i)).toBeInTheDocument();
    });

    it('should use default target of 40 hours when not provided', () => {
      render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={35} />
      );

      expect(screen.getByText(/40h target/i)).toBeInTheDocument();
    });

    it('should display custom target hours', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={35}
          targetHours={35}
        />
      );

      expect(screen.getByText(/35h target/i)).toBeInTheDocument();
    });
  });

  describe('target achievement styling', () => {
    it('should use green color when weekly total meets target', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={40}
          targetHours={40}
        />
      );

      const weeklyTotalElement = screen.getByText('40.0h');
      expect(weeklyTotalElement).toHaveClass('text-green-600');
    });

    it('should use green color when weekly total exceeds target', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={45}
          targetHours={40}
        />
      );

      const weeklyTotalElement = screen.getByText('45.0h');
      expect(weeklyTotalElement).toHaveClass('text-green-600');
    });

    it('should use yellow color when weekly total is below target', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={35}
          targetHours={40}
        />
      );

      const weeklyTotalElement = screen.getByText('35.0h');
      expect(weeklyTotalElement).toHaveClass('text-yellow-600');
    });

    it('should use green progress bar when target is met', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={40}
          targetHours={40}
        />
      );

      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('should use yellow progress bar when target is not met', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={30}
          targetHours={40}
        />
      );

      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('percentage calculation', () => {
    it('should calculate and display percentage of target', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={40}
          targetHours={40}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display percentage for partial completion', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={30}
          targetHours={40}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should display percentage over 100% when exceeding target', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={50}
          targetHours={40}
        />
      );

      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    it('should cap progress bar width at 100%', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={50}
          targetHours={40}
        />
      );

      const progressBar = container.querySelector('.h-full');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should handle zero target hours gracefully', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={40}
          targetHours={0}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should round percentage to nearest integer', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={33.7}
          targetHours={40}
        />
      );

      // 33.7 / 40 = 84.25% -> rounds to 84%
      expect(screen.getByText('84%')).toBeInTheDocument();
    });
  });

  describe('layout and structure', () => {
    it('should render daily totals label', () => {
      render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      expect(screen.getByText('Daily Totals')).toBeInTheDocument();
    });

    it('should render weekly total label', () => {
      render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      expect(screen.getByText('Weekly Total')).toBeInTheDocument();
    });

    it('should use grid layout for daily totals', () => {
      const { container } = render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      const grid = container.querySelector('.grid.grid-cols-8');
      expect(grid).toBeInTheDocument();
    });

    it('should apply proper border styling', () => {
      const { container } = render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      const topBorder = container.querySelector('.border-t-2');
      expect(topBorder).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes for backgrounds', () => {
      const { container } = render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      const darkBg = container.querySelector('.dark\\:bg-gray-800\\/50');
      expect(darkBg).toBeInTheDocument();
    });

    it('should include dark mode classes for text', () => {
      const { container } = render(
        <WeekTotalsFooter dailyTotals={mockDailyTotals} weeklyTotal={40} />
      );

      const darkText = container.querySelector('.dark\\:text-gray-100');
      expect(darkText).toBeInTheDocument();
    });

    it('should include dark mode classes for green color when target met', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={40}
          targetHours={40}
        />
      );

      const weeklyTotalElement = screen.getByText('40.0h');
      expect(weeklyTotalElement).toHaveClass('dark:text-green-400');
    });

    it('should include dark mode classes for yellow color when below target', () => {
      const { container } = render(
        <WeekTotalsFooter
          dailyTotals={mockDailyTotals}
          weeklyTotal={30}
          targetHours={40}
        />
      );

      const weeklyTotalElement = screen.getByText('30.0h');
      expect(weeklyTotalElement).toHaveClass('dark:text-yellow-400');
    });
  });

  describe('edge cases', () => {
    it('should handle all zero hours', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={[0, 0, 0, 0, 0, 0, 0]}
          weeklyTotal={0}
        />
      );

      // "0.0h" appears 8 times (7 daily + 1 weekly), so use getAllByText
      const zeroHours = screen.getAllByText('0.0h');
      expect(zeroHours.length).toBe(8);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle fractional hours correctly', () => {
      const totals = [8.25, 7.75, 8.5, 8.0, 7.5, 8.0, 0];
      render(
        <WeekTotalsFooter
          dailyTotals={totals}
          weeklyTotal={48.0}
        />
      );

      expect(screen.getByText('8.3h')).toBeInTheDocument(); // 8.25 rounded to 1 decimal
      expect(screen.getByText('7.8h')).toBeInTheDocument(); // 7.75 rounded to 1 decimal
    });

    it('should handle very large hours', () => {
      render(
        <WeekTotalsFooter
          dailyTotals={[24, 24, 24, 24, 24, 24, 24]}
          weeklyTotal={168}
          targetHours={40}
        />
      );

      expect(screen.getByText('168.0h')).toBeInTheDocument();
      expect(screen.getByText('420%')).toBeInTheDocument(); // 168/40 * 100
    });
  });
});
