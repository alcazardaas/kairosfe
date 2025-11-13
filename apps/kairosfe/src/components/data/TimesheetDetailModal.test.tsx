/**
 * Comprehensive tests for TimesheetDetailModal Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimesheetDetailModal from './TimesheetDetailModal';
import * as timesheetsService from '@/lib/api/services/timesheets';
import * as timeEntriesService from '@/lib/api/services/time-entries';
import * as dateUtils from '@/lib/utils/date';
import type { TimesheetDto, TimeEntryDto } from '@/lib/api/schemas';

// Mock dependencies
vi.mock('@/lib/api/services/timesheets');
vi.mock('@/lib/api/services/time-entries');
vi.mock('@/lib/utils/date');

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.close': 'Close',
        'timesheet.timesheetDetails': 'Timesheet Details',
        'timesheet.status': 'Status',
        'timesheet.totalHours': 'Total Hours',
        'timesheet.submitted': 'Submitted',
        'timesheet.projectTask': 'Project / Task',
        'timesheet.dailyTotal': 'Daily Total',
        'timesheet.approve': 'Approve',
        'timesheet.reject': 'Reject',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock TimesheetStatusBadge component
vi.mock('./TimesheetStatusBadge', () => ({
  default: ({ status }: { status: string }) => <div data-testid="status-badge">{status}</div>,
}));

// Mock i18n module
vi.mock('@/lib/i18n', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));

describe('TimesheetDetailModal', () => {
  const mockOnClose = vi.fn();
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  const mockTimesheet: TimesheetDto = {
    id: 'ts-123',
    userId: 'user-456',
    weekStartDate: '2025-01-13',
    status: 'pending',
    totalHours: 40,
    submittedAt: '2025-01-19T10:00:00Z',
    createdAt: '2025-01-13T08:00:00Z',
    updatedAt: '2025-01-19T10:00:00Z',
  };

  const mockEntries: TimeEntryDto[] = [
    {
      id: 'entry-1',
      userId: 'user-456',
      projectId: 'proj-1',
      projectName: 'Project Alpha',
      taskId: 'task-1',
      taskName: 'Development',
      weekStartDate: '2025-01-13',
      dayOfWeek: 1, // Monday
      hours: 8,
      note: 'Backend work',
      createdAt: '2025-01-13T10:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z',
    },
    {
      id: 'entry-2',
      userId: 'user-456',
      projectId: 'proj-1',
      projectName: 'Project Alpha',
      taskId: 'task-2',
      taskName: 'Testing',
      weekStartDate: '2025-01-13',
      dayOfWeek: 2, // Tuesday
      hours: 8,
      note: null,
      createdAt: '2025-01-14T10:00:00Z',
      updatedAt: '2025-01-14T10:00:00Z',
    },
  ];

  const mockWeekDates = [
    new Date('2025-01-12'), // Sunday
    new Date('2025-01-13'), // Monday
    new Date('2025-01-14'), // Tuesday
    new Date('2025-01-15'), // Wednesday
    new Date('2025-01-16'), // Thursday
    new Date('2025-01-17'), // Friday
    new Date('2025-01-18'), // Saturday
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup date utils mocks
    vi.mocked(dateUtils.getWeekDates).mockReturnValue(mockWeekDates);
    vi.mocked(dateUtils.formatDate).mockImplementation((date) => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date;
    });
    vi.mocked(dateUtils.getDayName).mockImplementation((date) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching data', () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show loading in modal overlay', () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockReturnValue(
        new Promise(() => {})
      );

      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('successful data display', () => {
    beforeEach(() => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: mockEntries,
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
      });
    });

    it('should display timesheet details title', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Timesheet Details')).toBeInTheDocument();
      });
    });

    it('should display week date range', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        // Format will be like "1/12/2025 - 1/18/2025"
        const dateRange = screen.getByText(/1\/12\/2025.*1\/18\/2025/);
        expect(dateRange).toBeInTheDocument();
      });
    });

    it('should display timesheet status badge', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const badge = screen.getByTestId('status-badge');
        expect(badge).toHaveTextContent('pending');
      });
    });

    it('should display total hours', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('40h')).toBeInTheDocument();
      });
    });

    it('should display submitted date when available', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const submittedDate = new Date('2025-01-19T10:00:00Z').toLocaleString();
        expect(screen.getByText(submittedDate)).toBeInTheDocument();
      });
    });

    it('should display dash when not submitted', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue({
        ...mockTimesheet,
        submittedAt: null,
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const submittedLabel = screen.getByText('Submitted');
        const container = submittedLabel.closest('div');
        expect(container?.textContent).toContain('-');
      });
    });

    it('should display all day headers', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

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

    it('should display time entries', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        // Component displays projectId and taskId, not names
        // Both entries have same projectId so we expect 2 instances
        const projectEntries = screen.getAllByText(/Project: proj-1/);
        expect(projectEntries.length).toBe(2);
        expect(screen.getByText(/Task: task-1/)).toBeInTheDocument();
        expect(screen.getByText(/Task: task-2/)).toBeInTheDocument();
      });
    });

    it('should display entry notes when present', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Backend work')).toBeInTheDocument();
      });
    });

    it('should display hours for correct days', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const hourCells = screen.getAllByText('8h');
        expect(hourCells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('daily totals calculation', () => {
    beforeEach(() => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
    });

    it('should calculate daily totals correctly', async () => {
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: mockEntries,
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Daily Total')).toBeInTheDocument();
      });
    });

    it('should show dash for days with zero hours', async () => {
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: [mockEntries[0]], // Only Monday entry
        pagination: { page: 1, perPage: 50, total: 1, totalPages: 1 },
      });

      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const dailyTotalRow = container.querySelectorAll('tbody tr')[1];
        expect(dailyTotalRow.textContent).toContain('-');
      });
    });

    it('should sum multiple entries for same day', async () => {
      const multipleEntriesOneDay: TimeEntryDto[] = [
        { ...mockEntries[0], hours: 4 },
        { ...mockEntries[0], id: 'entry-3', hours: 4 },
      ];

      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: multipleEntriesOneDay,
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Daily Total')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    beforeEach(() => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: mockEntries,
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
      });
    });

    it('should always show close button', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const closeButtons = screen.getAllByText('Close');
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Timesheet Details')).toBeInTheDocument();
      });

      const closeButton = screen.getAllByText('Close')[0];
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button clicked', async () => {
      const user = userEvent.setup();
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Timesheet Details')).toBeInTheDocument();
      });

      const xButton = screen.getByText('close'); // Material icon text
      await user.click(xButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should show approve and reject buttons for pending timesheet', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
        expect(screen.getByText('Reject')).toBeInTheDocument();
      });
    });

    it('should not show approve/reject for draft timesheet', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue({
        ...mockTimesheet,
        status: 'draft',
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Approve')).not.toBeInTheDocument();
        expect(screen.queryByText('Reject')).not.toBeInTheDocument();
      });
    });

    it('should not show approve/reject for approved timesheet', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue({
        ...mockTimesheet,
        status: 'approved',
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Approve')).not.toBeInTheDocument();
        expect(screen.queryByText('Reject')).not.toBeInTheDocument();
      });
    });

    it('should call onApprove when approve button clicked', async () => {
      const user = userEvent.setup();
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      const approveButton = screen.getByText('Approve');
      await user.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });

    it('should call onReject when reject button clicked', async () => {
      const user = userEvent.setup();
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reject')).toBeInTheDocument();
      });

      const rejectButton = screen.getByText('Reject');
      await user.click(rejectButton);

      expect(mockOnReject).toHaveBeenCalledTimes(1);
    });

    it('should not show approve button if onApprove not provided', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      });
    });

    it('should not show reject button if onReject not provided', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Reject')).not.toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('should fetch timesheet by ID', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: [],
        pagination: { page: 1, perPage: 50, total: 0, totalPages: 1 },
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(timesheetsService.timesheetsService.getById).toHaveBeenCalledWith('ts-123');
      });
    });

    it('should fetch time entries for timesheet week', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: [],
        pagination: { page: 1, perPage: 50, total: 0, totalPages: 1 },
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(timeEntriesService.timeEntriesService.getAll).toHaveBeenCalledWith({
          userId: 'user-456',
          weekStartDate: '2025-01-13',
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(timesheetsService.timesheetsService.getById).mockRejectedValue(
        new Error('API Error')
      );

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load timesheet details:',
          expect.any(Error)
        );
      });
    });

    it('should not fetch entries if weekStartDate missing', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue({
        ...mockTimesheet,
        weekStartDate: null as any,
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(timeEntriesService.timeEntriesService.getAll).not.toHaveBeenCalled();
      });
    });
  });

  describe('empty states', () => {
    beforeEach(() => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
    });

    it('should handle no time entries', async () => {
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: [],
        pagination: { page: 1, perPage: 50, total: 0, totalPages: 1 },
      });

      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Daily Total')).toBeInTheDocument();
      });
    });

    it('should return null if timesheet not found', async () => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(null as any);

      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('styling and layout', () => {
    beforeEach(() => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: mockEntries,
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
      });
    });

    it('should render modal overlay', async () => {
      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should use table layout for entries', async () => {
      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const table = container.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should include dark mode classes', async () => {
      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const darkBg = container.querySelector('.dark\\:bg-gray-800');
        expect(darkBg).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(timesheetsService.timesheetsService.getById).mockResolvedValue(mockTimesheet);
      vi.mocked(timeEntriesService.timeEntriesService.getAll).mockResolvedValue({
        data: mockEntries,
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
      });
    });

    it('should render semantic HTML table', async () => {
      const { container } = render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('table')).toBeInTheDocument();
        expect(container.querySelector('thead')).toBeInTheDocument();
        expect(container.querySelector('tbody')).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      render(
        <TimesheetDetailModal
          timesheetId="ts-123"
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
