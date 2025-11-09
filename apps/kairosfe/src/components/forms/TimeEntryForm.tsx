import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { projectsService } from '@/lib/api/services/projects';
import { tasksService } from '@/lib/api/services/tasks';
import AsyncCombobox from '@/components/ui/AsyncCombobox';
import '@/lib/i18n';

const timeEntrySchema = z.object({
  projectId: z.string().uuid('Please select a project'),
  taskId: z.string().uuid().nullable().optional(),
  hours: z
    .number({ invalid_type_error: 'Hours must be a number' })
    .min(0.1, 'Minimum 0.1 hours (6 minutes)')
    .max(24, 'Maximum 24 hours per day'),
  note: z.string().optional(),
});

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TimeEntryFormData>;
  isEditing?: boolean;
  dayOfWeek: number;
  weekStartDate: string;
}

export default function TimeEntryForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  dayOfWeek,
  weekStartDate,
}: TimeEntryFormProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: initialData || {
      projectId: '',
      taskId: null,
      hours: 0,
      note: '',
    },
  });

  const projectId = watch('projectId');

  // Get day name for display
  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  // Calculate actual date for display
  const getDateForDay = (weekStart: string, day: number): string => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + day);
    return date.toLocaleDateString();
  };

  // Search projects
  const searchProjects = async (query: string) => {
    try {
      const results = await projectsService.searchProjects(query);

      // Track search event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_search', {
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

  // Search tasks filtered by selected project
  const searchTasks = async (query: string) => {
    try {
      if (!projectId) return [];
      const results = await tasksService.searchTasks(query, projectId);

      // Track search event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('task_search', {
          userId: user?.id,
          projectId,
          query,
          resultsCount: results.length,
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isEditing ? t('timesheet.editEntry') : t('timesheet.addEntry')}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Day Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {getDayName(dayOfWeek)} - {getDateForDay(weekStartDate, dayOfWeek)}
              </p>
            </div>

            {/* Project Selection */}
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  label={t('timesheet.project')}
                  placeholder={t('timesheet.searchProject')}
                  value={field.value}
                  onChange={field.onChange}
                  onSearch={searchProjects}
                  error={errors.projectId?.message}
                />
              )}
            />

            {/* Task Selection (Optional) */}
            <Controller
              name="taskId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  label={`${t('timesheet.task')} (${t('common.optional')})`}
                  placeholder={t('timesheet.searchTask')}
                  value={field.value || ''}
                  onChange={(value) => field.onChange(value || null)}
                  onSearch={searchTasks}
                  error={errors.taskId?.message}
                  disabled={!projectId}
                />
              )}
            />

            {!projectId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-4">
                {t('timesheet.selectProjectFirst')}
              </p>
            )}

            {/* Hours Input */}
            <div>
              <label
                htmlFor="hours"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('timesheet.hours')}
              </label>
              <input
                type="number"
                id="hours"
                step="0.1"
                min="0.1"
                max="24"
                {...register('hours', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                placeholder="8.0"
              />
              {errors.hours && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.hours.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('timesheet.hoursHelp')}
              </p>
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('timesheet.note')}{' '}
                <span className="text-gray-500 dark:text-gray-400">
                  ({t('common.optional')})
                </span>
              </label>
              <textarea
                id="note"
                {...register('note')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                placeholder={t('timesheet.notePlaceholder')}
              />
              {errors.note && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.note.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? t('common.saving')
                  : isEditing
                    ? t('common.save')
                    : t('timesheet.addEntry')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
