import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { timeEntriesService } from '@/lib/api/services/time-entries';
import type { TimeEntryDto } from '@/lib/api/schemas/time-entries';
import TimeEntryForm from '@/components/forms/TimeEntryForm';
import DataState from '@/components/ui/DataState';
import AuthGuard from '@/components/auth/AuthGuard';
import '@/lib/i18n';

interface TimeEntryFormData {
  projectId: string;
  taskId: string | null;
  hours: number;
  note?: string;
}

export default function TimesheetContentNew() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [entries, setEntries] = useState<TimeEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntryDto | null>(null);
  const [weeklyTotal, setWeeklyTotal] = useState<number>(0);

  // Days of week (Monday = 1 ISO standard, but API uses 0=Sunday)
  const daysOfWeek = [
    { name: t('timesheet.monday'), dayOfWeek: 1 },
    { name: t('timesheet.tuesday'), dayOfWeek: 2 },
    { name: t('timesheet.wednesday'), dayOfWeek: 3 },
    { name: t('timesheet.thursday'), dayOfWeek: 4 },
    { name: t('timesheet.friday'), dayOfWeek: 5 },
    { name: t('timesheet.saturday'), dayOfWeek: 6 },
    { name: t('timesheet.sunday'), dayOfWeek: 0 },
  ];

  // Get Monday of current week (ISO week starts on Monday)
  const getMondayOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  };

  // Initialize week start date
  useEffect(() => {
    const monday = getMondayOfWeek(new Date());
    monday.setHours(0, 0, 0, 0);
    setWeekStartDate(monday.toISOString().split('T')[0]);
  }, []);

  // Load entries when week changes
  useEffect(() => {
    if (weekStartDate && user?.id) {
      loadEntries();
    }
  }, [weekStartDate, user?.id]);

  const loadEntries = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await timeEntriesService.getAll({
        userId: user.id,
        weekStartDate,
      });

      setEntries(response.data || []);

      // Calculate weekly total
      const total = (response.data || []).reduce((sum, entry) => sum + entry.hours, 0);
      setWeeklyTotal(total);
    } catch (err) {
      console.error('Failed to load time entries:', err);
      setError(t('timesheet.errorLoadingEntries'));
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous/next week
  const changeWeek = (direction: 'prev' | 'next') => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
    setWeekStartDate(currentDate.toISOString().split('T')[0]);
  };

  // Get date for a specific day of week
  const getDateForDay = (dayOfWeek: number): string => {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayOfWeek);
    return date.toISOString().split('T')[0];
  };

  // Get entries for a specific day
  const getEntriesForDay = (dayOfWeek: number): TimeEntryDto[] => {
    return entries.filter((entry) => entry.day_of_week === dayOfWeek);
  };

  // Get total hours for a specific day
  const getDayTotal = (dayOfWeek: number): number => {
    return getEntriesForDay(dayOfWeek).reduce((sum, entry) => sum + entry.hours, 0);
  };

  // Handle add entry
  const handleAddEntry = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
    setEditingEntry(null);
    setShowForm(true);
  };

  // Handle edit entry
  const handleEditEntry = (entry: TimeEntryDto) => {
    setSelectedDay(entry.day_of_week);
    setEditingEntry(entry);
    setShowForm(true);
  };

  // Handle form submit (create or update)
  const handleFormSubmit = async (data: TimeEntryFormData) => {
    if (!user?.id || selectedDay === null) return;

    try {
      if (editingEntry) {
        // Update existing entry
        await timeEntriesService.update(editingEntry.id, {
          hours: data.hours,
          note: data.note,
        });

        toast.success(t('timesheet.entryUpdated'));
      } else {
        // Create new entry
        await timeEntriesService.create({
          tenantId: user.tenant_id,
          userId: user.id,
          projectId: data.projectId,
          taskId: data.taskId,
          weekStartDate,
          dayOfWeek: selectedDay,
          hours: data.hours,
          note: data.note,
        });

        toast.success(t('timesheet.entryCreated'));
      }

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(editingEntry ? 'timesheet_entry_updated' : 'timesheet_entry_created', {
          userId: user.id,
          projectId: data.projectId,
          hours: data.hours,
          dayOfWeek: selectedDay,
        });
      }

      setShowForm(false);
      setSelectedDay(null);
      setEditingEntry(null);
      await loadEntries();
    } catch (err: any) {
      console.error('Failed to save time entry:', err);

      // Handle 409 conflict (duplicate entry)
      if (err.status === 409 || err.message?.includes('already exists')) {
        toast.error(t('timesheet.duplicateEntry'));
      } else {
        toast.error(t('timesheet.errorSavingEntry'));
      }

      throw err;
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm(t('timesheet.confirmDelete'))) return;

    try {
      await timeEntriesService.delete(entryId);
      toast.success(t('timesheet.entryDeleted'));
      await loadEntries();
    } catch (err) {
      console.error('Failed to delete time entry:', err);
      toast.error(t('timesheet.errorDeletingEntry'));
    }
  };

  // Format date range for display
  const getWeekRange = (): string => {
    const start = new Date(weekStartDate);
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <AuthGuard>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('timesheet.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('timesheet.description')}
            </p>
          </div>

          {/* Week Navigator */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeWeek('prev')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
                {t('timesheet.previousWeek')}
              </button>

              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {getWeekRange()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('timesheet.weekTotal')}: <span className="font-semibold">{weeklyTotal.toFixed(1)}h</span>
                </p>
              </div>

              <button
                onClick={() => changeWeek('next')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {t('timesheet.nextWeek')}
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Timesheet Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <DataState
              loading={loading}
              error={error}
              empty={entries.length === 0}
              emptyMessage={t('timesheet.noEntries')}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('timesheet.day')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('timesheet.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('timesheet.project')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('timesheet.hours')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {daysOfWeek.map((day) => {
                      const dayEntries = getEntriesForDay(day.dayOfWeek);
                      const dayTotal = getDayTotal(day.dayOfWeek);
                      const dayDate = getDateForDay(day.dayOfWeek);

                      if (dayEntries.length === 0) {
                        // Empty day row
                        return (
                          <tr key={day.dayOfWeek} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {day.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(dayDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500" colSpan={2}>
                              {t('timesheet.noEntriesForDay')}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <button
                                onClick={() => handleAddEntry(day.dayOfWeek)}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <span className="material-symbols-outlined text-sm">add</span>
                                {t('timesheet.addEntry')}
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      // Day with entries
                      return dayEntries.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {idx === 0 && (
                            <>
                              <td
                                className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100"
                                rowSpan={dayEntries.length}
                              >
                                {day.name}
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {dayTotal.toFixed(1)}h
                                </div>
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
                                rowSpan={dayEntries.length}
                              >
                                {new Date(dayDate).toLocaleDateString()}
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {entry.project_id}
                            </div>
                            {entry.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {entry.note}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {entry.hours.toFixed(1)}h
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-600 dark:text-red-400 hover:underline"
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </DataState>
          </div>

          {/* Form Modal */}
          {showForm && selectedDay !== null && (
            <TimeEntryForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setSelectedDay(null);
                setEditingEntry(null);
              }}
              dayOfWeek={selectedDay}
              weekStartDate={weekStartDate}
              isEditing={!!editingEntry}
              initialData={editingEntry ? {
                projectId: editingEntry.project_id,
                taskId: editingEntry.task_id,
                hours: editingEntry.hours,
                note: editingEntry.note || '',
              } : undefined}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
