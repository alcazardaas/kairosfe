/**
 * Tests for FileDropzone Component
 * Comprehensive coverage of file upload and drag-and-drop functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropzone from './FileDropzone';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'employees.bulkImport.dragDropFile': 'Drag and drop your file here',
        'employees.bulkImport.acceptedFormats': 'Accepted formats: CSV, XLSX',
        'employees.bulkImport.invalidFileType': 'Invalid file type. Please upload CSV or XLSX.',
        'employees.bulkImport.fileTooLarge': `File size exceeds ${options?.maxSize || 10} MB`,
        'common.delete': 'Delete',
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

describe('FileDropzone', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dropzone', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
    });

    it('should show accepted formats', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      expect(screen.getByText('Accepted formats: CSV, XLSX')).toBeInTheDocument();
    });

    it('should render file input', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('should have upload icon', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const icon = document.querySelector('.material-symbols-outlined');
      expect(icon?.textContent).toContain('upload_file');
    });
  });

  describe('file selection via input', () => {
    it('should call onFileSelect with valid CSV file', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('should call onFileSelect with valid XLSX file', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('should display selected file name', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'employees.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('employees.csv')).toBeInTheDocument();
      });
    });

    it('should display formatted file size', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const content = 'a'.repeat(1500); // 1500 bytes
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/1\.5 KB/)).toBeInTheDocument();
      });
    });
  });

  describe('file validation', () => {
    it('should reject invalid file type', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Invalid file type. Please upload CSV or XLSX.')).toBeInTheDocument();
      });
    });

    it('should call onFileSelect with null for invalid file', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(null);
      });
    });

    it('should reject file exceeding size limit', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} maxSizeMB={1} />);

      const content = 'a'.repeat(2 * 1024 * 1024); // 2 MB
      const file = new File([content], 'large.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 1 MB/)).toBeInTheDocument();
      });
    });

    it('should use default maxSizeMB of 10', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const content = 'a'.repeat(11 * 1024 * 1024); // 11 MB
      const file = new File([content], 'large.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 10 MB/)).toBeInTheDocument();
      });
    });

    it('should accept file within size limit', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} maxSizeMB={5} />);

      const content = 'a'.repeat(3 * 1024 * 1024); // 3 MB
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
        expect(screen.queryByText(/File size exceeds/)).not.toBeInTheDocument();
      });
    });
  });

  describe('drag and drop', () => {
    it('should handle drag over event', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const dropzone = document.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropzone);

      expect(dropzone.classList.contains('border-primary')).toBe(true);
    });

    it('should handle drag leave event', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const dropzone = document.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropzone);
      fireEvent.dragLeave(dropzone);

      expect(dropzone.classList.contains('border-primary')).toBe(false);
    });

    it('should handle file drop', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'dropped.csv', { type: 'text/csv' });
      const dropzone = document.querySelector('.border-dashed')!;

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('should display dropped file', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'dropped.csv', { type: 'text/csv' });
      const dropzone = document.querySelector('.border-dashed')!;

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('dropped.csv')).toBeInTheDocument();
      });
    });

    it('should validate dropped file', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'invalid.txt', { type: 'text/plain' });
      const dropzone = document.querySelector('.border-dashed')!;

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid file type. Please upload CSV or XLSX.')).toBeInTheDocument();
      });
    });

    it('should reset drag state after drop', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const dropzone = document.querySelector('.border-dashed')!;

      fireEvent.dragOver(dropzone);
      expect(dropzone.classList.contains('border-primary')).toBe(true);

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(dropzone.classList.contains('border-primary')).toBe(false);
      });
    });
  });

  describe('file removal', () => {
    it('should show remove button for selected file', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByLabelText('Delete')).toBeInTheDocument();
      });
    });

    it('should remove file when clicking remove button', async () => {
      const user = userEvent.setup();

      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText('Delete');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
      });
    });

    it('should call onFileSelect with null when removing file', async () => {
      const user = userEvent.setup();

      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByLabelText('Delete')).toBeInTheDocument();
      });

      vi.clearAllMocks();

      const removeButton = screen.getByLabelText('Delete');
      await user.click(removeButton);

      expect(mockOnFileSelect).toHaveBeenCalledWith(null);
    });

    it('should clear error when removing file', async () => {
      const user = userEvent.setup();

      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      // First upload invalid file
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText('Invalid file type. Please upload CSV or XLSX.')).toBeInTheDocument();
      });

      // Then upload valid file
      const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(input, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.queryByText('Invalid file type. Please upload CSV or XLSX.')).not.toBeInTheDocument();
      });

      // Remove the file
      const removeButton = screen.getByLabelText('Delete');
      await user.click(removeButton);

      expect(screen.queryByText('Invalid file type. Please upload CSV or XLSX.')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should disable file input when disabled', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} disabled={true} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should not trigger drag state when disabled', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} disabled={true} />);

      const dropzone = document.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropzone);

      expect(dropzone.classList.contains('border-primary')).toBe(false);
    });

    it('should not handle drops when disabled', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} disabled={true} />);

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const dropzone = document.querySelector('.border-dashed')!;

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });

    it('should show opacity styling when disabled', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} disabled={true} />);

      const dropzone = document.querySelector('.border-dashed');
      expect(dropzone?.classList.contains('opacity-50')).toBe(true);
    });

    it('should disable remove button when disabled', async () => {
      const { rerender } = render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByLabelText('Delete')).toBeInTheDocument();
      });

      rerender(<FileDropzone onFileSelect={mockOnFileSelect} disabled={true} />);

      const removeButton = screen.getByLabelText('Delete') as HTMLButtonElement;
      expect(removeButton.disabled).toBe(true);
    });
  });

  describe('file size formatting', () => {
    it('should format bytes correctly', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['a'.repeat(500)], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/500 B/)).toBeInTheDocument();
      });
    });

    it('should format kilobytes correctly', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['a'.repeat(2048)], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
      });
    });

    it('should format megabytes correctly', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const content = 'a'.repeat(3 * 1024 * 1024);
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/3\.0 MB/)).toBeInTheDocument();
      });
    });
  });

  describe('accept prop', () => {
    it('should use custom accept attribute', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} accept=".json" />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('.json');
    });

    it('should use default accept for CSV and XLSX', () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('.csv,.xlsx');
    });
  });

  describe('error display', () => {
    it('should show error icon', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const errorIcon = document.querySelectorAll('.material-symbols-outlined');
        const hasErrorIcon = Array.from(errorIcon).some((icon) => icon.textContent === 'error');
        expect(hasErrorIcon).toBe(true);
      });
    });

    it('should apply error border styling', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const dropzone = document.querySelector('.border-dashed');
        expect(dropzone?.classList.contains('border-red-500')).toBe(true);
      });
    });

    it('should clear error when valid file is selected', async () => {
      render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload invalid file
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText('Invalid file type. Please upload CSV or XLSX.')).toBeInTheDocument();
      });

      // Upload valid file
      const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(input, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.queryByText('Invalid file type. Please upload CSV or XLSX.')).not.toBeInTheDocument();
      });
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes', () => {
      const { container } = render(<FileDropzone onFileSelect={mockOnFileSelect} />);

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-800');
      expect(htmlContent).toContain('dark:border-gray-600');
      expect(htmlContent).toContain('dark:text-gray-300');
    });
  });
});
