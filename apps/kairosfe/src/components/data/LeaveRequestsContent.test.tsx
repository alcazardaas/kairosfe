/**
 * Tests for LeaveRequestsContent Component
 * Comprehensive coverage of leave request management functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaveRequestsContent from './LeaveRequestsContent';
import { apiClient } from '@/lib/api/client';
import * as posthog from '@/lib/analytics/posthog';
import type { LeaveRequest } from '@kairos/shared';

// Mock dependencies
vi.mock('@/lib/api/client');
vi.mock('@/lib/analytics/posthog');

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.cancel': 'Cancel',
        'common.unit.days': 'days',
        'leaveRequests.title': 'Leave Requests',
        'leaveRequests.createRequest': 'Create Request',
        'leaveRequests.type': 'Type',
        'leaveRequests.startDate': 'Start Date',
        'leaveRequests.endDate': 'End Date',
        'leaveRequests.reason': 'Reason',
        'leaveRequests.submit': 'Submit',
        'leaveRequests.noRequests': 'No leave requests yet',
        'leaveRequests.pending': 'Pending',
        'leaveRequests.approved': 'Approved',
        'leaveRequests.rejected': 'Rejected',
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

describe('LeaveRequestsContent', () => {
  const mockRequests: LeaveRequest[] = [
    {
      id: '1',
      userId: 'user-1',
      type: 'vacation',
      startDate: '2025-12-20',
      endDate: '2025-12-27',
      totalDays: 5,
      status: 'pending',
      reason: 'Family holiday',
      createdAt: '2025-11-01T10:00:00.000Z',
    },
    {
      id: '2',
      userId: 'user-1',
      type: 'sick',
      startDate: '2025-11-15',
      endDate: '2025-11-16',
      totalDays: 2,
      status: 'approved',
      reason: 'Medical appointment',
      createdAt: '2025-11-10T09:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API calls
    vi.mocked(apiClient.get).mockResolvedValue(mockRequests);
    vi.mocked(apiClient.post).mockResolvedValue({
      id: '3',
      userId: 'user-1',
      type: 'personal',
      startDate: '2025-12-01',
      endDate: '2025-12-02',
      totalDays: 2,
      status: 'pending',
      reason: 'Personal matters',
      createdAt: '2025-11-12T08:00:00.000Z',
    } as LeaveRequest);

    // Mock analytics
    vi.mocked(posthog.trackPageView).mockImplementation(() => {});
  });

  describe('loading state', () => {
    it('should show loading message initially', async () => {
      render(<LeaveRequestsContent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful data load', () => {
    it('should display leave requests after loading', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('vacation')).toBeInTheDocument();
        expect(screen.getByText('sick')).toBeInTheDocument();
      });
    });

    it('should display request details', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText(/2025-12-20/)).toBeInTheDocument();
        expect(screen.getByText(/2025-12-27/)).toBeInTheDocument();
        expect(screen.getByText(/2025-11-15/)).toBeInTheDocument();
        expect(screen.getByText(/2025-11-16/)).toBeInTheDocument();
        expect(screen.getAllByText(/\d+\s+days/i).length).toBe(2);
      });
    });

    it('should display status badges', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });
    });

    it('should call API on mount', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/leave-requests');
      });
    });

    it('should track page view', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(posthog.trackPageView).toHaveBeenCalledWith('leave-requests');
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no requests', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('No leave requests yet')).toBeInTheDocument();
      });
    });
  });

  describe('create request form', () => {
    it('should show form when create button clicked', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should hide form when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();

      // Close form
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
    });

    it('should toggle form visibility', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });

      // Toggle open
      await user.click(createButton);
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();

      // Toggle close
      await user.click(createButton);
      expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should have type select with options', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      expect(screen.getByRole('option', { name: 'Vacation' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sick' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Personal' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
    });

    it('should allow selecting different leave types', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const typeSelect = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'sick');

      expect(typeSelect.value).toBe('sick');
    });

    it('should have date inputs', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;

      expect(startDateInput.type).toBe('date');
      expect(endDateInput.type).toBe('date');
    });

    it('should have optional reason field', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const reasonInput = screen.getByLabelText('Reason');
      expect(reasonInput).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      // Fill form
      const typeSelect = screen.getByRole('combobox');
      await user.selectOptions(typeSelect, 'personal');

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '2025-12-01');

      const endDateInput = screen.getByLabelText('End Date');
      await user.type(endDateInput, '2025-12-02');

      const reasonInput = screen.getByLabelText('Reason');
      await user.type(reasonInput, 'Personal matters');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/leave-requests', {
          type: 'personal',
          startDate: '2025-12-01',
          endDate: '2025-12-02',
          reason: 'Personal matters',
        });
      });
    });

    it('should add new request to list after submission', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('vacation')).toBeInTheDocument();
      });

      // Open form and submit
      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const typeSelect = screen.getByRole('combobox');
      await user.selectOptions(typeSelect, 'personal');

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '2025-12-01');

      const endDateInput = screen.getByLabelText('End Date');
      await user.type(endDateInput, '2025-12-02');

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('personal')).toBeInTheDocument();
      });
    });

    it('should close form after submission', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const typeSelect = screen.getByRole('combobox');
      await user.selectOptions(typeSelect, 'vacation');

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '2025-12-20');

      const endDateInput = screen.getByLabelText('End Date');
      await user.type(endDateInput, '2025-12-27');

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
      });
    });

    it('should reset form after submission', async () => {
      const user = userEvent.setup();
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      // Submit first request
      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '2025-12-01');

      const endDateInput = screen.getByLabelText('End Date');
      await user.type(endDateInput, '2025-12-02');

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
      });

      // Open form again - should be empty
      await user.click(createButton);

      const newStartDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const newEndDateInput = screen.getByLabelText('End Date') as HTMLInputElement;

      expect(newStartDateInput.value).toBe('');
      expect(newEndDateInput.value).toBe('');
    });
  });

  describe('error handling', () => {
    it('should handle API load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load leave requests:', expect.any(Error));
      });

      // Should show empty state
      expect(screen.getByText('No leave requests yet')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle API submit error gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Submit failed'));

      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Request/i });
      await user.click(createButton);

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '2025-12-01');

      const endDateInput = screen.getByLabelText('End Date');
      await user.type(endDateInput, '2025-12-02');

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create leave request:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('request list display', () => {
    it('should display multiple requests', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('vacation')).toBeInTheDocument();
        expect(screen.getByText('sick')).toBeInTheDocument();
      });
    });

    it('should display date ranges', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText(/2025-12-20/)).toBeInTheDocument();
        expect(screen.getByText(/2025-12-27/)).toBeInTheDocument();
        expect(screen.getByText(/2025-11-15/)).toBeInTheDocument();
        expect(screen.getByText(/2025-11-16/)).toBeInTheDocument();
      });
    });

    it('should display total days', async () => {
      render(<LeaveRequestsContent />);

      await waitFor(() => {
        const daysElements = screen.getAllByText(/\d+\s+days/i);
        expect(daysElements.length).toBe(2);
      });
    });

    it('should display status with correct class', async () => {
      const { container } = render(<LeaveRequestsContent />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });

      const pendingBadge = container.querySelector('.status-pending');
      const approvedBadge = container.querySelector('.status-approved');

      expect(pendingBadge).toBeInTheDocument();
      expect(approvedBadge).toBeInTheDocument();
    });
  });
});
