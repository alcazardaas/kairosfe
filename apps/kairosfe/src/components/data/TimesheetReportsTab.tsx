/**
 * TimesheetReportsTab Component
 * Analytics and reporting view for timesheet data
 * Epic 6: Reporting and analytics
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { timeEntriesService } from '@/lib/api/services/time-entries';
import { timesheetsService } from '@/lib/api/services/timesheets';
import type { ProjectBreakdownDto } from '@/lib/api/schemas';
import DataState from '@/components/ui/DataState';
import '@/lib/i18n';

interface ProjectStats {
  projectId: string;
  projectName: string;
  totalHours: number;
  weekCount: number;
  avgHoursPerWeek: number;
}

export default function TimesheetReportsTab() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range for reports
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Report data
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [avgWeeklyHours, setAvgWeeklyHours] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  // Initialize date range (last 3 months)
  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 3);

    setToDate(to.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fromDate && toDate && user?.id) {
      loadReportData();
    }
  }, [fromDate, toDate, user?.id]);

  const loadReportData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load timesheets for the period
      const timesheetsResponse = await timesheetsService.getAll({
        userId: user.id,
        from: fromDate,
        to: toDate,
        status: 'approved', // Only approved timesheets for accurate reporting
        pageSize: 1000, // Get all for the period
      });

      // Load all time entries for the period
      const entriesResponse = await timeEntriesService.getAll({
        userId: user.id,
        weekStartDate: fromDate,
        weekEndDate: toDate,
      });

      // Calculate statistics
      const entries = entriesResponse?.data || [];
      const total = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      setTotalHours(total);

      const weeks = timesheetsResponse?.data?.length || 0;
      setWeekCount(weeks);
      setAvgWeeklyHours(weeks > 0 ? total / weeks : 0);

      // Calculate project statistics
      const projectMap = new Map<string, { hours: number; weeks: Set<string> }>();

      entries.forEach((entry) => {
        const projectId = entry.project_id;
        const weekKey = entry.week_start_date;

        // Skip entries without required data
        if (!projectId || !weekKey || typeof entry.hours !== 'number') {
          return;
        }

        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, { hours: 0, weeks: new Set() });
        }

        const stats = projectMap.get(projectId)!;
        stats.hours += entry.hours;
        stats.weeks.add(weekKey);
      });

      // Convert to array and calculate averages
      const stats: ProjectStats[] = Array.from(projectMap.entries()).map(
        ([projectId, data]) => ({
          projectId,
          projectName: projectId, // In real app, we'd fetch project names
          totalHours: data.hours,
          weekCount: data.weeks.size,
          avgHoursPerWeek: data.weeks.size > 0 ? data.hours / data.weeks.size : 0,
        })
      );

      // Sort by total hours descending
      stats.sort((a, b) => b.totalHours - a.totalHours);
      setProjectStats(stats);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError(t('timesheet.reports.errorLoading'));

      // Reset state to prevent stale data
      setTotalHours(0);
      setAvgWeeklyHours(0);
      setWeekCount(0);
      setProjectStats([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Generate CSV data
    const headers = ['Project', 'Total Hours', 'Weeks', 'Avg Hours/Week'];
    const rows = projectStats.map((stat) => [
      stat.projectName,
      (stat.totalHours ?? 0).toFixed(2),
      stat.weekCount.toString(),
      (stat.avgHoursPerWeek ?? 0).toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      `Total Hours,${(totalHours ?? 0).toFixed(2)}`,
      `Total Weeks,${weekCount ?? 0}`,
      `Average Hours/Week,${(avgWeeklyHours ?? 0).toFixed(2)}`,
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-report-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track event
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('timesheet_report_exported', {
        userId: user?.id,
        fromDate,
        toDate,
        projectCount: projectStats.length,
        totalHours,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('timesheet.reports.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('timesheet.reports.subtitle')}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={loading || projectStats.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">download</span>
          {t('timesheet.reports.exportCSV')}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('timesheet.reports.fromDate')}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('timesheet.reports.toDate')}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReportData}
              className="w-full px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              {t('timesheet.reports.refresh')}
            </button>
          </div>
        </div>
      </div>

      <DataState loading={loading} error={error} empty={false} emptyMessage="">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('timesheet.reports.totalHours')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {(totalHours ?? 0).toFixed(1)}h
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-blue-500">schedule</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('timesheet.reports.avgWeekly')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {(avgWeeklyHours ?? 0).toFixed(1)}h
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-green-500">trending_up</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('timesheet.reports.totalWeeks')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {weekCount}
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-purple-500">calendar_today</span>
            </div>
          </div>
        </div>

        {/* Project Statistics Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('timesheet.reports.projectBreakdown')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('timesheet.reports.projectBreakdownSubtitle')}
            </p>
          </div>

          {projectStats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>{t('timesheet.reports.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('timesheet.reports.project')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('timesheet.reports.totalHours')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('timesheet.reports.weeks')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('timesheet.reports.avgPerWeek')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('timesheet.reports.percentage')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projectStats.map((stat, index) => {
                    const percentage = totalHours > 0 ? ((stat.totalHours ?? 0) / totalHours) * 100 : 0;

                    return (
                      <tr
                        key={stat.projectId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {stat.projectName}
                            </span>
                            {index < 3 && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                Top {index + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                          {(stat.totalHours ?? 0).toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                          {stat.weekCount ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                          {(stat.avgHoursPerWeek ?? 0).toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 dark:bg-blue-400"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-gray-600 dark:text-gray-400 min-w-[3rem]">
                              {(percentage ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
