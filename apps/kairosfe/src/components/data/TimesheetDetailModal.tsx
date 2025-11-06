import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { timesheetsService } from '@/lib/api/services/timesheets';
import { timeEntriesService } from '@/lib/api/services/time-entries';
import { getWeekDates, formatDate, getDayName } from '@/lib/utils/date';
import type { TimesheetDto, TimeEntryDto } from '@/lib/api/schemas';
import TimesheetStatusBadge from './TimesheetStatusBadge';
import '@/lib/i18n';

interface TimesheetDetailModalProps {
  timesheetId: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function TimesheetDetailModal({
  timesheetId,
  onClose,
  onApprove,
  onReject,
}: TimesheetDetailModalProps) {
  const { t } = useTranslation();
  const [timesheet, setTimesheet] = useState<TimesheetDto | null>(null);
  const [entries, setEntries] = useState<TimeEntryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const timesheetData = await timesheetsService.getById(timesheetId);
        setTimesheet(timesheetData);

        // Load time entries for this timesheet's week
        if (timesheetData.weekStartDate && timesheetData.userId) {
          const entriesResponse = await timeEntriesService.getAll({
            userId: timesheetData.userId,
            weekStartDate: timesheetData.weekStartDate,
          });
          setEntries(entriesResponse.data);
        }
      } catch (error) {
        console.error('Failed to load timesheet details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [timesheetId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!timesheet) {
    return null;
  }

  const weekDates = getWeekDates(new Date(timesheet.weekStartDate));

  // Calculate daily totals
  const dailyTotals = weekDates.map((date, idx) => {
    const dayOfWeek = idx; // 0=Sunday, 6=Saturday
    const dayEntries = entries.filter((e) => e.dayOfWeek === dayOfWeek);
    return dayEntries.reduce((sum, e) => sum + e.hours, 0);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('timesheet.timesheetDetails')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Status and Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('timesheet.status')}</p>
            <TimesheetStatusBadge status={timesheet.status} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('timesheet.totalHours')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {timesheet.totalHours || 0}h
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('timesheet.submitted')}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
              {timesheet.submittedAt
                ? new Date(timesheet.submittedAt).toLocaleString()
                : '-'}
            </p>
          </div>
        </div>

        {/* Timesheet Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full border border-gray-300 dark:border-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600">
                  {t('timesheet.projectTask')}
                </th>
                {weekDates.map((date) => (
                  <th
                    key={formatDate(date)}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600"
                  >
                    <div>{getDayName(date)}</div>
                    <div className="text-xs font-normal mt-1">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Project: {entry.projectId}
                    </div>
                    {entry.taskId && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Task: {entry.taskId}
                      </div>
                    )}
                    {entry.note && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {entry.note}
                      </div>
                    )}
                  </td>
                  {weekDates.map((date, idx) => {
                    const isEntryDay = entry.dayOfWeek === idx;
                    return (
                      <td
                        key={idx}
                        className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700"
                      >
                        {isEntryDay && (
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.hours}h
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Daily totals */}
              <tr className="border-t-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800">
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600">
                  {t('timesheet.dailyTotal')}
                </td>
                {dailyTotals.map((total, index) => (
                  <td
                    key={index}
                    className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600"
                  >
                    {total > 0 ? `${total}h` : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.close')}
          </button>
          {timesheet.status === 'pending' && onReject && (
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              {t('timesheet.reject')}
            </button>
          )}
          {timesheet.status === 'pending' && onApprove && (
            <button
              onClick={onApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {t('timesheet.approve')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
