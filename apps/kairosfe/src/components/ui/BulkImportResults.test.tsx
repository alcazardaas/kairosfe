/**
 * Tests for BulkImportResults Component
 * Comprehensive coverage of bulk import results display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkImportResults from './BulkImportResults';
import type { ImportResult } from '@/lib/api/services/employees';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'employees.bulkImport.validationSuccessTitle': 'Validation Successful',
        'employees.bulkImport.importSuccessTitle': 'Import Successful',
        'employees.bulkImport.totalRows': 'Total Rows',
        'employees.bulkImport.createdCount': 'Created',
        'employees.bulkImport.existingCount': 'Existing',
        'employees.bulkImport.validRows': 'Valid Rows',
        'employees.bulkImport.viewCreatedUsers': `View ${options?.count || 0} created users`,
        'employees.bulkImport.validationErrorsTitle': 'Validation Errors',
        'employees.bulkImport.validationErrorsMessage': `${options?.count || 0} errors in ${options?.total || 0} rows`,
        'employees.bulkImport.errorCount': 'Errors',
        'employees.bulkImport.viewErrors': `View ${options?.count || 0} errors`,
        'employees.bulkImport.row': 'Row',
        'employees.bulkImport.email': 'Email',
        'employees.bulkImport.errors': 'Errors',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock i18n module
vi.mock('@/lib/i18n', () => ({}));

describe('BulkImportResults', () => {
  const successResult: ImportResult = {
    success: true,
    message: '10 employees imported successfully',
    totalRows: 10,
    validRows: 10,
    errorCount: 0,
    createdCount: 8,
    existingCount: 2,
    dryRun: false,
    errors: [],
    createdUsers: [
      { name: 'John Doe', email: 'john@example.com', status: 'active' },
      { name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
    ],
  };

  const dryRunResult: ImportResult = {
    success: true,
    message: 'Validation passed for all 5 rows',
    totalRows: 5,
    validRows: 5,
    errorCount: 0,
    dryRun: true,
    errors: [],
  };

  const errorResult: ImportResult = {
    success: false,
    message: 'Validation failed',
    totalRows: 10,
    validRows: 7,
    errorCount: 3,
    dryRun: true,
    errors: [
      { row: 2, email: 'invalid@', errors: ['Invalid email format'] },
      { row: 5, email: 'missing@domain', errors: ['Email domain is required', 'Name is too short'] },
      { row: 8, email: 'duplicate@test.com', errors: ['Email already exists'] },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should return null when result is not provided', () => {
      const { container } = render(<BulkImportResults result={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render success result', () => {
      render(<BulkImportResults result={successResult} />);
      expect(screen.getByText('Import Successful')).toBeInTheDocument();
    });

    it('should render error result', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('should show success icon', () => {
      render(<BulkImportResults result={successResult} />);
      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasCheckIcon = Array.from(icons).some((icon) => icon.textContent === 'check_circle');
      expect(hasCheckIcon).toBe(true);
    });

    it('should display success message', () => {
      render(<BulkImportResults result={successResult} />);
      expect(screen.getByText('10 employees imported successfully')).toBeInTheDocument();
    });

    it('should show statistics for successful import', () => {
      render(<BulkImportResults result={successResult} />);
      expect(screen.getByText('Total Rows')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Existing')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Valid Rows')).toBeInTheDocument();

      // Check that numbers are displayed
      const numbers = screen.getAllByText('10');
      expect(numbers.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show statistics for dry run', () => {
      render(<BulkImportResults result={dryRunResult} />);
      expect(screen.queryByText('Total Rows')).not.toBeInTheDocument();
    });

    it('should show validation success title for dry run', () => {
      render(<BulkImportResults result={dryRunResult} />);
      expect(screen.getByText('Validation Successful')).toBeInTheDocument();
    });

    it('should show import success title for actual import', () => {
      render(<BulkImportResults result={successResult} />);
      expect(screen.getByText('Import Successful')).toBeInTheDocument();
    });
  });

  describe('created users list', () => {
    it('should show created users toggle button', () => {
      render(<BulkImportResults result={successResult} />);
      expect(screen.getByText('View 2 created users')).toBeInTheDocument();
    });

    it('should not show created users section for dry run', () => {
      render(<BulkImportResults result={dryRunResult} />);
      expect(screen.queryByText(/created users/i)).not.toBeInTheDocument();
    });

    it('should toggle created users list', async () => {
      const user = userEvent.setup();
      render(<BulkImportResults result={successResult} />);

      // Initially hidden
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

      // Click to expand
      const toggleButton = screen.getByText('View 2 created users');
      await user.click(toggleButton);

      // Now visible
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should show user initials', async () => {
      const user = userEvent.setup();
      render(<BulkImportResults result={successResult} />);

      const toggleButton = screen.getByText('View 2 created users');
      await user.click(toggleButton);

      const initials = document.querySelectorAll('.bg-primary\\/10');
      expect(initials.length).toBeGreaterThan(0);
    });

    it('should show user status badges', async () => {
      const user = userEvent.setup();
      render(<BulkImportResults result={successResult} />);

      const toggleButton = screen.getByText('View 2 created users');
      await user.click(toggleButton);

      const statusBadges = screen.getAllByText('active');
      expect(statusBadges).toHaveLength(2);
    });

    it('should handle user without name', async () => {
      const resultWithEmailOnly: ImportResult = {
        ...successResult,
        createdUsers: [{ email: 'test@example.com', status: 'active' }],
      };

      const user = userEvent.setup();
      render(<BulkImportResults result={resultWithEmailOnly} />);

      const toggleButton = screen.getByText('View 1 created users');
      await user.click(toggleButton);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error icon', () => {
      render(<BulkImportResults result={errorResult} />);
      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasErrorIcon = Array.from(icons).some((icon) => icon.textContent === 'error');
      expect(hasErrorIcon).toBe(true);
    });

    it('should display error count in message', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('3 errors in 10 rows')).toBeInTheDocument();
    });

    it('should show error statistics', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('Total Rows')).toBeInTheDocument();
      expect(screen.getByText('Valid Rows')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // "Errors" appears twice (stat label and table header)
      const errorsLabels = screen.getAllByText('Errors');
      expect(errorsLabels.length).toBeGreaterThanOrEqual(1);

      // "10" appears in statistics
      const totalRows = screen.getAllByText('10');
      expect(totalRows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('error details table', () => {
    it('should show errors toggle button', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('View 3 errors')).toBeInTheDocument();
    });

    it('should show errors by default', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('Row')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should toggle error details table', async () => {
      const user = userEvent.setup();
      render(<BulkImportResults result={errorResult} />);

      // Initially visible
      expect(screen.getByText('invalid@')).toBeInTheDocument();

      // Click to collapse
      const toggleButton = screen.getByText('View 3 errors');
      await user.click(toggleButton);

      // Now hidden
      expect(screen.queryByText('invalid@')).not.toBeInTheDocument();

      // Click to expand again
      await user.click(toggleButton);

      // Visible again
      expect(screen.getByText('invalid@')).toBeInTheDocument();
    });

    it('should display all error rows', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display error emails', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('invalid@')).toBeInTheDocument();
      expect(screen.getByText('missing@domain')).toBeInTheDocument();
      expect(screen.getByText('duplicate@test.com')).toBeInTheDocument();
    });

    it('should display all error messages', () => {
      render(<BulkImportResults result={errorResult} />);
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Email domain is required')).toBeInTheDocument();
      expect(screen.getByText('Name is too short')).toBeInTheDocument();
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    it('should display multiple errors per row', () => {
      render(<BulkImportResults result={errorResult} />);
      const row5Errors = screen.getAllByText(/Email domain is required|Name is too short/);
      expect(row5Errors).toHaveLength(2);
    });
  });

  describe('expand/collapse icons', () => {
    it('should show expand_more icon when created users are collapsed', () => {
      render(<BulkImportResults result={successResult} />);
      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasExpandMore = Array.from(icons).some((icon) => icon.textContent === 'expand_more');
      expect(hasExpandMore).toBe(true);
    });

    it('should show expand_less icon when created users are expanded', async () => {
      const user = userEvent.setup();
      render(<BulkImportResults result={successResult} />);

      const toggleButton = screen.getByText('View 2 created users');
      await user.click(toggleButton);

      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasExpandLess = Array.from(icons).some((icon) => icon.textContent === 'expand_less');
      expect(hasExpandLess).toBe(true);
    });

    it('should show expand_less icon for errors by default', () => {
      render(<BulkImportResults result={errorResult} />);
      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasExpandLess = Array.from(icons).some((icon) => icon.textContent === 'expand_less');
      expect(hasExpandLess).toBe(true);
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes in success state', () => {
      const { container } = render(<BulkImportResults result={successResult} />);
      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-green-900');
      expect(htmlContent).toContain('dark:text-green-100');
      expect(htmlContent).toContain('dark:bg-gray-800');
    });

    it('should have dark mode classes in error state', () => {
      const { container } = render(<BulkImportResults result={errorResult} />);
      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-red-900');
      expect(htmlContent).toContain('dark:text-red-100');
      expect(htmlContent).toContain('dark:bg-gray-800');
    });
  });

  describe('edge cases', () => {
    it('should handle zero created users', () => {
      const noCreatedResult: ImportResult = {
        ...successResult,
        createdCount: 0,
        createdUsers: [],
      };

      render(<BulkImportResults result={noCreatedResult} />);
      expect(screen.queryByText(/created users/i)).not.toBeInTheDocument();
    });

    it('should handle zero existing users', () => {
      const noExistingResult: ImportResult = {
        ...successResult,
        existingCount: 0,
      };

      render(<BulkImportResults result={noExistingResult} />);
      expect(screen.getByText('Existing')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty errors array', () => {
      const noErrorsResult: ImportResult = {
        ...errorResult,
        errors: [],
      };

      render(<BulkImportResults result={noErrorsResult} />);
      expect(screen.queryByText('View')).not.toBeInTheDocument();
    });
  });
});
