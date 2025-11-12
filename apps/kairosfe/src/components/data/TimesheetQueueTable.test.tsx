/**
 * Tests for TimesheetQueueTable Component
 * Comprehensive coverage of timesheet approval queue functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimesheetQueueTable from './TimesheetQueueTable';
import { useAuthStore } from '@/lib/store';
import * as timesheetsService from '@/lib/api/services/timesheets';
import * as toast from '@/lib/utils/toast';
import type { Timesheet } from '@kairos/shared';

// Mock dependencies
vi.mock('@/lib/store');
vi.mock('@/lib/api/services/timesheets');
vi.mock('@/lib/utils/toast');

// Mock TimesheetDetailModal
vi.mock('./TimesheetDetailModal', () => ({
  default: ({ timesheetId, onClose, onApprove, onReject }: any) => (
    <div data-testid="timesheet-detail-modal">
      <div>Timesheet ID: {timesheetId}</div>
      <button onClick={onClose}>Close</button>
      <button onClick={onApprove}>Approve from Modal</button>
      <button onClick={onReject}>Reject from Modal</button>
    </div>
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.actions': 'Actions',
        'common.cancel': 'Cancel',
        'timesheet.noPermissionToApprove': 'You do not have permission to approve timesheets',
        'timesheet.noPendingTimesheets': 'No pending timesheets',
        'timesheet.allTimesheetsReviewed': 'All timesheets have been reviewed',
        'timesheet.employee': 'Employee',
        'timesheet.employeeId': 'Employee ID',
        'timesheet.week': 'Week',
        'timesheet.totalHours': 'Total Hours',
        'timesheet.submitted': 'Submitted',
        'timesheet.view': 'View',
        'timesheet.approve': 'Approve',
        'timesheet.reject': 'Reject',
        'timesheet.confirmApprove': 'Are you sure you want to approve this timesheet?',
        'timesheet.rejectTimesheet': 'Reject Timesheet',
        'timesheet.provideRejectionReason': 'Please provide a reason for rejection',
        'timesheet.rejectionReasonPlaceholder': 'Enter rejection reason...',
        'timesheet.rejectionReasonRequired': 'Rejection reason is required',
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

describe('TimesheetQueueTable', () => {
  const mockUser = {
    id: 'manager-1',
    name: 'Test Manager',
    email: 'manager@example.com',
    role: 'manager' as const,
    tenantId: 'tenant-1',
  };

  const mockTimesheets: Timesheet[] = [
    {
      id: 'ts-1',
      userId: 'user-1',
      weekStartDate: '2025-01-13',
      status: 'pending',
      totalHours: 40,
      submittedAt: '2025-01-20T10:00:00.000Z',
      createdAt: '2025-01-13T08:00:00.000Z',
      entries: [],
    },
    {
      id: 'ts-2',
      userId: 'user-2',
      weekStartDate: '2025-01-06',
      status: 'pending',
      totalHours: 35,
      submittedAt: '2025-01-13T14:00:00.000Z',
      createdAt: '2025-01-06T08:00:00.000Z',
      entries: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    // Mock window.posthog
    (window as any).posthog = {
      capture: vi.fn(),
    };

    // Mock auth store (manager with approve permissions)
    const mockStore = (selector: any) => {
      if (typeof selector === 'function') {
        const state = {
          user: mockUser,
          permissions: ['approve_timesheets'],
        };
        return selector(state);
      }
      return { user: mockUser, permissions: ['approve_timesheets'] };
    };
    vi.mocked(useAuthStore).mockImplementation(mockStore as any);

    // Mock API calls
    vi.mocked(timesheetsService.getTimesheets).mockResolvedValue({
      data: mockTimesheets,
      meta: { total: 2, totalPages: 1, page: 1, limit: 10 },
    } as any);
    vi.mocked(timesheetsService.approveTimesheet).mockResolvedValue(undefined);
    vi.mocked(timesheetsService.rejectTimesheet).mockResolvedValue(undefined);

    // Mock toast
    vi.mocked(toast.showToast.error).mockImplementation(() => {});
  });

  describe('permission check', () => {
    it('should show no permission message when user lacks permission', async () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: mockUser,
            permissions: [],
          };
          return selector(state);
        }
        return { user: mockUser, permissions: [] };
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('You do not have permission to approve timesheets')).toBeInTheDocument();
      });
    });

    it('should still load timesheets but not display them without permission', async () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: mockUser,
            permissions: [],
          };
          return selector(state);
        }
        return { user: mockUser, permissions: [] };
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('You do not have permission to approve timesheets')).toBeInTheDocument();
      });

      // useEffect still runs, so API is called but results aren't shown
      expect(timesheetsService.getTimesheets).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading spinner initially', async () => {
      render(<TimesheetQueueTable />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful data load', () => {
    it('should load and display pending timesheets', async () => {
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
        expect(screen.getByText(/Employee ID: user-2/)).toBeInTheDocument();
      });
    });

    it('should call API with pending status filter', async () => {
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(timesheetsService.getTimesheets).toHaveBeenCalledWith({ status: 'pending' });
      });
    });

    it('should display table headers', async () => {
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('Employee')).toBeInTheDocument();
        expect(screen.getByText('Week')).toBeInTheDocument();
        expect(screen.getByText('Total Hours')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('should display timesheet details', async () => {
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('40h')).toBeInTheDocument();
        expect(screen.getByText('35h')).toBeInTheDocument();
      });
    });

    it('should display action buttons for each timesheet', async () => {
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        const approveButtons = screen.getAllByText('Approve');
        const rejectButtons = screen.getAllByText('Reject');

        expect(viewButtons.length).toBe(2);
        expect(approveButtons.length).toBe(2);
        expect(rejectButtons.length).toBe(2);
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no timesheets', async () => {
      vi.mocked(timesheetsService.getTimesheets).mockResolvedValue({
        data: [],
        meta: { total: 0, totalPages: 0, page: 1, limit: 10 },
      } as any);

      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('No pending timesheets')).toBeInTheDocument();
        expect(screen.getByText('All timesheets have been reviewed')).toBeInTheDocument();
      });
    });

    it('should show check icon in empty state', async () => {
      vi.mocked(timesheetsService.getTimesheets).mockResolvedValue({
        data: [],
        meta: { total: 0, totalPages: 0, page: 1, limit: 10 },
      } as any);

      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('check_circle')).toBeInTheDocument();
      });
    });
  });

  describe('view timesheet', () => {
    it('should open detail modal when view button clicked', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(screen.getByTestId('timesheet-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Timesheet ID: ts-1')).toBeInTheDocument();
    });

    it('should close detail modal', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(screen.getByTestId('timesheet-detail-modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('timesheet-detail-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('approve timesheet', () => {
    it('should show confirm dialog when approve clicked', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to approve this timesheet?');
    });

    it('should call approve API', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(timesheetsService.approveTimesheet).toHaveBeenCalledWith('ts-1');
      });
    });

    it('should track approval event', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect((window as any).posthog.capture).toHaveBeenCalledWith('timesheet_approved', {
          timesheetId: 'ts-1',
          managerId: mockUser.id,
        });
      });
    });

    it('should remove timesheet from list after approval', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/Employee ID: user-1/)).not.toBeInTheDocument();
      });

      // Other timesheet should still be visible
      expect(screen.getByText(/Employee ID: user-2/)).toBeInTheDocument();
    });

    it('should not approve if confirm is cancelled', async () => {
      global.confirm = vi.fn(() => false);

      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      expect(timesheetsService.approveTimesheet).not.toHaveBeenCalled();
    });

    it('should reload data on approval error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(timesheetsService.approveTimesheet).mockRejectedValue(new Error('Approval failed'));

      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const initialCalls = vi.mocked(timesheetsService.getTimesheets).mock.calls.length;

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(timesheetsService.getTimesheets).toHaveBeenCalledTimes(initialCalls + 1);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('reject timesheet', () => {
    it('should open rejection modal when reject clicked', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();
      expect(screen.getByText('Please provide a reason for rejection')).toBeInTheDocument();
    });

    it('should have rejection reason textarea', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      const textarea = screen.getByPlaceholderText('Enter rejection reason...');
      expect(textarea).toBeInTheDocument();
    });

    it('should allow typing rejection reason', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      const textarea = screen.getByPlaceholderText('Enter rejection reason...') as HTMLTextAreaElement;
      await user.type(textarea, 'Missing project details');

      expect(textarea.value).toBe('Missing project details');
    });

    it('should close rejection modal on cancel', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Reject Timesheet')).not.toBeInTheDocument();
      });
    });

    it('should show error if rejection reason is empty', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();
      });

      // Find the reject button in the modal (it's inside a div with the title)
      const modal = screen.getByText('Reject Timesheet').closest('div');
      const rejectSubmitButton = modal!.querySelector('button.bg-red-600') as HTMLButtonElement;
      await user.click(rejectSubmitButton);

      expect(toast.showToast.error).toHaveBeenCalledWith('Rejection reason is required');
    });

    it('should call reject API with reason', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Enter rejection reason...');
      await user.type(textarea, 'Missing project details');

      const modal = screen.getByText('Reject Timesheet').closest('div');
      const rejectSubmitButton = modal!.querySelector('button.bg-red-600') as HTMLButtonElement;
      await user.click(rejectSubmitButton);

      await waitFor(() => {
        expect(timesheetsService.rejectTimesheet).toHaveBeenCalledWith('ts-1', 'Missing project details');
      });
    });

    it('should track rejection event', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Enter rejection reason...');
      await user.type(textarea, 'Missing details');

      const modal = screen.getByText('Reject Timesheet').closest('div');
      const rejectSubmitButton = modal!.querySelector('button.bg-red-600') as HTMLButtonElement;
      await user.click(rejectSubmitButton);

      await waitFor(() => {
        expect((window as any).posthog.capture).toHaveBeenCalledWith('timesheet_rejected', {
          timesheetId: 'ts-1',
          managerId: mockUser.id,
        });
      });
    });

    it('should remove timesheet from list after rejection', async () => {
      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Enter rejection reason...');
      await user.type(textarea, 'Missing details');

      const modal = screen.getByText('Reject Timesheet').closest('div');
      const rejectSubmitButton = modal!.querySelector('button.bg-red-600') as HTMLButtonElement;
      await user.click(rejectSubmitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Employee ID: user-1/)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Employee ID: user-2/)).toBeInTheDocument();
    });

    it('should reload data on rejection error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(timesheetsService.rejectTimesheet).mockRejectedValue(new Error('Rejection failed'));

      const user = userEvent.setup();
      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      const initialCalls = vi.mocked(timesheetsService.getTimesheets).mock.calls.length;

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Reject Timesheet')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Enter rejection reason...');
      await user.type(textarea, 'Missing details');

      const modal = screen.getByText('Reject Timesheet').closest('div');
      const rejectSubmitButton = modal!.querySelector('button.bg-red-600') as HTMLButtonElement;
      await user.click(rejectSubmitButton);

      await waitFor(() => {
        expect(timesheetsService.getTimesheets).toHaveBeenCalledTimes(initialCalls + 1);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle API load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(timesheetsService.getTimesheets).mockRejectedValue(new Error('Network error'));

      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load pending timesheets:', expect.any(Error));
      });

      // Should show empty state
      expect(screen.getByText('No pending timesheets')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should not load when user is null', async () => {
      const mockStore = (selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            user: null,
            permissions: ['approve_timesheets'],
          };
          return selector(state);
        }
        return { user: null, permissions: ['approve_timesheets'] };
      };
      vi.mocked(useAuthStore).mockImplementation(mockStore as any);

      render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Should not call API
      expect(timesheetsService.getTimesheets).not.toHaveBeenCalled();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes', async () => {
      const { container } = render(<TimesheetQueueTable />);

      await waitFor(() => {
        expect(screen.getByText(/Employee ID: user-1/)).toBeInTheDocument();
      });

      // Check for dark mode classes in the rendered HTML
      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-800');
      expect(htmlContent).toContain('dark:text-gray-100');
    });
  });
});
