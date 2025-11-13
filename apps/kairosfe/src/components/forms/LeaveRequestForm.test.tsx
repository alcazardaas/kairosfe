/**
 * Tests for LeaveRequestForm Component
 * Focused coverage of essential functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaveRequestForm from './LeaveRequestForm';
import { useAuthStore } from '@/lib/store';
import * as benefitTypesApi from '@/lib/api/endpoints/benefit-types';
import * as leaveRequestsService from '@/lib/api/services/leave-requests';
import * as calendarService from '@/lib/api/services/calendar';

// Mock dependencies
vi.mock('@/lib/store');
vi.mock('@/lib/api/endpoints/benefit-types');
vi.mock('@/lib/api/services/leave-requests');
vi.mock('@/lib/api/services/calendar');

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'leaveRequest.leaveType': 'Leave Type',
        'leaveRequest.startDate': 'Start Date',
        'leaveRequest.endDate': 'End Date',
        'leaveRequest.reason': 'Reason',
        'leaveRequest.submitRequest': 'Submit Request',
        'leaveRequest.businessDays': params?.count !== undefined ? `Business Days: ${params.count}` : 'Business Days',
        'common.loading': 'Loading',
        'common.retry': 'Retry',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
        'common.save': 'Save',
        'common.saving': 'Saving',
        'common.optional': 'optional',
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

describe('LeaveRequestForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'employee' as const,
  };

  const mockBenefitTypes = [
    { id: 'benefit-1', name: 'Vacation', code: 'VAC' },
    { id: 'benefit-2', name: 'Sick Leave', code: 'SICK' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue(mockUser as any);
    vi.mocked(benefitTypesApi.findAllBenefitTypes).mockResolvedValue({
      data: mockBenefitTypes,
    } as any);
    vi.mocked(leaveRequestsService.calculateBusinessDays).mockReturnValue(5);
    vi.mocked(calendarService.checkDateOverlap).mockResolvedValue({
      hasOverlap: false,
      holidays: [],
      leaves: [],
    });
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('rendering and loading states', () => {
    it('should show loading state for benefit types', () => {
      vi.mocked(benefitTypesApi.findAllBenefitTypes).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render benefit type dropdown after loading', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });
    });

    it('should populate benefit types options', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const select = screen.getByLabelText('Leave Type') as HTMLSelectElement;
        expect(select.options.length).toBe(3); // placeholder + 2 types
        expect(select.options[1].text).toBe('Vacation');
        expect(select.options[2].text).toBe('Sick Leave');
      });
    });

    it('should show error state if benefit types fail to load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(benefitTypesApi.findAllBenefitTypes).mockRejectedValue(
        new Error('API Error')
      );

      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load leave types')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load benefit types:', expect.any(Error));
    });

    it('should allow retry after error', async () => {
      vi.mocked(benefitTypesApi.findAllBenefitTypes)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: mockBenefitTypes } as any);

      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load leave types')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });
    });
  });

  describe('form fields', () => {
    it('should render all form fields', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason.*optional/i)).toBeInTheDocument();
    });

    it('should accept text in reason field', async () => {
      const user = userEvent.setup();
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const reasonField = screen.getByLabelText(/Reason.*optional/i) as HTMLTextAreaElement;
      await user.type(reasonField, 'Family vacation');

      expect(reasonField.value).toBe('Family vacation');
    });

    it('should accept date inputs', async () => {
      const user = userEvent.setup();
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const startDate = screen.getByLabelText('Start Date') as HTMLInputElement;
      const endDate = screen.getByLabelText('End Date') as HTMLInputElement;

      await user.type(startDate, '2025-01-20');
      await user.type(endDate, '2025-01-24');

      expect(startDate.value).toBe('2025-01-20');
      expect(endDate.value).toBe('2025-01-24');
    });
  });

  describe('business days calculation', () => {
    it('should display calculated business days', async () => {
      const user = userEvent.setup();
      vi.mocked(leaveRequestsService.calculateBusinessDays).mockReturnValue(5);

      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const startDate = screen.getByLabelText('Start Date');
      const endDate = screen.getByLabelText('End Date');

      await user.type(startDate, '2025-01-20');
      await user.type(endDate, '2025-01-24');

      await waitFor(() => {
        expect(screen.getByText('Business Days: 5')).toBeInTheDocument();
      });
    });

    it('should not show business days when dates are empty', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      // Component only shows business days if > 0, so nothing should be displayed initially
      expect(screen.queryByText(/Business Days:/)).not.toBeInTheDocument();
    });
  });

  describe('date overlap checking', () => {
    it('should check for date overlaps when dates change', async () => {
      const user = userEvent.setup();
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const startDate = screen.getByLabelText('Start Date');
      const endDate = screen.getByLabelText('End Date');

      await user.type(startDate, '2025-01-20');
      await user.type(endDate, '2025-01-24');

      await waitFor(() => {
        expect(calendarService.checkDateOverlap).toHaveBeenCalledWith(
          '2025-01-20',
          '2025-01-24',
          'user-123'
        );
      });
    });

    it('should handle overlap check errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(calendarService.checkDateOverlap).mockRejectedValue(
        new Error('Overlap check failed')
      );

      const user = userEvent.setup();
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const startDate = screen.getByLabelText('Start Date');
      const endDate = screen.getByLabelText('End Date');

      await user.type(startDate, '2025-01-20');
      await user.type(endDate, '2025-01-24');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to check date overlap:',
          expect.any(Error)
        );
      });
    });
  });

  describe('form submission', () => {
    it('should have submit button', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Request' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have cancel button', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should call onCancel when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit mode', () => {
    it('should pre-fill form with initial data', async () => {
      const initialData = {
        benefitTypeId: 'benefit-1',
        startDate: '2025-01-20',
        endDate: '2025-01-24',
        reason: 'Pre-filled reason',
      };

      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={initialData}
          isEditing={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Leave Type') as HTMLSelectElement;
      const startDate = screen.getByLabelText('Start Date') as HTMLInputElement;
      const endDate = screen.getByLabelText('End Date') as HTMLInputElement;
      const reason = screen.getByLabelText(/Reason.*optional/i) as HTMLTextAreaElement;

      expect(select.value).toBe('benefit-1');
      expect(startDate.value).toBe('2025-01-20');
      expect(endDate.value).toBe('2025-01-24');
      expect(reason.value).toBe('Pre-filled reason');
    });

    it('should show save button in edit mode', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isEditing={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', async () => {
      const { container } = render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const darkElements = container.querySelectorAll('.dark\\:bg-gray-900, .dark\\:text-gray-100, .dark\\:border-gray-600');
        expect(darkElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for all inputs', async () => {
      render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
        expect(screen.getByLabelText(/Reason.*optional/i)).toBeInTheDocument();
      });
    });

    it('should render semantic form element', async () => {
      const { container } = render(
        <LeaveRequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('form')).toBeInTheDocument();
      });
    });
  });
});
