/**
 * Tests for TeamManagementContentNew Component
 * Comprehensive coverage of employee management functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamManagementContentNew from './TeamManagementContentNew';
import { employeesService } from '@/lib/api/services/employees';
import { useAuthStore } from '@/lib/store';
import * as permissions from '@/lib/utils/permissions';
import type { Employee } from '@kairos/shared';

// Mock dependencies
vi.mock('@/lib/api/services/employees');
vi.mock('@/lib/store');
vi.mock('@/lib/utils/permissions');

// Mock modal components
vi.mock('@/components/forms/AddEmployeeModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="add-employee-modal">
        <button onClick={onClose}>Close Add</button>
        <button onClick={onSuccess}>Success Add</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/forms/BulkImportModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="bulk-import-modal">
        <button onClick={onClose}>Close Bulk</button>
        <button onClick={onSuccess}>Success Bulk</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/forms/EditEmployeeModal', () => ({
  default: ({ isOpen, onClose, onSuccess, employee }: any) => (
    isOpen ? (
      <div data-testid="edit-employee-modal">
        <div>{employee?.name}</div>
        <button onClick={onClose}>Close Edit</button>
        <button onClick={onSuccess}>Success Edit</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/ui/ConfirmDeleteDialog', () => ({
  default: ({ isOpen, onClose, onSuccess, employee }: any) => (
    isOpen ? (
      <div data-testid="confirm-delete-dialog">
        <div>{employee?.name}</div>
        <button onClick={onClose}>Close Delete</button>
        <button onClick={onSuccess}>Success Delete</button>
      </div>
    ) : null
  ),
}));

describe('TeamManagementContentNew', () => {
  const mockEmployees: Employee[] = [
    {
      id: '1',
      name: 'Olivia Rhye',
      email: 'olivia@kairos.com',
      locale: 'en',
      createdAt: '2025-01-15T10:00:00.000Z',
      lastLoginAt: '2025-10-24T14:30:00.000Z',
      membership: {
        role: 'employee',
        status: 'active',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
      profile: {
        jobTitle: 'Software Engineer',
        startDate: '2025-01-15',
        managerUserId: null,
        location: 'New York, NY',
        phone: null,
      },
    },
    {
      id: '2',
      name: 'Phoenix Baker',
      email: 'phoenix@kairos.com',
      locale: 'en',
      createdAt: '2025-01-16T11:00:00.000Z',
      lastLoginAt: '2025-10-25T09:15:00.000Z',
      membership: {
        role: 'manager',
        status: 'active',
        createdAt: '2025-01-16T11:00:00.000Z',
      },
      profile: {
        jobTitle: 'Engineering Manager',
        startDate: '2024-06-01',
        managerUserId: null,
        location: 'San Francisco, CA',
        phone: null,
      },
    },
  ];

  const mockApiResponse = {
    data: mockEmployees,
    meta: {
      total: 2,
      totalPages: 1,
      page: 1,
      limit: 10,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth store (manager with all permissions)
    const mockStore = (selector: any) => {
      if (typeof selector === 'function') {
        const state = {
          role: 'manager' as const,
        };
        return selector(state);
      }
      return { role: 'manager' };
    };
    vi.mocked(useAuthStore).mockImplementation(mockStore as any);

    // Mock permissions (all true by default)
    vi.mocked(permissions.canAddEmployee).mockReturnValue(true);
    vi.mocked(permissions.canEditEmployee).mockReturnValue(true);
    vi.mocked(permissions.canDeactivateEmployee).mockReturnValue(true);

    // Mock API
    vi.mocked(employeesService.getAll).mockResolvedValue(mockApiResponse);
  });

  describe('loading state', () => {
    it('should show loading message initially', async () => {
      render(<TeamManagementContentNew />);

      expect(screen.getByText('Loading employees...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading employees...')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful data load', () => {
    it('should display employee list after loading', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
        expect(screen.getByText('Phoenix Baker')).toBeInTheDocument();
      });
    });

    it('should display employee details', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('olivia@kairos.com')).toBeInTheDocument();
        expect(screen.getAllByText('Software Engineer').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Engineering Manager').length).toBeGreaterThan(0);
      });
    });

    it('should call API with default params', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          search: undefined,
          role: undefined,
          status: 'active',
          sort: 'name:asc',
        });
      });
    });

    it('should display pagination info', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 2 of 2 results/i)).toBeInTheDocument();
        expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('should allow searching by name', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'Olivia');

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(employeesService.getAll).toHaveBeenCalledWith(
            expect.objectContaining({
              search: 'Olivia',
            })
          );
        },
        { timeout: 500 }
      );
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');

      // Type multiple characters quickly
      await user.type(searchInput, 'abc');

      // Should not call API immediately
      expect(employeesService.getAll).toHaveBeenCalledTimes(1); // Only initial load

      // Wait for debounce
      await waitFor(
        () => {
          expect(employeesService.getAll).toHaveBeenCalledWith(
            expect.objectContaining({
              search: 'abc',
            })
          );
        },
        { timeout: 500 }
      );
    });

    it('should reset to page 1 on search', async () => {
      const user = userEvent.setup();

      // Mock paginated response
      vi.mocked(employeesService.getAll).mockResolvedValue({
        ...mockApiResponse,
        meta: { ...mockApiResponse.meta, totalPages: 3 },
      });

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByRole('button', { name: /chevron_right/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });

      // Search should reset to page 1
      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'test');

      await waitFor(
        () => {
          expect(employeesService.getAll).toHaveBeenCalledWith(
            expect.objectContaining({
              page: 1,
              search: 'test',
            })
          );
        },
        { timeout: 500 }
      );
    });
  });

  describe('filtering', () => {
    it('should filter by role', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const roleFilter = screen.getByDisplayValue('All Roles');
      await user.selectOptions(roleFilter, 'manager');

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'manager',
          })
        );
      });
    });

    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue('Active');
      await user.selectOptions(statusFilter, 'disabled');

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'disabled',
          })
        );
      });
    });

    it('should change sort order', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('Name (A-Z)');
      await user.selectOptions(sortSelect, 'email:desc');

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'email:desc',
          })
        );
      });
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      vi.mocked(employeesService.getAll).mockResolvedValue({
        ...mockApiResponse,
        meta: { ...mockApiResponse.meta, totalPages: 3 },
      });
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /chevron_right/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      // Go to page 2 first
      const nextButton = screen.getByRole('button', { name: /chevron_right/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });

      // Go back to page 1
      const prevButton = screen.getByRole('button', { name: /chevron_left/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          })
        );
      });
    });

    it('should disable previous button on first page', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const prevButton = screen.getByRole('button', { name: /chevron_left/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      const user = userEvent.setup();

      // Mock last page
      vi.mocked(employeesService.getAll).mockResolvedValue({
        ...mockApiResponse,
        meta: { ...mockApiResponse.meta, totalPages: 1 },
      });

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /chevron_right/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('permission-based features', () => {
    it('should show Add Employee button when user has permission', async () => {
      vi.mocked(permissions.canAddEmployee).mockReturnValue(true);

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Add Employee')).toBeInTheDocument();
      });
    });

    it('should hide Add Employee button when user lacks permission', async () => {
      vi.mocked(permissions.canAddEmployee).mockReturnValue(false);

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      expect(screen.queryByText('Add Employee')).not.toBeInTheDocument();
    });

    it('should show action buttons when user has edit permission', async () => {
      vi.mocked(permissions.canEditEmployee).mockReturnValue(true);

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getAllByText('more_horiz').length).toBeGreaterThan(0);
      });
    });

    it('should hide action buttons when user lacks permissions', async () => {
      vi.mocked(permissions.canEditEmployee).mockReturnValue(false);
      vi.mocked(permissions.canDeactivateEmployee).mockReturnValue(false);

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      expect(screen.queryByText('more_horiz')).not.toBeInTheDocument();
    });
  });

  describe('modal interactions', () => {
    it('should open add employee modal', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Add Employee')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Employee');
      await user.click(addButton);

      // Click "Add Single Employee" in dropdown
      const addSingleButton = await screen.findByText('Add Single Employee');
      await user.click(addSingleButton);

      expect(screen.getByTestId('add-employee-modal')).toBeInTheDocument();
    });

    it('should open bulk import modal', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Add Employee')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Employee');
      await user.click(addButton);

      // Click "Bulk Import" in dropdown
      const bulkImportButton = await screen.findByText('Bulk Import');
      await user.click(bulkImportButton);

      expect(screen.getByTestId('bulk-import-modal')).toBeInTheDocument();
    });

    it('should reload data after adding employee', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Add Employee')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Employee');
      await user.click(addButton);

      const addSingleButton = await screen.findByText('Add Single Employee');
      await user.click(addSingleButton);

      // Initial load + reload after opening modal
      const initialCalls = vi.mocked(employeesService.getAll).mock.calls.length;

      // Click success
      const successButton = screen.getByText('Success Add');
      await user.click(successButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledTimes(initialCalls + 1);
      });
    });

    it('should open edit modal with employee data', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getAllByText('Olivia Rhye').length).toBeGreaterThan(0);
      });

      // Click action menu
      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      // Click Edit
      const editButton = await screen.findByText('Edit');
      await user.click(editButton);

      expect(screen.getByTestId('edit-employee-modal')).toBeInTheDocument();
      // Name appears in both table and modal
      expect(screen.getAllByText('Olivia Rhye').length).toBeGreaterThan(1);
    });

    it('should reload data after editing employee', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      const editButton = await screen.findByText('Edit');
      await user.click(editButton);

      const initialCalls = vi.mocked(employeesService.getAll).mock.calls.length;

      const successButton = screen.getByText('Success Edit');
      await user.click(successButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledTimes(initialCalls + 1);
      });
    });

    it('should open delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getAllByText('Olivia Rhye').length).toBeGreaterThan(0);
      });

      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      const deactivateButton = await screen.findByText('Deactivate');
      await user.click(deactivateButton);

      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
      // Name appears in both table and dialog
      expect(screen.getAllByText('Olivia Rhye').length).toBeGreaterThan(1);
    });

    it('should reload data after deleting employee', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      const deactivateButton = await screen.findByText('Deactivate');
      await user.click(deactivateButton);

      const initialCalls = vi.mocked(employeesService.getAll).mock.calls.length;

      const successButton = screen.getByText('Success Delete');
      await user.click(successButton);

      await waitFor(() => {
        expect(employeesService.getAll).toHaveBeenCalledTimes(initialCalls + 1);
      });
    });
  });

  describe('status and role badges', () => {
    it('should display status badge', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      });
    });

    it('should display role badge', async () => {
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Employee')).toBeInTheDocument();
        expect(screen.getByText('Manager')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should show error message on API failure', async () => {
      vi.mocked(employeesService.getAll).mockRejectedValue(new Error('Network error'));

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should show mock data on API failure', async () => {
      vi.mocked(employeesService.getAll).mockRejectedValue(new Error('Network error'));

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText(/Showing mock data for demonstration purposes/i)).toBeInTheDocument();
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });
    });

    it('should handle empty results', async () => {
      vi.mocked(employeesService.getAll).mockResolvedValue({
        data: [],
        meta: { total: 0, totalPages: 0, page: 1, limit: 10 },
      });

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 0 to 0 of 0 results/i)).toBeInTheDocument();
      });
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes', async () => {
      const { container } = render(<TeamManagementContentNew />);

      await waitFor(() => {
        const darkElements = container.querySelectorAll(
          '.dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:text-gray-100'
        );
        expect(darkElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('action menu interactions', () => {
    it('should toggle action menu on click', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });

    it('should close action menu when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      expect(screen.getByText('Edit')).toBeInTheDocument();

      // Click backdrop (find the fixed inset-0 div)
      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      await user.click(backdrop!);

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      });
    });

    it('should only show deactivate for active employees', async () => {
      const user = userEvent.setup();

      // Add a disabled employee
      vi.mocked(employeesService.getAll).mockResolvedValue({
        data: [
          {
            ...mockEmployees[0],
            membership: { ...mockEmployees[0].membership, status: 'disabled' },
          },
        ],
        meta: { total: 1, totalPages: 1, page: 1, limit: 10 },
      });

      render(<TeamManagementContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      });

      const actionButtons = screen.getAllByText('more_horiz');
      await user.click(actionButtons[0]);

      // Should show Edit but not Deactivate
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
    });
  });
});
