/**
 * TimesheetWeekTab Component
 * Enhanced week view with totals, validation, bulk operations, and submission workflow
 * Epic 1, 2, 3: Complete weekly timesheet management
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore, useTimesheetStore } from '@/lib/store';
import { timeEntriesService } from '@/lib/api/services/time-entries';
import { timesheetsService } from '@/lib/api/services/timesheets';
import type { TimeEntryDto, BulkOperationRequest } from '@/lib/api/schemas';
import TimeEntryForm from '@/components/forms/TimeEntryForm';
import BulkFillModal from '@/components/forms/BulkFillModal';
import TimesheetStatusBadge from './TimesheetStatusBadge';
import WeekTotalsFooter from './WeekTotalsFooter';
import ProjectBreakdownPanel from './ProjectBreakdownPanel';
import DataState from '@/components/ui/DataState';
import '@/lib/i18n';

interface TimeEntryFormData {
  projectId: string;
  taskId: string | null;
  hours: number;
  note?: string;
}

interface BulkFillFormData {
  projectId: string;
  taskId: string | null;
  hours: number;
  note?: string;
  days: number[];
}

export default function TimesheetWeekTab() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  // Zustand store
  const {
    currentTimesheet,
    timeEntries,
    dailyTotals,
    weeklyTotal,
    projectBreakdown,
    validationResult,
    selectedWeekStart,
    isLoading,
    setCurrentTimesheet,
    setTimeEntries,
    setDailyTotals,
    setWeeklyTotal,
    setProjectBreakdown,
    setValidationResult,
    setSelectedWeekStart,
    setIsLoading,
  } = useTimesheetStore();

  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkFill, setShowBulkFill] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntryDto | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    { name: t('timesheet.monday'), dayOfWeek: 1 },
    { name: t('timesheet.tuesday'), dayOfWeek: 2 },
    { name: t('timesheet.wednesday'), dayOfWeek: 3 },
    { name: t('timesheet.thursday'), dayOfWeek: 4 },
    { name: t('timesheet.friday'), dayOfWeek: 5 },
    { name: t('timesheet.saturday'), dayOfWeek: 6 },
    { name: t('timesheet.sunday'), dayOfWeek: 0 },
  ];

  const getMondayOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  useEffect(() => {
    const monday = getMondayOfWeek(new Date());
    monday.setHours(0, 0, 0, 0);
    setWeekStartDate(monday.toISOString().split('T')[0]);
    setSelectedWeekStart(monday);
  }, []);

  useEffect(() => {
    if (weekStartDate && user?.id) {
      loadWeekView();
    }
  }, [weekStartDate, user?.id]);

  const loadWeekView = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use the new optimized endpoint
      const weekView = await timeEntriesService.getWeekView(user.id, weekStartDate);

      // Update store with all data (now properly typed after transformation)
      setCurrentTimesheet(weekView.timesheet);
      setTimeEntries(weekView.entries);
      setDailyTotals(weekView.dailyTotals);
      setWeeklyTotal(weekView.weeklyTotal);
      setProjectBreakdown(weekView.projectBreakdown);
    } catch (err) {
      console.error('Failed to load week view:', err);
      setError(t('timesheet.errorLoadingEntries'));
    } finally {
      setIsLoading(false);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
    setWeekStartDate(currentDate.toISOString().split('T')[0]);
  };

  const getDateForDay = (dayOfWeek: number): string => {
    if (!weekStartDate) return new Date().toISOString().split('T')[0];

    const date = new Date(weekStartDate);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];

    // Calculate offset: Monday=1→0 days, Tuesday=2→1 day, ..., Sunday=0→6 days
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  const getEntriesForDay = (dayOfWeek: number): TimeEntryDto[] => {
    return timeEntries.filter((entry) => entry.dayOfWeek === dayOfWeek);
  };

  const getDayTotal = (dayOfWeek: number): number => {
    return getEntriesForDay(dayOfWeek).reduce((sum, entry) => sum + entry.hours, 0);
  };

  const handleAddEntry = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleEditEntry = (entry: TimeEntryDto) => {
    setSelectedDay(entry.dayOfWeek);
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: TimeEntryFormData) => {
    if (!user?.id || selectedDay === null) return;

    try {
      if (editingEntry) {
        await timeEntriesService.update(editingEntry.id, {
          hours: data.hours,
          note: data.note,
        });
        toast.success(t('timesheet.entryUpdated'));
      } else {
        await timeEntriesService.create({
          // tenantId removed - backend derives from JWT
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
      await loadWeekView();
    } catch (err: any) {
      console.error('Failed to save time entry:', err);
      if (err.status === 409 || err.message?.includes('already exists')) {
        toast.error(t('timesheet.duplicateEntry'));
      } else {
        toast.error(t('timesheet.errorSavingEntry'));
      }
      throw err;
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm(t('timesheet.confirmDelete'))) return;

    try {
      await timeEntriesService.delete(entryId);
      toast.success(t('timesheet.entryDeleted'));
      await loadWeekView();
    } catch (err) {
      console.error('Failed to delete time entry:', err);
      toast.error(t('timesheet.errorDeletingEntry'));
    }
  };

  // Epic 2, Story 4 & 5: Bulk Fill
  const handleBulkFillSubmit = async (data: BulkFillFormData) => {
    if (!user?.id) return;

    try {
      const request: BulkOperationRequest = {
        userId: user.id,
        weekStartDate,
        entries: data.days.map((day) => ({
          projectId: data.projectId,
          taskId: data.taskId,
          dayOfWeek: day,
          hours: data.hours,
          note: data.note,
        })),
      };

      const result = await timeEntriesService.bulkSave(request);
      toast.success(t('timesheet.bulkFill.success', { count: result.created + result.updated }));

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('timesheet_bulk_fill', {
          userId: user.id,
          daysCount: data.days.length,
          totalHours: data.days.length * data.hours,
        });
      }

      setShowBulkFill(false);
      await loadWeekView();
    } catch (err) {
      console.error('Failed to bulk fill:', err);
      toast.error(t('timesheet.bulkFill.error'));
      throw err;
    }
  };

  // Epic 2, Story 6: Copy Previous Week
  const handleCopyPreviousWeek = async () => {
    if (!user?.id || !confirm(t('timesheet.copyWeek.confirm'))) return;

    try {
      const prevWeekDate = new Date(weekStartDate);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      const prevWeekStart = prevWeekDate.toISOString().split('T')[0];

      const result = await timeEntriesService.copyWeek(prevWeekStart, weekStartDate);
      toast.success(t('timesheet.copyWeek.success', { count: result.created }));

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('timesheet_copy_week', {
          userId: user.id,
          entriesCopied: result.created,
        });
      }

      await loadWeekView();
    } catch (err) {
      console.error('Failed to copy week:', err);
      toast.error(t('timesheet.copyWeek.error'));
    }
  };

  // Epic 3, Story 3: Validate
  const handleValidate = async () => {
    if (!currentTimesheet?.id) return;

    try {
      setIsValidating(true);
      const result = await timesheetsService.validate(currentTimesheet.id);
      setValidationResult(result);

      if (result.valid) {
        toast.success(t('timesheet.validation.success'));
      } else {
        const errorCount = result.errors.filter((e) => e.severity === 'error').length;
        const warningCount = result.errors.filter((e) => e.severity === 'warning').length;
        toast.error(t('timesheet.validation.failed', { errors: errorCount, warnings: warningCount }));
      }
    } catch (err) {
      console.error('Failed to validate:', err);
      toast.error(t('timesheet.validation.error'));
    } finally {
      setIsValidating(false);
    }
  };

  // Epic 3, Story 1: Submit
  const handleSubmit = async () => {
    if (!currentTimesheet?.id || !confirm(t('timesheet.submit.confirm'))) return;

    try {
      setIsSubmitting(true);

      // Validate first
      const validation = await timesheetsService.validate(currentTimesheet.id);
      if (!validation.canSubmit) {
        toast.error(t('timesheet.submit.cannotSubmit'));
        setValidationResult(validation);
        return;
      }

      await timesheetsService.submit(currentTimesheet.id);
      toast.success(t('timesheet.submit.success'));

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('timesheet_submitted', {
          userId: user?.id,
          weeklyTotal,
        });
      }

      await loadWeekView();
    } catch (err) {
      console.error('Failed to submit:', err);
      toast.error(t('timesheet.submit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Epic 3, Story 5: Recall
  const handleRecall = async () => {
    if (!currentTimesheet?.id || !confirm(t('timesheet.recall.confirm'))) return;

    try {
      await timesheetsService.recall(currentTimesheet.id);
      toast.success(t('timesheet.recall.success'));
      await loadWeekView();
    } catch (err) {
      console.error('Failed to recall:', err);
      toast.error(t('timesheet.recall.error'));
    }
  };

  const getWeekRange = (): string => {
    const start = new Date(weekStartDate);
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const isDraft = currentTimesheet?.status === 'draft';
  const isPending = currentTimesheet?.status === 'pending';
  const isEditable = isDraft || !currentTimesheet;

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getWeekRange()}
          </h2>
          {currentTimesheet && (
            <div className="mt-2">
              <TimesheetStatusBadge status={currentTimesheet.status} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isDraft && (
            <>
              <button
                onClick={() => setShowBulkFill(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('timesheet.bulkFill.button')}
              </button>
              <button
                onClick={handleCopyPreviousWeek}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('timesheet.copyWeek.button')}
              </button>
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
              >
                {isValidating ? t('common.validating') : t('timesheet.validate.button')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('common.submitting') : t('timesheet.submit.button')}
              </button>
            </>
          )}
          {isPending && (
            <button
              onClick={handleRecall}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              {t('timesheet.recall.button')}
            </button>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationResult && validationResult.errors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            {t('timesheet.validation.issues')}
          </h3>
          <ul className="space-y-1">
            {validationResult.errors.map((error, idx) => (
              <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-base">
                  {error.severity === 'error' ? 'error' : 'warning'}
                </span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Week Navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => changeWeek('prev')}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          {t('timesheet.previousWeek')}
        </button>
        <button
          onClick={() => changeWeek('next')}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          {t('timesheet.nextWeek')}
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timesheet Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <DataState
              loading={isLoading}
              error={error}
              empty={timeEntries.length === 0}
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
                      {isEditable && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('common.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {daysOfWeek.map((day) => {
                      const dayEntries = getEntriesForDay(day.dayOfWeek);
                      const dayTotal = getDayTotal(day.dayOfWeek);
                      const dayDate = getDateForDay(day.dayOfWeek);

                      if (dayEntries.length === 0) {
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
                            {isEditable && (
                              <td className="px-6 py-4 text-sm text-right">
                                <button
                                  onClick={() => handleAddEntry(day.dayOfWeek)}
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <span className="material-symbols-outlined text-sm">add</span>
                                  {t('timesheet.addEntry')}
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      }

                      return dayEntries.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                              {entry.projectId}
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
                          {isEditable && (
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
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>

              {/* Week Totals Footer */}
              <WeekTotalsFooter
                dailyTotals={dailyTotals}
                weeklyTotal={weeklyTotal}
                targetHours={user?.policy?.maxHoursPerWeek || 40}
              />
            </DataState>
          </div>
        </div>

        {/* Project Breakdown Sidebar */}
        <div className="lg:col-span-1">
          <ProjectBreakdownPanel
            breakdown={projectBreakdown}
            totalHours={weeklyTotal}
          />
        </div>
      </div>

      {/* Modals */}
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
            projectId: editingEntry.projectId,
            taskId: editingEntry.taskId,
            hours: editingEntry.hours,
            note: editingEntry.note || '',
          } : undefined}
        />
      )}

      {showBulkFill && (
        <BulkFillModal
          onSubmit={handleBulkFillSubmit}
          onCancel={() => setShowBulkFill(false)}
          weekStartDate={weekStartDate}
        />
      )}
    </div>
  );
}
