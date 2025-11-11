import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useTimesheetStore } from '@/lib/store';
import { timesheetsService } from '@/lib/api/services/timesheets';
import { timeEntriesService } from '@/lib/api/services/time-entries';
import { getWeekDates, formatDate, getDayName, isToday } from '@/lib/utils/date';
import WeekPicker from '@/components/ui/WeekPicker';
import TimeEntryForm from '@/components/forms/TimeEntryForm';
import type { TimeEntry } from '@kairos/shared';
import { showToast } from '@/lib/utils/toast';
import '@/lib/i18n';

export default function TimesheetTable() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const policy = useAuthStore((state) => state.policy);

  const {
    currentTimesheet,
    timeEntries,
    selectedWeekStart,
    setCurrentTimesheet,
    setTimeEntries,
    addTimeEntry,
    updateTimeEntry: updateEntryInStore,
    removeTimeEntry,
    setSelectedWeekStart,
  } = useTimesheetStore();

  const [loading, setLoading] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Load timesheet and entries for selected week
  useEffect(() => {
    if (!user) return;

    const loadTimesheetData = async () => {
      setLoading(true);
      try {
        const weekStartStr = formatDate(selectedWeekStart);

        // Get timesheet for the week
        const response = await timesheetsService.getAll({
          userId: user.id,
          weekStart: weekStartStr,
        });

        if (response.data.length > 0) {
          const timesheet = response.data[0];
          setCurrentTimesheet(timesheet);

          // Load time entries for this week
          const entriesResponse = await timeEntriesService.getAll({
            userId: user.id,
            weekStartDate: weekStartStr
          });
          setTimeEntries(entriesResponse.data);
        } else {
          setCurrentTimesheet(null);
          setTimeEntries([]);
        }
      } catch (error) {
        console.error('Failed to load timesheet:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimesheetData();
  }, [selectedWeekStart, user, setCurrentTimesheet, setTimeEntries]);

  const handleCreateTimesheet = async () => {
    if (!user) return;

    try {
      const weekStartStr = formatDate(selectedWeekStart);
      const newTimesheet = await timesheetsService.create(weekStartStr, user.id);
      setCurrentTimesheet(newTimesheet);
    } catch (error) {
      console.error('Failed to create timesheet:', error);
    }
  };

  const handleAddEntry = (date: string) => {
    setSelectedDate(date);
    setEditingEntry(undefined);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    // Calculate date from weekStartDate and dayOfWeek
    const weekStart = new Date(entry.weekStartDate);
    const entryDate = new Date(weekStart.getTime() + entry.dayOfWeek * 24 * 60 * 60 * 1000);
    setSelectedDate(entryDate.toISOString().split('T')[0]);
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDeleteEntry = async (entry: TimeEntry) => {
    if (!confirm(t('timesheet.confirmDelete'))) return;

    try {
      await timeEntriesService.delete(entry.id);
      removeTimeEntry(entry.id);

      // Reload timesheet to update total
      if (currentTimesheet) {
        const response = await timesheetsService.getAll({ userId: user!.id });
        const timesheet = response.data.find((ts) => ts.id === currentTimesheet.id);
        if (timesheet) setCurrentTimesheet(timesheet);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleFormSubmit = async (data: { projectId: string; taskId?: string | null; hours: number; notes?: string }) => {
    if (!currentTimesheet || !user) return;

    try {
      if (editingEntry) {
        // Update existing entry (only hours and note can be updated)
        const updated = await timeEntriesService.update(editingEntry.id, {
          hours: data.hours,
          note: data.notes || undefined,
        });
        updateEntryInStore(editingEntry.id, updated.data);
      } else {
        // Create new entry
        const weekStartStr = formatDate(selectedWeekStart);
        const newEntry = await timeEntriesService.create({
          userId: user.id,
          projectId: data.projectId,
          taskId: data.taskId || null,
          weekStartDate: weekStartStr,
          dayOfWeek: new Date(selectedDate).getDay(),
          hours: data.hours,
          note: data.notes || undefined,
        });
        addTimeEntry(newEntry.data);
      }

      // Reload timesheet to update total
      const response = await timesheetsService.getAll({ userId: user!.id });
      const timesheet = response.data.find((ts) => ts.id === currentTimesheet.id);
      if (timesheet) setCurrentTimesheet(timesheet);

      setShowEntryForm(false);
      setEditingEntry(undefined);
    } catch (error) {
      console.error('Failed to save time entry:', error);
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!currentTimesheet) return;

    // Validate against policy
    if (policy) {
      const weekDates = getWeekDates(selectedWeekStart);
      for (const date of weekDates) {
        const dateStr = formatDate(date);
        const dayEntries = timeEntries.filter((e) => {
          const entryDate = new Date(new Date(e.weekStartDate).getTime() + e.dayOfWeek * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          return entryDate === dateStr;
        });
        const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);

        if (dayTotal > policy.maxHoursPerDay) {
          showToast.error(
            t('timesheet.validationMaxHoursPerDay', {
              max: policy.maxHoursPerDay,
              date: date.toLocaleDateString(),
            })
          );
          return;
        }
      }

      if (currentTimesheet.totalHours && currentTimesheet.totalHours > policy.maxHoursPerWeek) {
        showToast.error(
          t('timesheet.validationMaxHoursPerWeek', { max: policy.maxHoursPerWeek })
        );
        return;
      }
    }

    if (!confirm(t('timesheet.confirmSubmit'))) return;

    try {
      setSubmitting(true);
      const updated = await timesheetsService.submit(currentTimesheet.id);
      setCurrentTimesheet(updated);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('timesheet_submitted', {
          timesheetId: currentTimesheet.id,
          totalHours: currentTimesheet.totalHours || 0,
          weekStart: (currentTimesheet as any).weekStartDate || (currentTimesheet as any).weekStart,
        });
      }
    } catch (error) {
      console.error('Failed to submit timesheet:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const weekDates = getWeekDates(selectedWeekStart);

  // Calculate daily totals
  const dailyTotals = weekDates.map((date) => {
    const dateStr = formatDate(date);
    const dayEntries = timeEntries.filter((e) => {
      const entryDate = new Date(new Date(e.weekStartDate).getTime() + e.dayOfWeek * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return entryDate === dateStr;
    });
    return dayEntries.reduce((sum, e) => sum + e.hours, 0);
  });

  // Group entries by date (currently unused but may be needed later)
  // const entriesByDate = weekDates.map((date) => {
  //   const dateStr = formatDate(date);
  //   return timeEntries.filter((e) => e.date === dateStr);
  // });

  const canEdit = !currentTimesheet || currentTimesheet.status === 'draft';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Picker */}
      <WeekPicker selectedWeek={selectedWeekStart} onWeekChange={setSelectedWeekStart} />

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <div>
          {currentTimesheet ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('timesheet.status')}:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentTimesheet.status === 'draft'
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    : currentTimesheet.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : currentTimesheet.status === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {t(`timesheet.status_${currentTimesheet.status}`)}
              </span>
            </div>
          ) : (
            <button
              onClick={handleCreateTimesheet}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('timesheet.createTimesheet')}
            </button>
          )}
        </div>

        {currentTimesheet && canEdit && (
          <button
            onClick={handleSubmitTimesheet}
            disabled={submitting || timeEntries.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {submitting ? t('common.submitting') : t('timesheet.submitForApproval')}
          </button>
        )}
      </div>

      {/* Timesheet Table */}
      {currentTimesheet && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600">
                  {t('timesheet.projectTask')}
                </th>
                {weekDates.map((date) => (
                  <th
                    key={formatDate(date)}
                    className={`px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 dark:border-gray-600 ${
                      isToday(date)
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div>{getDayName(date)}</div>
                    <div className="text-xs font-normal mt-1">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                ))}
                {canEdit && (
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('common.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {/* Existing entries */}
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.projectName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {entry.taskName}
                    </div>
                    {entry.note && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {entry.note}
                      </div>
                    )}
                  </td>
                  {weekDates.map((date) => {
                    const dateStr = formatDate(date);
                    // Calculate entry date from weekStartDate + dayOfWeek
                    const entryDateCalc = new Date(new Date(entry.weekStartDate).getTime() + entry.dayOfWeek * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const isEntryDate = entryDateCalc === dateStr;
                    return (
                      <td
                        key={dateStr}
                        className={`px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 ${
                          isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        {isEntryDate && (
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.hours}h
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {canEdit && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {/* Add entry row */}
              {canEdit && (
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('timesheet.addEntry')}
                    </span>
                  </td>
                  {weekDates.map((date) => (
                    <td
                      key={formatDate(date)}
                      className={`px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 ${
                        isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleAddEntry(formatDate(date))}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                      </button>
                    </td>
                  ))}
                  <td></td>
                </tr>
              )}

              {/* Daily totals */}
              <tr className="border-t-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800">
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600">
                  {t('timesheet.dailyTotal')}
                </td>
                {dailyTotals.map((total, index) => (
                  <td
                    key={index}
                    className={`px-4 py-3 text-center font-semibold border-r border-gray-300 dark:border-gray-600 ${
                      isToday(weekDates[index])
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-gray-100'
                    } ${
                      policy && total > policy.maxHoursPerDay
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                    }`}
                  >
                    {total > 0 ? `${total}h` : '-'}
                  </td>
                ))}
                {canEdit && <td></td>}
              </tr>

              {/* Weekly total */}
              <tr className="border-t border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600">
                  {t('timesheet.weeklyTotal')}
                </td>
                <td
                  colSpan={7}
                  className={`px-4 py-3 text-center font-bold text-lg ${
                    policy && currentTimesheet.totalHours && currentTimesheet.totalHours > policy.maxHoursPerWeek
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {currentTimesheet.totalHours || 0}h
                  {policy && (
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                      / {policy.maxHoursPerWeek}h {t('timesheet.max')}
                    </span>
                  )}
                </td>
                {canEdit && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingEntry ? t('timesheet.editEntry') : t('timesheet.addEntry')}
            </h3>
            <TimeEntryForm
              initialData={editingEntry ? {
                projectId: editingEntry.projectId,
                taskId: editingEntry.taskId,
                hours: editingEntry.hours,
                note: editingEntry.note || undefined
              } : undefined}
              dayOfWeek={new Date(selectedDate).getDay()}
              weekStartDate={formatDate(selectedWeekStart)}
              isEditing={!!editingEntry}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowEntryForm(false);
                setEditingEntry(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
