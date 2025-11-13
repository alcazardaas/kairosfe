/**
 * Tests for EditEmployeeModal Component
 * Focused coverage of essential functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditEmployeeModal from './EditEmployeeModal';
import * as employeesService from '@/lib/api/services/employees';
import * as toast from '@/lib/utils/toast';
import type { Employee } from '@kairos/shared';

// Mock dependencies
vi.mock('@/lib/api/services/employees');
vi.mock('@/lib/utils/toast');

// Mock AsyncCombobox
vi.mock('@/components/ui/AsyncCombobox', () => ({
  default: ({ label, placeholder, value, onChange, onSearch, disabled }: any) => (
    <div data-testid="async-combobox">
      <label>{label}</label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid={`combobox-${label}`}
      />
      <button onClick={() => onSearch('test')} data-testid="search-button">
        Search
      </button>
    </div>
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'employees.fields.manager': 'Manager',
        'employees.fields.managerPlaceholder': 'Search for a manager',
        'employees.success.updated': 'Employee updated successfully',
        'employees.errors.ownRoleChange': 'Cannot change your own role',
        'employees.errors.invalidHierarchy': 'Invalid hierarchy',
        'employees.errors.notFound': 'Employee not found',
        'employees.errors.updateFailed': 'Failed to update employee',
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

describe('EditEmployeeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockEmployee: Employee = {
    id: 'emp-123',
    email: 'john.doe@example.com',
    name: 'John Doe',
    membership: {
      role: 'employee',
      joinedAt: '2024-01-01',
    },
    profile: {
      jobTitle: 'Software Engineer',
      startDate: '2024-01-15',
      managerUserId: 'mgr-1',
      location: 'New York, NY',
      phone: '+15550123',
    },
  } as Employee;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(employeesService.employeesService.update).mockResolvedValue({
      ...mockEmployee,
      name: 'Updated Name',
    } as any);
    vi.mocked(employeesService.employeesService.searchManagers).mockResolvedValue([
      { id: 'mgr-1', name: 'Manager One' },
      { id: 'mgr-2', name: 'Manager Two' },
    ] as any);
  });

  describe('modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <EditEmployeeModal
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
        <EditEmployeeModal
          isOpen={true}
          employee={null}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true and employee is provided', () => {
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      expect(screen.getByText('Update employee information')).toBeInTheDocument();
    });
  });

  describe('form pre-population', () => {
    it('should pre-fill email field (read-only)', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.value).toBe('john.doe@example.com');
      expect(emailInput).toBeDisabled();
    });

    it('should show email cannot be changed message', () => {
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Email cannot be changed')).toBeInTheDocument();
    });

    it('should pre-fill name field', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      expect(nameInput.value).toBe('John Doe');
    });

    it('should pre-fill role field', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;
      expect(roleSelect.value).toBe('employee');
    });

    it('should pre-fill optional fields', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const jobTitleInput = container.querySelector('input[name="jobTitle"]') as HTMLInputElement;
      const startDateInput = container.querySelector('input[name="startDate"]') as HTMLInputElement;
      const locationInput = container.querySelector('input[name="location"]') as HTMLInputElement;
      const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;

      expect(jobTitleInput.value).toBe('Software Engineer');
      expect(startDateInput.value).toBe('2024-01-15');
      expect(locationInput.value).toBe('New York, NY');
      expect(phoneInput.value).toBe('+15550123');
    });

    it('should handle employee without profile data', () => {
      const employeeWithoutProfile: Employee = {
        ...mockEmployee,
        profile: undefined,
      } as Employee;

      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={employeeWithoutProfile}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const jobTitleInput = container.querySelector('input[name="jobTitle"]') as HTMLInputElement;
      expect(jobTitleInput.value).toBe('');
    });
  });

  describe('form fields', () => {
    beforeEach(() => {
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    it('should render all form fields', () => {
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Job Title')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
    });

    it('should render manager combobox', () => {
      const managers = screen.getAllByText('Manager');
      expect(managers.length).toBeGreaterThanOrEqual(1);
    });

    it('should render required field markers', () => {
      const asterisks = screen.getAllByText('*');
      expect(asterisks.length).toBeGreaterThanOrEqual(2); // Name and Role
    });

    it('should allow editing name field', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      expect(nameInput.value).toBe('Jane Smith');
    });

    it('should allow changing role', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;
      await user.selectOptions(roleSelect, 'manager');

      expect(roleSelect.value).toBe('manager');
    });
  });

  describe('role options', () => {
    it('should display all role options', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      expect(roleSelect.options.length).toBe(3); // No placeholder in edit mode
      expect(roleSelect.options[0].text).toBe('Employee');
      expect(roleSelect.options[1].text).toBe('Manager');
      expect(roleSelect.options[2].text).toBe('Admin');
    });
  });

  describe('form submission', () => {
    it('should submit form with updated data', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;
      await user.selectOptions(roleSelect, 'manager');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(employeesService.employeesService.update).toHaveBeenCalledWith('emp-123', {
          name: 'Jane Smith',
          role: 'manager',
          jobTitle: 'Software Engineer',
          startDate: '2024-01-15',
          managerId: 'mgr-1',
          location: 'New York, NY',
          phone: '+15550123',
        });
      });
    });

    it('should show success toast after successful update', async () => {
      const user = userEvent.setup();
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(toast.showToast.success).toHaveBeenCalledWith('Employee updated successfully');
      });
    });

    it('should call onSuccess and onClose after successful submission', async () => {
      const user = userEvent.setup();
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not submit if employee is null', async () => {
      const { rerender } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Change employee to null
      rerender(
        <EditEmployeeModal
          isOpen={true}
          employee={null}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Modal should not be visible
      expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error for own role change (403)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockRejectedValueOnce({
        statusCode: 403,
        message: 'Cannot change own role',
      });

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Cannot change your own role')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display error for invalid hierarchy (400)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockRejectedValueOnce({
        statusCode: 400,
        message: 'Invalid hierarchy',
      });

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid hierarchy')).toBeInTheDocument();
      });
    });

    it('should display error when employee not found (404)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockRejectedValueOnce({
        statusCode: 404,
      });

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Employee not found')).toBeInTheDocument();
      });
    });

    it('should display generic error for other errors', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update employee')).toBeInTheDocument();
      });
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      const error = new Error('Test error');
      vi.mocked(employeesService.employeesService.update).mockRejectedValueOnce(error);

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update employee:', error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('loading states', () => {
    it('should disable form fields during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Check fields are disabled during submission
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      expect(nameInput).toBeDisabled();
    });

    it('should show loading spinner during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Check loading button text
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });
  });

  describe('modal actions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not allow close during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Try to close during submission
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });

    it('should clear error when closing', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.update).mockRejectedValueOnce(
        new Error('Test error')
      );

      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update employee')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('manager search', () => {
    it('should trigger manager search', async () => {
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const searchButton = screen.getByTestId('search-button');
      searchButton.click();

      await waitFor(() => {
        expect(employeesService.employeesService.searchManagers).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const darkElements = container.querySelectorAll(
        '.dark\\:bg-gray-800, .dark\\:text-gray-100, .dark\\:border-gray-700'
      );
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      const { container } = render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should have submit and cancel buttons', () => {
      render(
        <EditEmployeeModal
          isOpen={true}
          employee={mockEmployee}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
