/**
 * TimesheetHistoryTab Component
 * View and filter past timesheets with status, dates, and total hours
 * Epic 3: Historical timesheet view
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { timesheetsService } from '@/lib/api/services/timesheets';
import type { TimesheetDto, TimesheetStatus } from '@/lib/api/schemas';
import TimesheetStatusBadge from './TimesheetStatusBadge';
import DataState from '@/components/ui/DataState';
import '@/lib/i18n';

export default function TimesheetHistoryTab() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [timesheets, setTimesheets] = useState<TimesheetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TimesheetStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadTimesheets();
  }, [user?.id, statusFilter, fromDate, toDate, page]);

  const loadTimesheets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await timesheetsService.getAll({
        userId: user.id,
        status: statusFilter === 'all' ? undefined : statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        pageSize,
      });

      setTimesheets(response.data);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      console.error('Failed to load timesheets:', err);
      setError(t('timesheet.history.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const formatWeekRange = (weekStartDate: string): string => {
    const start = new Date(weekStartDate);
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const calculateTotalHours = (timesheet: TimesheetDto): number => {
    // This would ideally come from the API, but we can calculate if time_entries are populated
    return (timesheet.time_entries?.length || 0) * 8; // Placeholder calculation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('timesheet.history.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('timesheet.history.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('timesheet.history.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TimesheetStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('timesheet.history.allStatuses')}</option>
              <option value="draft">{t('timesheet.status.draft')}</option>
              <option value="pending">{t('timesheet.status.pending')}</option>
              <option value="approved">{t('timesheet.status.approved')}</option>
              <option value="rejected">{t('timesheet.status.rejected')}</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('timesheet.history.fromDate')}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('timesheet.history.toDate')}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('timesheet.history.resetFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {total > 0 && (
          <p>
            {t('timesheet.history.showing', {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, total),
              total,
            })}
          </p>
        )}
      </div>

      {/* Timesheets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <DataState
          loading={loading}
          error={error}
          empty={timesheets.length === 0}
          emptyMessage={t('timesheet.history.noTimesheets')}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('timesheet.history.weekPeriod')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('timesheet.history.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('timesheet.history.totalHours')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('timesheet.history.submittedDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('timesheet.history.reviewedDate')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {timesheets.map((timesheet) => (
                  <tr
                    key={timesheet.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatWeekRange(timesheet.weekStartDate)}
                    </td>
                    <td className="px-6 py-4">
                      <TimesheetStatusBadge status={timesheet.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {calculateTotalHours(timesheet).toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {timesheet.submittedAt
                        ? new Date(timesheet.submittedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {timesheet.reviewedAt
                        ? new Date(timesheet.reviewedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => {
                          // Navigate to view details (could open a modal or navigate to the week)
                          console.log('View timesheet:', timesheet.id);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t('common.view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.previous')}
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('common.page')} {page} {t('common.of')} {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}
