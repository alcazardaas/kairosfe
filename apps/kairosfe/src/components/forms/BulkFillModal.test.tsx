/**
 * Tests for BulkFillModal Component
 * Focused coverage of essential functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkFillModal from './BulkFillModal';
import { useAuthStore } from '@/lib/store';
import * as projectsService from '@/lib/api/services/projects';
import * as tasksService from '@/lib/api/services/tasks';

// Mock dependencies
vi.mock('@/lib/store');
vi.mock('@/lib/api/services/projects');
vi.mock('@/lib/api/services/tasks');

// Mock AsyncCombobox
vi.mock('@/components/ui/AsyncCombobox', () => ({
  default: ({ label, value, onChange, onSearch, placeholder, disabled, error }: any) => (
    <div data-testid={`async-combobox-${label}`}>
      <label>{label}</label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid={`combobox-input-${label}`}
      />
      {error && <span data-testid="combobox-error">{error}</span>}
      <button onClick={() => onSearch('test')} data-testid={`search-button-${label}`}>
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
        'timesheet.bulkFill.title': 'Fill Week',
        'timesheet.bulkFill.subtitle': 'Fill multiple days with the same entry',
        'timesheet.bulkFill.selectDays': 'Select Days',
        'timesheet.bulkFill.summary': 'Summary',
        'timesheet.bulkFill.days': 'days',
        'timesheet.bulkFill.apply': 'Apply',
        'timesheet.form.project': 'Project',
        'timesheet.form.projectPlaceholder': 'Search for a project',
        'timesheet.form.task': 'Task',
        'timesheet.form.taskPlaceholder': 'Search for a task',
        'timesheet.form.hours': 'Hours',
        'timesheet.form.note': 'Note',
        'timesheet.form.notePlaceholder': 'Add a note',
        'common.cancel': 'Cancel',
        'common.saving': 'Saving',
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

describe('BulkFillModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'employee' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
    vi.mocked(useAuthStore).mockReturnValue(mockUser as any);
    vi.mocked(projectsService.projectsService.searchProjects).mockResolvedValue([
      { id: 'proj-1', name: 'Project Alpha' },
      { id: 'proj-2', name: 'Project Beta' },
    ] as any);
    vi.mocked(tasksService.tasksService.searchTasks).mockResolvedValue([
      { id: 'task-1', name: 'Task One' },
      { id: 'task-2', name: 'Task Two' },
    ] as any);
  });

  describe('rendering', () => {
    it('should render modal title and subtitle', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(screen.getByText('Fill Week')).toBeInTheDocument();
      expect(screen.getByText('Fill multiple days with the same entry')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(screen.getByText('Project *')).toBeInTheDocument();
      // "Task" appears in both label and AsyncCombobox
      const taskElements = screen.getAllByText('Task');
      expect(taskElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText('Hours *')).toBeInTheDocument();
      expect(screen.getByLabelText('Note')).toBeInTheDocument();
      expect(screen.getByText('Select Days *')).toBeInTheDocument();
    });

    it('should render day selection buttons', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('should render quick select buttons', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(screen.getByText('Weekdays')).toBeInTheDocument();
      expect(screen.getByText('Weekend')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  describe('default values', () => {
    it('should default hours to 8', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const hoursInput = screen.getByLabelText('Hours *') as HTMLInputElement;
      expect(parseFloat(hoursInput.value)).toBe(8);
    });

    it('should default to weekdays selected', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      // Summary should show 5 days (weekdays)
      expect(screen.getByText(/5 days/)).toBeInTheDocument();
    });

    it('should show correct total hours summary', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      // 5 days × 8h = 40h
      expect(screen.getByText(/40\.0.*h total/)).toBeInTheDocument();
    });
  });

  describe('form inputs', () => {
    it('should allow hours input', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const hoursInput = screen.getByLabelText('Hours *') as HTMLInputElement;
      await user.clear(hoursInput);
      await user.type(hoursInput, '6.5');

      expect(hoursInput.value).toBe('6.5');
    });

    it('should allow note input', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const noteInput = screen.getByLabelText('Note') as HTMLTextAreaElement;
      await user.type(noteInput, 'Weekly project work');

      expect(noteInput.value).toBe('Weekly project work');
    });
  });

  describe('day selection', () => {
    it('should toggle individual day selection', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const sundayButton = screen.getByText('Sun').closest('button');

      // Sunday should not be selected by default (only weekdays)
      expect(screen.getByText(/5 days/)).toBeInTheDocument();

      // Click Sunday to select it
      await user.click(sundayButton!);

      // Should now show 6 days
      expect(screen.getByText(/6 days/)).toBeInTheDocument();

      // Click Sunday again to deselect
      await user.click(sundayButton!);

      // Back to 5 days
      expect(screen.getByText(/5 days/)).toBeInTheDocument();
    });

    it('should select weekdays when clicking Weekdays button', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const weekdaysButton = screen.getByText('Weekdays');
      await user.click(weekdaysButton);

      // Should show 5 days (Mon-Fri)
      expect(screen.getByText(/5 days/)).toBeInTheDocument();
      expect(screen.getByText(/40\.0/)).toBeInTheDocument();
      expect(screen.getByText(/h total/)).toBeInTheDocument();
    });

    it('should select weekend when clicking Weekend button', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const weekendButton = screen.getByText('Weekend');
      await user.click(weekendButton);

      // Should show 2 days (Sat-Sun)
      expect(screen.getByText(/2 days/)).toBeInTheDocument();
      expect(screen.getByText(/16\.0/)).toBeInTheDocument();
    });

    it('should select all days when clicking All button', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const allButton = screen.getByText('All');
      await user.click(allButton);

      // Should show 7 days
      expect(screen.getByText(/7 days/)).toBeInTheDocument();
      expect(screen.getByText(/56\.0/)).toBeInTheDocument();
    });
  });

  describe('summary calculation', () => {
    it('should update total when hours change', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      // Default: 5 days × 8h = 40h
      expect(screen.getByText(/40\.0/)).toBeInTheDocument();
      expect(screen.getByText(/h total/)).toBeInTheDocument();

      const hoursInput = screen.getByLabelText('Hours *');
      await user.clear(hoursInput);
      await user.type(hoursInput, '10');

      // Now: 5 days × 10h = 50h
      await waitFor(() => {
        expect(screen.getByText(/50\.0/)).toBeInTheDocument();
      });
    });

    it('should update total when days change', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      // Default: 5 days × 8h = 40h
      expect(screen.getByText(/40\.0/)).toBeInTheDocument();
      expect(screen.getByText(/h total/)).toBeInTheDocument();

      const allButton = screen.getByText('All');
      await user.click(allButton);

      // Now: 7 days × 8h = 56h
      expect(screen.getByText(/56\.0/)).toBeInTheDocument();
    });
  });

  describe('project and task search', () => {
    it('should trigger project search', async () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const searchButton = screen.getByTestId('search-button-Project');
      searchButton.click();

      await waitFor(() => {
        expect(projectsService.projectsService.searchProjects).toHaveBeenCalledWith('test');
      });
    });

    it('should trigger task search', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      // First select a project
      const projectInput = screen.getByTestId('combobox-input-Project');
      await user.type(projectInput, 'proj-123');

      // Then search for tasks
      const searchButton = screen.getByTestId('search-button-Task');
      searchButton.click();

      await waitFor(() => {
        expect(tasksService.tasksService.searchTasks).toHaveBeenCalledWith('test', 'proj-123');
      });
    });

    it('should disable task search when no project selected', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const taskInput = screen.getByTestId('combobox-input-Task');
      expect(taskInput).toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      // Fill in project
      const projectInput = screen.getByTestId('combobox-input-Project');
      await user.type(projectInput, validUuid);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const callArgs = mockOnSubmit.mock.calls[0][0];
        expect(callArgs).toEqual({
          projectId: validUuid,
          taskId: null,
          hours: 8,
          note: '',
          days: [1, 2, 3, 4, 5], // Weekdays
        });
      });
    });

    it('should submit with custom hours and note', async () => {
      const user = userEvent.setup();
      const validUuid = '223e4567-e89b-12d3-a456-426614174111';
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const projectInput = screen.getByTestId('combobox-input-Project');
      await user.type(projectInput, validUuid);

      const hoursInput = screen.getByLabelText('Hours *');
      await user.clear(hoursInput);
      await user.type(hoursInput, '6.5');

      const noteInput = screen.getByLabelText('Note');
      await user.type(noteInput, 'Project work');

      const submitButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const callArgs = mockOnSubmit.mock.calls[0][0];
        expect(callArgs).toEqual({
          projectId: validUuid,
          taskId: null,
          hours: 6.5,
          note: 'Project work',
          days: [1, 2, 3, 4, 5],
        });
      });
    });

    it('should show saving state during submission', async () => {
      const user = userEvent.setup();
      const validUuid = '323e4567-e89b-12d3-a456-426614174222';
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const projectInput = screen.getByTestId('combobox-input-Project');
      await user.type(projectInput, validUuid);

      const submitButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving')).toBeInTheDocument();
      });
    });
  });

  describe('cancel action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should have cancel button available', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const { container } = render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
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
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should have labeled inputs', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(screen.getByLabelText('Hours *')).toBeInTheDocument();
      expect(screen.getByLabelText('Note')).toBeInTheDocument();
    });

    it('should have submit and cancel buttons', () => {
      render(
        <BulkFillModal
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          weekStartDate="2025-01-13"
        />
      );

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
