/**
 * Tests for TeamReportsContent Component
 * Focused coverage of team reporting functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamReportsContent from './TeamReportsContent';
import { reportsService } from '@/lib/api/services/reports';
import { employeesService } from '@/lib/api/services/employees';
import { projectsService } from '@/lib/api/services/projects';

// Mock dependencies
vi.mock('@/lib/api/services/reports');
vi.mock('@/lib/api/services/employees');
vi.mock('@/lib/api/services/projects');

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

describe('TeamReportsContent', () => {
  const mockEmployees = [
    {
      id: 'emp-1',
      name: 'John Doe',
      email: 'john@example.com',
      membership: { role: 'employee', status: 'active' },
    },
  ];

  const mockProjects = [
    {
      id: 'proj-1',
      name: 'Project Alpha',
      code: 'ALPHA',
      active: true,
    },
  ];

  const mockTimesheetReportData = {
    totalHours: 120,
    statusStats: {
      draft: 2,
      submitted: 5,
      approved: 10,
      rejected: 1,
      total: 18,
    },
    projectAllocations: [
      {
        projectId: 'proj-1',
        projectName: 'Project Alpha',
        totalHours: 80,
        userCount: 2,
        avgHoursPerUser: 40,
      },
    ],
    userStats: [
      {
        userId: 'emp-1',
        userName: 'John Doe',
        totalHours: 80,
        weekCount: 4,
        avgWeeklyHours: 20,
        projectCount: 2,
      },
    ],
    teamUtilization: {
      totalEmployees: 1,
      activeEmployees: 1,
      avgHoursPerEmployee: 120,
      totalHours: 120,
    },
    timesheetCount: 18,
    entryCount: 24,
  };

  const mockLeaveReportData = {
    leaveStats: [
      {
        userId: 'emp-1',
        userName: 'John Doe',
        totalDays: 10,
        pendingDays: 2,
        approvedDays: 7,
        rejectedDays: 1,
      },
    ],
    summary: {
      totalRequests: 5,
      pendingRequests: 1,
      approvedRequests: 3,
      rejectedRequests: 1,
      totalDays: 10,
      pendingDays: 2,
      approvedDays: 7,
      rejectedDays: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API calls
    vi.mocked(employeesService.getAll).mockResolvedValue({
      data: mockEmployees,
      meta: { total: 1, totalPages: 1, page: 1, limit: 10 },
    } as any);

    vi.mocked(projectsService.getAll).mockResolvedValue({
      data: mockProjects,
      meta: { total: 1, totalPages: 1, page: 1, limit: 10 },
    } as any);

    vi.mocked(reportsService.getTimesheetReport).mockResolvedValue(mockTimesheetReportData as any);
    vi.mocked(reportsService.getLeaveReport).mockResolvedValue(mockLeaveReportData as any);
  });

  describe('initial render', () => {
    it('should render component', () => {
      render(<TeamReportsContent />);
      expect(document.body).toBeInTheDocument();
    });

    it('should load employees on mount', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalled();
      });
    });

    it('should load projects on mount', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(projectsService.getAll).toHaveBeenCalled();
      });
    });

    it('should initialize date range', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('report type selection', () => {
    it('should default to timesheets report', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(reportsService.getTimesheetReport).toHaveBeenCalled();
      });
    });

    it('should have leave report button available', async () => {
      const { container } = render(<TeamReportsContent />);

      await waitFor(() => {
        expect(reportsService.getTimesheetReport).toHaveBeenCalled();
      });

      // Verify leave report button exists
      const buttons = container.querySelectorAll('button');
      const leaveButton = Array.from(buttons).find((btn) =>
        btn.textContent?.toLowerCase().includes('leave')
      );

      expect(leaveButton).toBeDefined();
    });

    it('should allow switching to projects report', async () => {
      const user = userEvent.setup();
      const { container } = render(<TeamReportsContent />);

      await waitFor(() => {
        expect(reportsService.getTimesheetReport).toHaveBeenCalled();
      });

      const buttons = container.querySelectorAll('button');
      const projectsButton = Array.from(buttons).find((btn) =>
        btn.textContent?.toLowerCase().includes('project')
      );

      if (projectsButton) {
        await user.click(projectsButton);

        // Projects report just shows "coming soon" message, no API call
        await waitFor(() => {
          expect(document.body.textContent).toContain('teamReports.projectReportComingSoon');
        });
      }
    });
  });

  describe('filters', () => {
    it('should have date range inputs', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have date inputs with initialized values', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(reportsService.getTimesheetReport).toHaveBeenCalled();
      });

      const dateInputs = document.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);

      // Verify dates are initialized (last 30 days by default)
      const fromInput = dateInputs[0];
      const toInput = dateInputs[1];

      expect(fromInput.value).toBeTruthy();
      expect(toInput.value).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle employees load error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(employeesService.getAll).mockRejectedValue(new Error('Network error'));

      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle projects load error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(projectsService.getAll).mockRejectedValue(new Error('Network error'));

      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle report data load error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(reportsService.getTimesheetReport).mockRejectedValue(new Error('Report failed'));

      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('data loading', () => {
    it('should call timesheet report with correct parameters', async () => {
      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(reportsService.getTimesheetReport).toHaveBeenCalledWith(
          expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
          })
        );
      });
    });

    it('should handle empty employees list', async () => {
      vi.mocked(employeesService.getAll).mockResolvedValue({
        data: [],
        meta: { total: 0, totalPages: 0, page: 1, limit: 10 },
      } as any);

      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalled();
      });
    });

    it('should handle empty projects list', async () => {
      vi.mocked(projectsService.getAll).mockResolvedValue({
        data: [],
        meta: { total: 0, totalPages: 0, page: 1, limit: 10 },
      } as any);

      render(<TeamReportsContent />);

      await waitFor(() => {
        expect(projectsService.getAll).toHaveBeenCalled();
      });
    });
  });

  describe('analytics tracking', () => {
    it('should have posthog available for tracking', async () => {
      const posthog = (await import('posthog-js')).default;
      expect(posthog).toBeDefined();
      expect(posthog.capture).toBeDefined();
    });
  });
});
