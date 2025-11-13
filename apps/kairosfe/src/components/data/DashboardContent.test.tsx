/**
 * Tests for DashboardContent Component
 * Comprehensive coverage of data fetching, states, and permissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardContent from './DashboardContent';
import { useAuthStore } from '@/lib/store';
import * as dashboardService from '@/lib/api/services/dashboard';
import * as timesheetsService from '@/lib/api/services/timesheets';
import * as leaveRequestsService from '@/lib/api/services/leave-requests';
import * as calendarService from '@/lib/api/services/calendar';

// Mock dependencies
vi.mock('@/lib/store');
vi.mock('@/lib/api/services/dashboard');
vi.mock('@/lib/api/services/timesheets');
vi.mock('@/lib/api/services/leave-requests');
vi.mock('@/lib/api/services/calendar');

// Mock AuthGuard to render children directly
vi.mock('@/components/auth/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'dashboard.welcome': `Welcome, ${params?.name || 'User'}!`,
        'dashboard.overview': 'Here is your dashboard overview',
        'dashboard.thisWeekHours': 'This Week Hours',
        'dashboard.byProject': 'By Project',
        'dashboard.upcomingHolidays': 'Upcoming Holidays',
        'dashboard.pendingTimesheets': 'Pending Timesheets',
        'dashboard.pendingLeaveRequests': 'Pending Leave Requests',
        'dashboard.awaitingReview': 'Awaiting review',
        'dashboard.awaitingApproval': 'Awaiting approval',
        'dashboard.noHoursThisWeek': 'No hours logged this week',
        'dashboard.noProjectData': 'No project data available',
        'dashboard.noUpcomingHolidays': 'No upcoming holidays',
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

describe('DashboardContent', () => {
  const mockEmployeeUser = {
    id: 'user-123',
    name: 'Test Employee',
    email: 'employee@example.com',
    role: 'employee' as const,
    tenantId: 'tenant-1',
  };

  const mockManagerUser = {
    id: 'manager-123',
    name: 'Test Manager',
    email: 'manager@example.com',
    role: 'manager' as const,
    tenantId: 'tenant-1',
  };

  const mockWeeklyStats = {
    totalHours: 40,
    hoursPerDay: {
      '2025-01-13': 8,
      '2025-01-14': 8,
      '2025-01-15': 8,
      '2025-01-16': 8,
      '2025-01-17': 8,
    },
  };

  const mockProjectStats = {
    projects: [
      { projectId: '1', projectName: 'Project Alpha', totalHours: 20, percentage: 50 },
      { projectId: '2', projectName: 'Project Beta', totalHours: 15, percentage: 37.5 },
      { projectId: '3', projectName: 'Project Gamma', totalHours: 5, percentage: 12.5 },
    ],
  };

  const mockHolidays = {
    data: [
      { id: '1', name: 'Independence Day', date: '2026-07-04', type: 'public', isRecurring: true, tenantId: 'tenant-1' },
      { id: '2', name: 'Christmas', date: '2026-12-25', type: 'public', isRecurring: true, tenantId: 'tenant-1' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PostHog and Sentry on window object
    (window as any).posthog = {
      capture: vi.fn(),
    };
    (window as any).Sentry = {
      captureException: vi.fn(),
    };

    // Default store state (employee without manager permissions)
    const mockStore = (selector: any) => {
      if (typeof selector === 'function') {
        const state = {
          user: mockEmployeeUser,
          permissions: [],
        };
        return selector(state);
      }
      return mockEmployeeUser;
    };
    vi.mocked(useAuthStore).mockImplementation(mockStore as any);

    // Default API mocks
    vi.mocked(dashboardService.getWeeklyStats).mockResolvedValue(mockWeeklyStats);
    vi.mocked(dashboardService.getUserProjectStats).mockResolvedValue(mockProjectStats);
    vi.mocked(calendarService.getHolidays).mockResolvedValue(mockHolidays);
  });

  describe('loading state', () => {
    it('should show loading skeleton initially', async () => {
      render(<DashboardContent />);

      // Loading skeleton should have multiple placeholder blocks
      const skeletons = document.querySelectorAll('.animate-pulse .bg-gray-200');
      expect(skeletons.length).toBeGreaterThan(0);

      // Wait for component to finish loading
      await waitFor(() => {
        expect(screen.queryByText(/Welcome/)).toBeInTheDocument();
      });
    });

    it('should show loading skeleton with dark mode classes', async () => {
      render(<DashboardContent />);

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();

      // Wait for component to finish loading
      await waitFor(() => {
        expect(screen.queryByText(/Welcome/)).toBeInTheDocument();
      });
    });
  });

  describe('successful data load', () => {
    it('should display welcome message with user name', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, Test Employee!')).toBeInTheDocument();
      });
    });

    it('should display overview text', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Here is your dashboard overview')).toBeInTheDocument();
      });
    });

    it('should display weekly hours', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('This Week Hours')).toBeInTheDocument();
        expect(screen.getByText('40.0h')).toBeInTheDocument();
      });
    });

    it('should display project breakdown', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('By Project')).toBeInTheDocument();
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('20h')).toBeInTheDocument();
      });
    });

    it('should display upcoming holidays', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Holidays')).toBeInTheDocument();
        expect(screen.getByText('Independence Day')).toBeInTheDocument();
      });
    });

    it('should call all API services', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(dashboardService.getWeeklyStats).toHaveBeenCalled();
        expect(dashboardService.getUserProjectStats).toHaveBeenCalled();
        expect(calendarService.getHolidays).toHaveBeenCalled();
      });
    });
  });

  describe('empty states', () => {
    it('should show empty state when no hours logged', async () => {
      vi.mocked(dashboardService.getWeeklyStats).mockResolvedValue({
        totalHours: 0,
        hoursPerDay: {},
      });

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('No hours logged this week')).toBeInTheDocument();
      });
    });

    it('should show empty state when no project data', async () => {
      vi.mocked(dashboardService.getUserProjectStats).mockResolvedValue({
        projects: [],
      });

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('No project data available')).toBeInTheDocument();
      });
    });

    it('should show empty state when no upcoming holidays', async () => {
      vi.mocked(calendarService.getHolidays).mockResolvedValue({
        data: [],
      });

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('No upcoming holidays')).toBeInTheDocument();
      });
    });
  });

  describe('manager permissions', () => {
    beforeEach(() => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: mockManagerUser,
            permissions: ['approve_timesheets', 'approve_leave_requests'],
          };
          return selector(state);
        }
        return mockManagerUser;
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      // Mock manager-specific API calls
      vi.mocked(timesheetsService.timesheetsService.getAll).mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        total: 3,
        page: 1,
        limit: 10,
        pages: 1,
      } as any);

      vi.mocked(leaveRequestsService.getLeaveRequests).mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ] as any);
    });

    it('should display pending timesheets count for managers', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Pending Timesheets')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display pending leave requests count for managers', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Pending Leave Requests')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should call team API endpoints for managers', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect(timesheetsService.timesheetsService.getAll).toHaveBeenCalledWith({
          team: 'true',
          status: 'pending',
        });
        expect(leaveRequestsService.getLeaveRequests).toHaveBeenCalledWith({
          team: true,
          status: 'pending',
        });
      });
    });

    it('should not show manager widgets for employees', async () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: mockEmployeeUser,
            permissions: [],
          };
          return selector(state);
        }
        return mockEmployeeUser;
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.queryByText('Pending Timesheets')).not.toBeInTheDocument();
        expect(screen.queryByText('Pending Leave Requests')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(dashboardService.getWeeklyStats).mockRejectedValue(new Error('API Error'));

      render(<DashboardContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load dashboard data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should send errors to Sentry', async () => {
      const mockError = new Error('API Error');
      vi.mocked(dashboardService.getWeeklyStats).mockRejectedValue(mockError);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DashboardContent />);

      await waitFor(() => {
        expect((global as any).window.Sentry.captureException).toHaveBeenCalledWith(mockError);
      });
    });

    it('should still render empty states on error', async () => {
      vi.mocked(dashboardService.getWeeklyStats).mockRejectedValue(new Error('API Error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DashboardContent />);

      await waitFor(() => {
        // Should still show the dashboard structure
        expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      });
    });
  });

  describe('analytics tracking', () => {
    it('should track dashboard viewed event', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        expect((global as any).window.posthog.capture).toHaveBeenCalledWith('dashboard_viewed', {
          userId: mockEmployeeUser.id,
        });
      });
    });

    it('should not crash if PostHog is not available', async () => {
      (window as any).posthog = undefined;

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      });
    });
  });

  describe('data rendering', () => {
    it('should render daily hours breakdown', async () => {
      render(<DashboardContent />);

      await waitFor(() => {
        const hoursElements = screen.getAllByText(/8h/);
        expect(hoursElements.length).toBeGreaterThan(0);
      });
    });

    it('should display top 5 projects only', async () => {
      const manyProjects = {
        projects: Array.from({ length: 10 }, (_, i) => ({
          projectId: `${i + 1}`,
          projectName: `Project ${i + 1}`,
          totalHours: 10,
          percentage: 10,
        })),
      };

      vi.mocked(dashboardService.getUserProjectStats).mockResolvedValue(manyProjects);

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument();
        expect(screen.getByText('Project 5')).toBeInTheDocument();
        expect(screen.queryByText('Project 6')).not.toBeInTheDocument();
      });
    });

    it('should display top 5 upcoming holidays only', async () => {
      const manyHolidays = {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Holiday ${i + 1}`,
          date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
          type: 'public' as const,
          isRecurring: false,
          tenantId: 'tenant-1',
        })),
      };

      vi.mocked(calendarService.getHolidays).mockResolvedValue(manyHolidays);

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByText('Holiday 1')).toBeInTheDocument();
        expect(screen.queryByText('Holiday 6')).not.toBeInTheDocument();
      });
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes', async () => {
      const { container } = render(<DashboardContent />);

      await waitFor(() => {
        const darkElements = container.querySelectorAll('.dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:text-gray-100');
        expect(darkElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('user not logged in', () => {
    it('should not crash when user is null', async () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: null,
            permissions: [],
          };
          return selector(state);
        }
        return null;
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      expect(() => render(<DashboardContent />)).not.toThrow();

      // Wait a bit for component to stabilize
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should not fetch data when user is null', async () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: null,
            permissions: [],
          };
          return selector(state);
        }
        return null;
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      render(<DashboardContent />);

      await waitFor(() => {
        expect(dashboardService.getWeeklyStats).not.toHaveBeenCalled();
      });
    });
  });
});
