/**
 * BulkFillModal Component
 * Modal form for filling the entire week with the same project/task/hours
 * Epic 2, Story 4 & 5: Fill Week functionality
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { projectsService } from '@/lib/api/services/projects';
import { tasksService } from '@/lib/api/services/tasks';
import AsyncCombobox from '@/components/ui/AsyncCombobox';
import '@/lib/i18n';

const bulkFillSchema = z.object({
  projectId: z.string().uuid('Please select a project'),
  taskId: z.string().uuid().nullable().optional(),
  hours: z
    .number({ invalid_type_error: 'Hours must be a number' })
    .min(0.1, 'Minimum 0.1 hours (6 minutes)')
    .max(24, 'Maximum 24 hours per day'),
  note: z.string().optional(),
  days: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
});

type BulkFillFormData = z.infer<typeof bulkFillSchema>;

interface BulkFillModalProps {
  onSubmit: (data: BulkFillFormData) => Promise<void>;
  onCancel: () => void;
  weekStartDate: string;
}

const DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri

export default function BulkFillModal({ onSubmit, onCancel, weekStartDate }: BulkFillModalProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BulkFillFormData>({
    resolver: zodResolver(bulkFillSchema),
    defaultValues: {
      projectId: '',
      taskId: null,
      hours: 8,
      note: '',
      days: WEEKDAYS, // Default to weekdays
    },
  });

  const projectId = watch('projectId');
  const selectedDays = watch('days');

  // Search projects
  const searchProjects = async (query: string) => {
    try {
      const results = await projectsService.searchProjects(query);

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('bulk_fill_project_search', {
          userId: user?.id,
          query,
          resultsCount: results.length,
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  };

  // Search tasks
  const searchTasks = async (query: string) => {
    try {
      if (!projectId) return [];
      const results = await tasksService.searchTasks(query, projectId);
      return results;
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return [];
    }
  };

  // Toggle day selection
  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    setValue('days', newDays);
  };

  // Quick select presets
  const selectWeekdays = () => setValue('days', WEEKDAYS);
  const selectWeekend = () => setValue('days', [0, 6]);
  const selectAll = () => setValue('days', [0, 1, 2, 3, 4, 5, 6]);

  const totalHours = selectedDays.length * (watch('hours') || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('timesheet.bulkFill.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('timesheet.bulkFill.subtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('timesheet.form.project')} *
              </label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <AsyncCombobox
                    value={field.value}
                    onChange={field.onChange}
                    loadOptions={searchProjects}
                    placeholder={t('timesheet.form.projectPlaceholder')}
                    error={errors.projectId?.message}
                  />
                )}
              />
            </div>

            {/* Task Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('timesheet.form.task')}
              </label>
              <Controller
                name="taskId"
                control={control}
                render={({ field }) => (
                  <AsyncCombobox
                    value={field.value || ''}
                    onChange={field.onChange}
                    loadOptions={searchTasks}
                    placeholder={t('timesheet.form.taskPlaceholder')}
                    disabled={!projectId}
                    error={errors.taskId?.message}
                  />
                )}
              />
            </div>

            {/* Hours Input */}
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('timesheet.form.hours')} *
              </label>
              <input
                id="hours"
                type="number"
                step="0.1"
                {...register('hours', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.hours && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hours.message}</p>
              )}
            </div>

            {/* Day Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('timesheet.bulkFill.selectDays')} *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectWeekdays}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={selectWeekend}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Weekend
                  </button>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-xs font-medium">{day.short}</div>
                    </button>
                  );
                })}
              </div>
              {errors.days && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.days.message}</p>
              )}
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('timesheet.form.note')}
              </label>
              <textarea
                id="note"
                {...register('note')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={t('timesheet.form.notePlaceholder')}
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('timesheet.bulkFill.summary')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {selectedDays.length} {t('timesheet.bulkFill.days')} × {watch('hours') || 0}h ={' '}
                <span className="font-bold">{totalHours.toFixed(1)}h total</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('common.saving') : t('timesheet.bulkFill.apply')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
