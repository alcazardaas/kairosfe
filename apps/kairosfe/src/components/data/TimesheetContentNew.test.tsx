/**
 * Tests for TimesheetContentNew Component
 * Comprehensive coverage of tabbed timesheet interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimesheetContentNew from './TimesheetContentNew';
import { useTimesheetStore } from '@/lib/store';

// Mock dependencies
vi.mock('@/lib/store');

// Mock AuthGuard to render children directly
vi.mock('@/components/auth/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock tab components
vi.mock('./TimesheetWeekTab', () => ({
  default: () => <div data-testid="timesheet-week-tab">Week Tab Content</div>,
}));

vi.mock('./TimesheetHistoryTab', () => ({
  default: () => <div data-testid="timesheet-history-tab">History Tab Content</div>,
}));

vi.mock('./TimesheetReportsTab', () => ({
  default: () => <div data-testid="timesheet-reports-tab">Reports Tab Content</div>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timesheet.title': 'Timesheets',
        'timesheet.description': 'Track and manage your work hours',
        'timesheet.tabs.myWeek': 'My Week',
        'timesheet.tabs.history': 'History',
        'timesheet.tabs.reports': 'Reports',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock i18n module
vi.mock('@/lib/i18n', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));

describe('TimesheetContentNew', () => {
  const mockSetActiveTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state (week tab active)
    const mockStore = (selector: any) => {
      if (typeof selector === 'function') {
        const state = {
          activeTab: 'week' as const,
          setActiveTab: mockSetActiveTab,
        };
        return selector(state);
      }
      return { activeTab: 'week', setActiveTab: mockSetActiveTab };
    };
    vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);
  });

  describe('initial render', () => {
    it('should display page title', () => {
      render(<TimesheetContentNew />);

      expect(screen.getByText('Timesheets')).toBeInTheDocument();
    });

    it('should display page description', () => {
      render(<TimesheetContentNew />);

      expect(screen.getByText('Track and manage your work hours')).toBeInTheDocument();
    });

    it('should display all tab labels', () => {
      render(<TimesheetContentNew />);

      expect(screen.getByText('My Week')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('should display tab icons', () => {
      render(<TimesheetContentNew />);

      expect(screen.getByText('calendar_view_week')).toBeInTheDocument();
      expect(screen.getByText('history')).toBeInTheDocument();
      expect(screen.getByText('bar_chart')).toBeInTheDocument();
    });

    it('should show week tab by default', () => {
      render(<TimesheetContentNew />);

      expect(screen.getByTestId('timesheet-week-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('timesheet-history-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('timesheet-reports-tab')).not.toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch to history tab when clicked', async () => {
      const user = userEvent.setup();
      render(<TimesheetContentNew />);

      const historyTab = screen.getByRole('button', { name: /History/i });
      await user.click(historyTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('history');
    });

    it('should switch to reports tab when clicked', async () => {
      const user = userEvent.setup();
      render(<TimesheetContentNew />);

      const reportsTab = screen.getByRole('button', { name: /Reports/i });
      await user.click(reportsTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('reports');
    });

    it('should switch back to week tab when clicked', async () => {
      const user = userEvent.setup();

      // Start with history tab active
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'history' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'history', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      const weekTab = screen.getByRole('button', { name: /My Week/i });
      await user.click(weekTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('week');
    });
  });

  describe('tab content rendering', () => {
    it('should show week tab content when week is active', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'week' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'week', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      expect(screen.getByTestId('timesheet-week-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('timesheet-history-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('timesheet-reports-tab')).not.toBeInTheDocument();
    });

    it('should show history tab content when history is active', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'history' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'history', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      expect(screen.queryByTestId('timesheet-week-tab')).not.toBeInTheDocument();
      expect(screen.getByTestId('timesheet-history-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('timesheet-reports-tab')).not.toBeInTheDocument();
    });

    it('should show reports tab content when reports is active', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'reports' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'reports', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      expect(screen.queryByTestId('timesheet-week-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('timesheet-history-tab')).not.toBeInTheDocument();
      expect(screen.getByTestId('timesheet-reports-tab')).toBeInTheDocument();
    });
  });

  describe('active tab styling', () => {
    it('should apply active styles to week tab', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'week' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'week', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      const weekButton = screen.getByRole('button', { name: /My Week/i });
      expect(weekButton.className).toContain('border-blue-600');
      expect(weekButton.className).toContain('text-blue-600');
    });

    it('should apply active styles to history tab', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'history' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'history', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      const historyButton = screen.getByRole('button', { name: /History/i });
      expect(historyButton.className).toContain('border-blue-600');
      expect(historyButton.className).toContain('text-blue-600');
    });

    it('should apply active styles to reports tab', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'reports' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'reports', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      const reportsButton = screen.getByRole('button', { name: /Reports/i });
      expect(reportsButton.className).toContain('border-blue-600');
      expect(reportsButton.className).toContain('text-blue-600');
    });

    it('should apply inactive styles to non-active tabs', () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            activeTab: 'week' as const,
            setActiveTab: mockSetActiveTab,
          };
          return selector(state);
        }
        return { activeTab: 'week', setActiveTab: mockSetActiveTab };
      };
      vi.mocked(useTimesheetStore).mockImplementation(mockStore as any);

      render(<TimesheetContentNew />);

      const historyButton = screen.getByRole('button', { name: /History/i });
      const reportsButton = screen.getByRole('button', { name: /Reports/i });

      expect(historyButton.className).toContain('border-transparent');
      expect(historyButton.className).toContain('text-gray-500');
      expect(reportsButton.className).toContain('border-transparent');
      expect(reportsButton.className).toContain('text-gray-500');
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes', () => {
      const { container } = render(<TimesheetContentNew />);

      const darkElements = container.querySelectorAll(
        '.dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:text-gray-100'
      );
      expect(darkElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode classes on active tab', () => {
      render(<TimesheetContentNew />);

      const weekButton = screen.getByRole('button', { name: /My Week/i });
      expect(weekButton.className).toContain('dark:border-blue-400');
      expect(weekButton.className).toContain('dark:text-blue-400');
    });
  });

  describe('accessibility', () => {
    it('should have button roles for all tabs', () => {
      render(<TimesheetContentNew />);

      expect(screen.getByRole('button', { name: /My Week/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reports/i })).toBeInTheDocument();
    });

    it('should have nav element', () => {
      const { container } = render(<TimesheetContentNew />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });
});
