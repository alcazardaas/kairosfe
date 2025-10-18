import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import type { TimeEntry } from '@kairos/shared';
import { searchProjects, searchTasks } from '@/lib/api/services/timesheets';
import AsyncCombobox from '@/components/ui/AsyncCombobox';
import '@/lib/i18n';

const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  taskId: z.string().min(1, 'Task is required'),
  hours: z.number().min(0.25, 'Minimum 0.25 hours').max(24, 'Maximum 24 hours'),
  notes: z.string().optional(),
});

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

interface TimeEntryFormProps {
  entry?: TimeEntry;
  date: string;
  onSubmit: (data: TimeEntryFormData) => void;
  onCancel: () => void;
}

export default function TimeEntryForm({ entry, date, onSubmit, onCancel }: TimeEntryFormProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      projectId: entry?.projectId || '',
      taskId: entry?.taskId || '',
      hours: entry?.hours || 0,
      notes: entry?.notes || '',
    },
  });

  const selectedProjectId = watch('projectId');

  // Reset task when project changes
  useEffect(() => {
    if (selectedProjectId && entry?.projectId !== selectedProjectId) {
      setValue('taskId', '');
    }
  }, [selectedProjectId, entry?.projectId, setValue]);

  const handleProjectSearch = async (query: string) => {
    try {
      const results = await searchProjects(query);

      // Track search event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_search', {
          userId: user?.id,
          query,
          resultsCount: results.length,
        });
      }

      return results.map((p) => ({ id: p.id, name: p.name, code: p.code }));
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  };

  const handleTaskSearch = async (query: string) => {
    if (!selectedProjectId) return [];

    try {
      const results = await searchTasks(query, selectedProjectId);

      // Track search event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('task_search', {
          userId: user?.id,
          projectId: selectedProjectId,
          query,
          resultsCount: results.length,
        });
      }

      return results.map((t) => ({ id: t.id, name: t.name, code: t.code }));
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return [];
    }
  };

  const handleFormSubmit = (data: TimeEntryFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('timesheet.date')}
        </label>
        <input
          type="text"
          value={new Date(date).toLocaleDateString()}
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        />
      </div>

      <AsyncCombobox
        label={`${t('timesheet.project')} *`}
        placeholder={t('timesheet.searchProject')}
        value={selectedProjectId}
        onChange={(value) => setValue('projectId', value, { shouldValidate: true })}
        onSearch={handleProjectSearch}
        error={errors.projectId?.message}
      />

      <AsyncCombobox
        label={`${t('timesheet.task')} *`}
        placeholder={t('timesheet.searchTask')}
        value={watch('taskId')}
        onChange={(value) => setValue('taskId', value, { shouldValidate: true })}
        onSearch={handleTaskSearch}
        error={errors.taskId?.message}
        disabled={!selectedProjectId}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('timesheet.hours')} *
        </label>
        <input
          type="number"
          step="0.25"
          {...register('hours', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
        {errors.hours && (
          <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('timesheet.notes')}
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          placeholder={t('timesheet.notesPlaceholder')}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? t('common.saving') : entry ? t('common.update') : t('common.add')}
        </button>
      </div>
    </form>
  );
}
