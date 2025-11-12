/**
 * Tests for BulkImportModal Component
 * Focused coverage of essential functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkImportModal from './BulkImportModal';
import * as employeesService from '@/lib/api/services/employees';
import * as toast from '@/lib/utils/toast';

// Mock dependencies
vi.mock('@/lib/api/services/employees');
vi.mock('@/lib/utils/toast');

// Mock FileDropzone
vi.mock('@/components/ui/FileDropzone', () => ({
  default: ({ onFileSelect, disabled, accept, maxSizeMB }: any) => (
    <div data-testid="file-dropzone">
      <input
        type="file"
        data-testid="file-input"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
      <span>Max size: {maxSizeMB}MB</span>
    </div>
  ),
}));

// Mock BulkImportResults
vi.mock('@/components/ui/BulkImportResults', () => ({
  default: ({ result }: any) => (
    <div data-testid="bulk-import-results">
      <div>Total Rows: {result.totalRows}</div>
      <div>Created: {result.createdCount || 0}</div>
      <div>Existing: {result.existingCount || 0}</div>
      <div>Errors: {result.errorCount}</div>
      <div>Success: {result.success ? 'Yes' : 'No'}</div>
      {result.dryRun && <div>Dry Run: True</div>}
    </div>
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'employees.bulkImport.title': 'Bulk Import Employees',
        'employees.bulkImport.subtitle': 'Import multiple employees at once',
        'employees.bulkImport.downloadTemplateTitle': 'Download Template',
        'employees.bulkImport.downloadTemplateDescription': 'Download a template file',
        'employees.bulkImport.downloadCSV': 'Download CSV',
        'employees.bulkImport.downloadExcel': 'Download Excel',
        'employees.bulkImport.uploadFileTitle': 'Upload File',
        'employees.bulkImport.uploadAnother': 'Upload Another',
        'employees.bulkImport.validateOnly': 'Validate Only',
        'employees.bulkImport.importUsers': 'Import Users',
        'employees.bulkImport.fixAndRetry': 'Fix and Retry',
        'employees.bulkImport.confirmImport': 'Are you sure you want to import these users?',
        'employees.bulkImport.templateDownloaded': 'Template downloaded',
        'employees.bulkImport.templateDownloadFailed': 'Failed to download template',
        'employees.bulkImport.validationSuccess': `Validation successful (${params?.count} rows)`,
        'employees.bulkImport.validationFailed': `Validation failed (${params?.count} errors)`,
        'employees.bulkImport.validationError': 'Validation error',
        'employees.bulkImport.importSuccess': `Import successful (${params?.created} created, ${params?.existing} existing)`,
        'employees.bulkImport.importFailed': `Import failed (${params?.count} errors)`,
        'employees.bulkImport.importError': 'Import error',
        'employees.bulkImport.fileTooLarge': `File too large (max ${params?.maxSize}MB)`,
        'employees.errors.createFailed': 'Failed to create employee',
        'apiErrors.forbidden': 'Forbidden',
        'common.close': 'Close',
        'common.validating': 'Validating',
        'common.submitting': 'Submitting',
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

describe('BulkImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  // Mock file
  const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Mock URL.createObjectURL and related APIs
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock template download
    vi.mocked(employeesService.employeesService.downloadTemplate).mockResolvedValue(
      new Blob(['template content'], { type: 'text/csv' })
    );
  });

  describe('modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <BulkImportModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Bulk Import Employees')).toBeInTheDocument();
      expect(screen.getByText('Import multiple employees at once')).toBeInTheDocument();
    });
  });

  describe('template download', () => {
    it('should render download template section', () => {
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Download Template')).toBeInTheDocument();
      expect(screen.getByText('Download CSV')).toBeInTheDocument();
      expect(screen.getByText('Download Excel')).toBeInTheDocument();
    });

    it('should download CSV template', async () => {
      const user = userEvent.setup();
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const csvButton = screen.getByText('Download CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(employeesService.employeesService.downloadTemplate).toHaveBeenCalledWith('csv');
        expect(toast.showToast.success).toHaveBeenCalledWith('Template downloaded');
      });
    });

    it('should download Excel template', async () => {
      const user = userEvent.setup();
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const excelButton = screen.getByText('Download Excel');
      await user.click(excelButton);

      await waitFor(() => {
        expect(employeesService.employeesService.downloadTemplate).toHaveBeenCalledWith('xlsx');
        expect(toast.showToast.success).toHaveBeenCalledWith('Template downloaded');
      });
    });

    it('should handle template download error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.downloadTemplate).mockRejectedValueOnce(
        new Error('Download failed')
      );

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const csvButton = screen.getByText('Download CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(toast.showToast.error).toHaveBeenCalledWith('Failed to download template');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to download template:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('file upload', () => {
    it('should render file dropzone', () => {
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByTestId('file-dropzone')).toBeInTheDocument();
      expect(screen.getByText('Max size: 10MB')).toBeInTheDocument();
    });

    it('should accept file selection', async () => {
      const user = userEvent.setup();
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      // Validate button should become enabled
      const validateButton = screen.getByText('Validate Only');
      expect(validateButton).not.toBeDisabled();
    });
  });

  describe('validation', () => {
    it('should validate file successfully', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        totalRows: 10,
        createdCount: 0,
        existingCount: 0,
        errorCount: 0,
        dryRun: true,
        errors: [],
      };

      vi.mocked(employeesService.employeesService.bulkImport).mockResolvedValueOnce(mockResult);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const validateButton = screen.getByText('Validate Only');
      await user.click(validateButton);

      await waitFor(() => {
        expect(employeesService.employeesService.bulkImport).toHaveBeenCalledWith(mockFile, true);
        expect(toast.showToast.success).toHaveBeenCalledWith('Validation successful (10 rows)');
        expect(screen.getByTestId('bulk-import-results')).toBeInTheDocument();
      });
    });

    it('should show validation errors', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: false,
        totalRows: 10,
        createdCount: 0,
        existingCount: 0,
        errorCount: 5,
        dryRun: true,
        errors: [{ row: 1, message: 'Invalid email' }],
      };

      vi.mocked(employeesService.employeesService.bulkImport).mockResolvedValueOnce(mockResult);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const validateButton = screen.getByText('Validate Only');
      await user.click(validateButton);

      await waitFor(() => {
        expect(toast.showToast.warning).toHaveBeenCalledWith('Validation failed (5 errors)');
        expect(screen.getByText('Errors: 5')).toBeInTheDocument();
      });
    });

    it('should handle validation error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      const error = new Error('Validation failed');
      vi.mocked(employeesService.employeesService.bulkImport).mockRejectedValueOnce(error);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const validateButton = screen.getByText('Validate Only');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(toast.showToast.error).toHaveBeenCalledWith('Validation failed');
        expect(consoleSpy).toHaveBeenCalledWith('Validation failed:', error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('import', () => {
    it('should import file successfully', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        totalRows: 10,
        createdCount: 8,
        existingCount: 2,
        errorCount: 0,
        dryRun: false,
        errors: [],
      };

      vi.mocked(employeesService.employeesService.bulkImport).mockResolvedValueOnce(mockResult);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const importButton = screen.getByText('Import Users');
      await user.click(importButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to import these users?');
        expect(employeesService.employeesService.bulkImport).toHaveBeenCalledWith(mockFile, false);
        expect(toast.showToast.success).toHaveBeenCalledWith('Import successful (8 created, 2 existing)');
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show import errors', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: false,
        totalRows: 10,
        createdCount: 5,
        existingCount: 0,
        errorCount: 5,
        dryRun: false,
        errors: [{ row: 1, message: 'Invalid data' }],
      };

      vi.mocked(employeesService.employeesService.bulkImport).mockResolvedValueOnce(mockResult);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const importButton = screen.getByText('Import Users');
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.showToast.error).toHaveBeenCalledWith('Import failed (5 errors)');
        expect(screen.getByText('Errors: 5')).toBeInTheDocument();
      });
    });

    it('should cancel import when confirmation is declined', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const importButton = screen.getByText('Import Users');
      await user.click(importButton);

      expect(employeesService.employeesService.bulkImport).not.toHaveBeenCalled();
    });

    it('should handle file too large error (413)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.bulkImport).mockRejectedValueOnce({
        statusCode: 413,
      });

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const importButton = screen.getByText('Import Users');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('File too large (max 10MB)')).toBeInTheDocument();
      });
    });

    it('should handle forbidden error (403)', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.bulkImport).mockRejectedValueOnce({
        statusCode: 403,
      });

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const importButton = screen.getByText('Import Users');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create employee - Forbidden')).toBeInTheDocument();
      });
    });
  });

  describe('button states', () => {
    it('should disable validate and import buttons when no file is selected', () => {
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const validateButton = screen.getByText('Validate Only');
      const importButton = screen.getByText('Import Users');

      expect(validateButton).toBeDisabled();
      expect(importButton).toBeDisabled();
    });

    it('should show validating state', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.bulkImport).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const validateButton = screen.getByText('Validate Only');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('Validating')).toBeInTheDocument();
      });
    });

    it('should show uploading state', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.bulkImport).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const importButton = screen.getByText('Import Users');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Submitting')).toBeInTheDocument();
      });
    });
  });

  describe('modal actions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const closeButtons = screen.getAllByText('Close');
      await user.click(closeButtons[0]);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not allow close during validation', async () => {
      const user = userEvent.setup();
      vi.mocked(employeesService.employeesService.bulkImport).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const validateButton = screen.getByText('Validate Only');
      await user.click(validateButton);

      const closeButtons = screen.getAllByText('Close');
      expect(closeButtons[0]).toBeDisabled();
    });

    it('should reset file and results when uploading another', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        totalRows: 10,
        createdCount: 10,
        existingCount: 0,
        errorCount: 0,
        dryRun: true,
        errors: [],
      };

      vi.mocked(employeesService.employeesService.bulkImport).mockResolvedValueOnce(mockResult);

      render(<BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      const validateButton = screen.getByText('Validate Only');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-import-results')).toBeInTheDocument();
      });

      const uploadAnotherButton = screen.getByText('Upload Another');
      await user.click(uploadAnotherButton);

      expect(screen.queryByTestId('bulk-import-results')).not.toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const { container } = render(
        <BulkImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const darkElements = container.querySelectorAll(
        '.dark\\:bg-gray-800, .dark\\:text-gray-100, .dark\\:border-gray-700'
      );
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });
});
