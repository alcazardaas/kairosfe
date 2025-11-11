/**
 * Team Member Performance Component
 * Individual team member analytics and performance metrics
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/browser';
import { reportsService } from '@/lib/api/services/reports';
import { employeesService } from '@/lib/api/services/employees';
import type { Employee } from '@kairos/shared';

interface MemberPerformance {
  userId: string;
  userName: string;
  totalHours: number;
  avgWeeklyHours: number;
  projectCount: number;
  totalLeaveDays: number;
  utilizationRate: number;
  weeklyTrend: { week: string; hours: number }[];
  projectBreakdown: { projectName: string; hours: number; percentage: number }[];
}

export default function TeamMemberPerformanceContent() {
  const { t } = useTranslation();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [performance, setPerformance] = useState<MemberPerformance | null>(null);
  const [teamAverage, setTeamAverage] = useState<{ avgWeeklyHours: number; utilizationRate: number } | null>(null);

  // Initialize date range (last 90 days for better trends)
  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);

    setToDate(to.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);

    // Track page view
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('team_member_performance_viewed');
    }
  }, []);

  // Load employees
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const employeesRes = await employeesService.getActive();

        const activeEmployees = employeesRes.data || [];
        setEmployees(activeEmployees);

        // Select first employee by default
        if (activeEmployees.length > 0 && !selectedUserId) {
          setSelectedUserId(activeEmployees[0].id);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error('Failed to load metadata:', err);
          Sentry.captureException(err);
        }
      }
    };

    loadMetadata();
  }, []);

  // Load performance data when filters change
  useEffect(() => {
    if (fromDate && toDate && selectedUserId) {
      loadPerformanceData();
    }
  }, [fromDate, toDate, selectedUserId]);

  const loadPerformanceData = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

    try {
      // Load individual performance
      const [timesheetData, leaveData, teamTimesheetData] = await Promise.all([
        reportsService.getTimesheetReport({
          from: fromDate,
          to: toDate,
          userIds: [selectedUserId],
        }),
        reportsService.getLeaveReport({
          from: fromDate,
          to: toDate,
          userIds: [selectedUserId],
        }),
        // Load team data for comparison
        reportsService.getTimesheetReport({
          from: fromDate,
          to: toDate,
        }),
      ]);

      // Calculate member performance
      const userStats = timesheetData.userStats.find((u: { userId: string }) => u.userId === selectedUserId);
      if (!userStats) {
        setError('No data found for selected team member');
        setPerformance(null);
        setTeamAverage(null);
        setLoading(false);
        return;
      }

      // Calculate weekly trend (group by week)
      const weeklyTrend = calculateWeeklyTrend(fromDate, toDate, selectedUserId);

      // Calculate project breakdown
      const projectBreakdown = timesheetData.projectAllocations
        .filter((p: { projectId: string; projectName: string; totalHours: number }) => p.projectId)
        .map((p: { projectId: string; projectName: string; totalHours: number }) => ({
          projectName: p.projectName,
          hours: p.totalHours,
          percentage: (p.totalHours / timesheetData.totalHours) * 100,
        }));

      // Calculate utilization rate (assuming 40 hours/week as standard)
      const weeks = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const expectedHours = weeks * 40;
      const utilizationRate = (userStats.totalHours / expectedHours) * 100;

      // Get leave days
      const leaveDays = (leaveData.leaveStats as any[]).find((l: { userId: string; totalDays: number }) => l.userId === selectedUserId)?.totalDays || 0;

      setPerformance({
        userId: selectedUserId,
        userName: userStats.userName,
        totalHours: userStats.totalHours,
        avgWeeklyHours: userStats.avgWeeklyHours,
        projectCount: userStats.projectCount,
        totalLeaveDays: leaveDays,
        utilizationRate,
        weeklyTrend,
        projectBreakdown,
      });

      // Calculate team averages
      const teamUtilization = (teamTimesheetData.teamUtilization.totalHours / (expectedHours * teamTimesheetData.teamUtilization.activeEmployees)) * 100;
      setTeamAverage({
        avgWeeklyHours: teamTimesheetData.teamUtilization.avgHoursPerEmployee / weeks,
        utilizationRate: teamUtilization,
      });

      // Track event
      if (typeof window !== 'undefined' && posthog) {
        posthog.capture('member_performance_loaded', {
          userId: selectedUserId,
          from: fromDate,
          to: toDate,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to load performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyTrend = (_from: string, _to: string, _userId: string): { week: string; hours: number }[] => {
    // This is a simplified version - in production, you'd fetch actual weekly data
    // For now, return empty array as placeholder
    return [];
  };

  const handleExportCSV = () => {
    if (!performance) return;

    const data = [
      {
        'Team Member': performance.userName,
        'Period': `${fromDate} to ${toDate}`,
        'Total Hours': performance.totalHours.toFixed(2),
        'Avg Weekly Hours': performance.avgWeeklyHours.toFixed(2),
        'Projects': performance.projectCount,
        'Leave Days': performance.totalLeaveDays,
        'Utilization Rate': `${performance.utilizationRate.toFixed(1)}%`,
      },
    ];

    reportsService.exportToCSV(data, `team-member-performance-${performance.userName}-${Date.now()}.csv`);

    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('member_performance_exported', {
        userId: selectedUserId,
      });
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-blue-600 dark:text-blue-400';
    if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getUtilizationBgColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (rate >= 70) return 'bg-blue-100 dark:bg-blue-900/20';
    if (rate >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  if (loading && !performance) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Team Member Performance
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Analyze individual team member contributions and performance metrics
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Team Member Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Select team member</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name || employee.email}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('teamReports.fromDate')}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('teamReports.toDate')}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              disabled={!performance || loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              {t('teamReports.exportCSV')}
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !performance && !error && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <span className="material-symbols-outlined mb-4 text-6xl text-gray-300 dark:text-gray-600">
            person_off
          </span>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedUserId ? 'No data available for selected period' : 'Select a team member to view performance'}
          </p>
        </div>
      )}

      {/* Performance Data */}
      {performance && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Hours */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {performance.totalHours.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                  <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">
                    schedule
                  </span>
                </div>
              </div>
            </div>

            {/* Avg Weekly Hours */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Weekly Hours</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {performance.avgWeeklyHours.toFixed(1)}
                  </p>
                  {teamAverage && (
                    <p className="mt-1 text-xs text-gray-500">
                      Team avg: {teamAverage.avgWeeklyHours.toFixed(1)}
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400">
                    trending_up
                  </span>
                </div>
              </div>
            </div>

            {/* Utilization Rate */}
            <div className={`rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-700 ${getUtilizationBgColor(performance.utilizationRate)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilization Rate</p>
                  <p className={`mt-1 text-2xl font-bold ${getUtilizationColor(performance.utilizationRate)}`}>
                    {performance.utilizationRate.toFixed(1)}%
                  </p>
                  {teamAverage && (
                    <p className="mt-1 text-xs text-gray-500">
                      Team avg: {teamAverage.utilizationRate.toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className={`rounded-full p-3 ${getUtilizationBgColor(performance.utilizationRate)}`}>
                  <span className={`material-symbols-outlined text-2xl ${getUtilizationColor(performance.utilizationRate)}`}>
                    speed
                  </span>
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {performance.projectCount}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {performance.totalLeaveDays} leave days
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                  <span className="material-symbols-outlined text-2xl text-purple-600 dark:text-purple-400">
                    folder
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Breakdown */}
          {performance.projectBreakdown.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Time Allocation by Project
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Percentage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Distribution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {performance.projectBreakdown.map((project, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {project.projectName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {project.hours.toFixed(1)}h
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {project.percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${project.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comparison to Team Average */}
          {teamAverage && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Comparison to Team Average
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Weekly Hours Comparison */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Weekly Hours
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Member</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {performance.avgWeeklyHours.toFixed(1)}h
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${(performance.avgWeeklyHours / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Team Avg</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {teamAverage.avgWeeklyHours.toFixed(1)}h
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-gray-400"
                          style={{ width: `${(teamAverage.avgWeeklyHours / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {performance.avgWeeklyHours > teamAverage.avgWeeklyHours ? (
                      <span className="text-green-600">
                        {((performance.avgWeeklyHours - teamAverage.avgWeeklyHours) / teamAverage.avgWeeklyHours * 100).toFixed(1)}% above team average
                      </span>
                    ) : (
                      <span className="text-red-600">
                        {((teamAverage.avgWeeklyHours - performance.avgWeeklyHours) / teamAverage.avgWeeklyHours * 100).toFixed(1)}% below team average
                      </span>
                    )}
                  </p>
                </div>

                {/* Utilization Comparison */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Utilization Rate
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Member</span>
                        <span className={`font-medium ${getUtilizationColor(performance.utilizationRate)}`}>
                          {performance.utilizationRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-2 rounded-full ${
                            performance.utilizationRate >= 70 ? 'bg-green-600' :
                            performance.utilizationRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(performance.utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Team Avg</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {teamAverage.utilizationRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-gray-400"
                          style={{ width: `${Math.min(teamAverage.utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {performance.utilizationRate > teamAverage.utilizationRate ? (
                      <span className="text-green-600">
                        {((performance.utilizationRate - teamAverage.utilizationRate) / teamAverage.utilizationRate * 100).toFixed(1)}% above team average
                      </span>
                    ) : (
                      <span className="text-red-600">
                        {((teamAverage.utilizationRate - performance.utilizationRate) / teamAverage.utilizationRate * 100).toFixed(1)}% below team average
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
