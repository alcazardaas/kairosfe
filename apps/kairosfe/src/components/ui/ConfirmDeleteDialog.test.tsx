/**
 * Tests for ConfirmDeleteDialog Component
 * Comprehensive coverage of async deletion workflow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { employeesService } from '@/lib/api/services/employees';
import * as toast from '@/lib/utils/toast';

// Mock dependencies
vi.mock('@/lib/api/services/employees');
vi.mock('@/lib/utils/toast');

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'employees.success.deleted': 'Employee deactivated successfully',
        'employees.errors.deleteFailed': 'Failed to deactivate employee',
        'employees.errors.notFound': 'Employee not found',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('ConfirmDeleteDialog', () => {
  const mockEmployee = {
    id: 'emp-1',
    name: 'John Doe',
    email: 'john@example.com',
    membership: {
      role: 'employee' as const,
      status: 'active' as const,
    },
    profile: {
      jobTitle: 'Software Engineer',
    },
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toast.showToast.success).mockImplementation(() => {});
    vi.mocked(employeesService.deactivate).mockResolvedValue(undefined);
  });

  describe('visibility', () => {
    it('should render when isOpen is true and employee is provided', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Deactivate Employee')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmDeleteDialog
          isOpen={false}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when employee is null', () => {
      const { container } = render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={null}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('employee information display', () => {
    it('should display employee name', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display employee email when name is not available', () => {
      const employeeWithoutName = {
        ...mockEmployee,
        name: '',
      };

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={employeeWithoutName}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
    });

    it('should display employee email in details', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getAllByText(/john@example.com/i).length).toBeGreaterThan(0);
    });

    it('should display employee role', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('employee')).toBeInTheDocument();
    });

    it('should display job title when available', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should not display job title section when not available', () => {
      const employeeWithoutTitle = {
        ...mockEmployee,
        profile: undefined,
      };

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={employeeWithoutTitle}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText('Job Title:')).not.toBeInTheDocument();
    });
  });

  describe('warning message', () => {
    it('should display warning icon', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('warning')).toBeInTheDocument();
    });

    it('should display warning title', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should display warning message about access loss', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('They will lose access to the system immediately.')).toBeInTheDocument();
    });
  });

  describe('deactivation workflow', () => {
    it('should call employeesService.deactivate with correct ID', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(employeesService.deactivate).toHaveBeenCalledWith('emp-1');
      });
    });

    it('should show success toast on successful deactivation', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(toast.showToast.success).toHaveBeenCalledWith('Employee deactivated successfully');
      });
    });

    it('should call onSuccess after successful deactivation', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should call onClose after successful deactivation', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading text while deactivating', async () => {
      const user = userEvent.setup();

      vi.mocked(employeesService.deactivate).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      expect(screen.getByText('Deactivating...')).toBeInTheDocument();
    });

    it('should show loading spinner while deactivating', async () => {
      const user = userEvent.setup();

      vi.mocked(employeesService.deactivate).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { container } = render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable buttons while deactivating', async () => {
      const user = userEvent.setup();

      vi.mocked(employeesService.deactivate).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should display generic error message on failure', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(employeesService.deactivate).mockRejectedValue(new Error('Network error'));

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to deactivate employee')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should display permission denied error for 403', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(employeesService.deactivate).mockRejectedValue({ statusCode: 403 });

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should display not found error for 404', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(employeesService.deactivate).mockRejectedValue({ statusCode: 404 });

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText('Employee not found')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should keep dialog open on error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(employeesService.deactivate).mockRejectedValue(new Error('Failed'));

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to deactivate employee')).toBeInTheDocument();
      });

      // Dialog should still be visible with error message
      expect(screen.getByText('Deactivate Employee')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should clear error when closing and reopening', async () => {
      const user = userEvent.setup();
      vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(employeesService.deactivate).mockRejectedValue(new Error('Failed'));

      const { rerender } = render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to deactivate employee')).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      // Reopen dialog
      rerender(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText('Failed to deactivate employee')).not.toBeInTheDocument();
    });
  });

  describe('cancel functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when deleting', async () => {
      const user = userEvent.setup();

      vi.mocked(employeesService.deactivate).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      await user.click(deactivateButton);

      // Try to click cancel while deleting
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('styling and layout', () => {
    it('should have modal overlay', () => {
      const { container } = render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should have proper z-index', () => {
      const { container } = render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should have red danger button for deactivate', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const deactivateButton = screen.getByRole('button', { name: 'Deactivate' });
      expect(deactivateButton).toHaveClass('bg-red-600');
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes', () => {
      const { container } = render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-800');
      expect(htmlContent).toContain('dark:text-gray-100');
    });
  });

  describe('accessibility', () => {
    it('should have accessible buttons', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(
        <ConfirmDeleteDialog
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
