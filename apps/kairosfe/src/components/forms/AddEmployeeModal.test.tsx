/**
 * Tests for AddEmployeeModal Component
 * Focused coverage of essential functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddEmployeeModal from './AddEmployeeModal';
import * as employeesService from '@/lib/api/services/employees';
import * as toast from '@/lib/utils/toast';

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
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'employees.fields.manager': 'Manager',
        'employees.fields.managerPlaceholder': 'Search for a manager',
        'employees.success.createdInvite': `Employee created and invitation sent to ${params?.email}`,
        'employees.success.created': 'Employee created successfully',
        'employees.errors.emailExists': 'Email already exists',
        'employees.errors.createFailed': 'Failed to create employee',
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

describe('AddEmployeeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(employeesService.employeesService.create).mockResolvedValue({
      id: 'emp-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'employee',
    } as any);
    vi.mocked(employeesService.employeesService.searchManagers).mockResolvedValue([
      { id: 'mgr-1', name: 'Manager One' },
      { id: 'mgr-2', name: 'Manager Two' },
    ] as any);
  });

  describe('modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <AddEmployeeModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      expect(screen.getByText('Invite a new team member to your organization')).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    beforeEach(() => {
      render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    });

    it('should render all required fields', () => {
      expect(screen.getByPlaceholderText('employee@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Select role')).toBeInTheDocument();

      // Check for required asterisks
      const asterisks = screen.getAllByText('*');
      expect(asterisks.length).toBeGreaterThanOrEqual(3);
    });

    it('should render all optional fields', () => {
      expect(screen.getByText('Job Title')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
    });

    it('should render manager combobox', () => {
      // "Manager" appears in both role select and combobox label
      const managers = screen.getAllByText('Manager');
      expect(managers.length).toBeGreaterThanOrEqual(1);
    });

    it('should render send invite checkbox checked by default', () => {
      const checkbox = screen.getByLabelText('Send invitation email') as HTMLInputElement;
      expect(checkbox).toBeChecked();
    });

    it('should accept text input in email field', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByPlaceholderText('employee@example.com') as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should accept text input in name field', async () => {
      const user = userEvent.setup();
      const nameInput = screen.getByPlaceholderText('John Doe') as HTMLInputElement;

      await user.type(nameInput, 'John Doe');

      expect(nameInput.value).toBe('John Doe');
    });

    it('should allow role selection', async () => {
      const user = userEvent.setup();
      const roleSelect = screen.getByRole('combobox', { name: '' }) as HTMLSelectElement;

      await user.selectOptions(roleSelect, 'manager');

      expect(roleSelect.value).toBe('manager');
    });

    it('should toggle send invite checkbox', async () => {
      const user = userEvent.setup();
      const checkbox = screen.getByLabelText('Send invitation email') as HTMLInputElement;

      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('role options', () => {
    it('should display all role options', () => {
      const { container } = render(
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      expect(roleSelect.options.length).toBe(4); // placeholder + 3 roles
      expect(roleSelect.options[0].text).toBe('Select role');
      expect(roleSelect.options[1].text).toBe('Employee');
      expect(roleSelect.options[2].text).toBe('Manager');
      expect(roleSelect.options[3].text).toBe('Admin');
    });
  });

  describe('form validation', () => {
    it('should have email input with email type', () => {
      const { container } = render(
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.type).toBe('email');
    });

    it('should have name input', () => {
      const { container } = render(
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      expect(nameInput).toBeInTheDocument();
      expect(nameInput.type).toBe('text');
    });

    it('should have role select with placeholder', () => {
      const { container } = render(
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;
      expect(roleSelect).toBeInTheDocument();
      expect(roleSelect.options[0].value).toBe('');
    });

    it('should have phone input with tel type', () => {
      const { container } = render(
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
      expect(phoneInput).toBeInTheDocument();
      expect(phoneInput.type).toBe('tel');
    });
  });

  describe('form submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'new@example.com');
      await user.type(nameInput, 'New Employee');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(employeesService.employeesService.create).toHaveBeenCalledWith({
          email: 'new@example.com',
          name: 'New Employee',
          role: 'employee',
          jobTitle: undefined,
          startDate: undefined,
          managerId: undefined,
          location: undefined,
          phone: undefined,
          sendInvite: true,
        });
      });
    });

    it('should show success toast when sendInvite is true', async () => {
      const user = userEvent.setup();
      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'new@example.com');
      await user.type(nameInput, 'New Employee');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(toast.showToast.success).toHaveBeenCalledWith(
          'Employee created and invitation sent to new@example.com'
        );
      });
    });

    it('should show success toast when sendInvite is false', async () => {
      const user = userEvent.setup();
      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'new@example.com');
      await user.type(nameInput, 'New Employee');
      await user.selectOptions(roleSelect, 'employee');

      const sendInviteCheckbox = screen.getByLabelText('Send invitation email');
      await user.click(sendInviteCheckbox);

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(toast.showToast.success).toHaveBeenCalledWith('Employee created successfully');
      });
    });

    it('should call onSuccess and onClose after successful submission', async () => {
      const user = userEvent.setup();
      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'new@example.com');
      await user.type(nameInput, 'New Employee');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should submit with optional fields', async () => {
      const user = userEvent.setup();
      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;
      const jobTitleInput = container.querySelector('input[name="jobTitle"]') as HTMLInputElement;
      const startDateInput = container.querySelector('input[name="startDate"]') as HTMLInputElement;
      const locationInput = container.querySelector('input[name="location"]') as HTMLInputElement;
      const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;

      await user.type(emailInput, 'new@example.com');
      await user.type(nameInput, 'New Employee');
      await user.selectOptions(roleSelect, 'manager');
      await user.type(jobTitleInput, 'Senior Engineer');
      await user.type(startDateInput, '2025-01-20');
      await user.type(locationInput, 'New York, NY');
      await user.type(phoneInput, '+15550123');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(employeesService.employeesService.create).toHaveBeenCalledWith({
          email: 'new@example.com',
          name: 'New Employee',
          role: 'manager',
          jobTitle: 'Senior Engineer',
          startDate: '2025-01-20',
          managerId: undefined,
          location: 'New York, NY',
          phone: '+15550123',
          sendInvite: true,
        });
      });
    });
  });

  describe('error handling', () => {
    it('should display error when email already exists (409)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.create).mockRejectedValueOnce({
        statusCode: 409,
        message: 'Email already exists',
      });

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'existing@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display error when permission denied (403)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.create).mockRejectedValueOnce({
        statusCode: 403,
        message: 'Permission denied',
      });

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create employee - Permission denied')).toBeInTheDocument();
      });
    });

    it('should display generic error for other errors', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.create).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create employee')).toBeInTheDocument();
      });
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      const error = new Error('Test error');
      vi.mocked(employeesService.employeesService.create).mockRejectedValueOnce(error);

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create employee:', error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('loading states', () => {
    it('should disable form fields during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.create).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      // Check fields are disabled during submission
      expect(emailInput).toBeDisabled();
    });

    it('should show loading spinner during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.create).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      // Check loading button text
      await waitFor(() => {
        expect(screen.getByText('Adding...')).toBeInTheDocument();
      });
    });
  });

  describe('modal actions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not allow close during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.create).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { container } = render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test User');
      await user.selectOptions(roleSelect, 'employee');

      await user.click(screen.getByRole('button', { name: 'Add Employee' }));

      // Try to close during submission
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('manager search', () => {
    it('should trigger manager search', async () => {
      render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

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
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
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
        <AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should have submit and cancel buttons', () => {
      render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
