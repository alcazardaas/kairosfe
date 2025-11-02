/**
 * Team Reports Component
 * Comprehensive reporting dashboard for managers and admins
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import posthog from 'posthog-js';
import * Sentry from '@sentry/browser';
import { reportsService } from '@/lib/api/services/reports';
import { employeesService } from '@/lib/api/services/employees';
import { projectsService } from '@/lib/api/services/projects';
import type { Employee, Project } from '@kairos/shared';

type ReportType = 'timesheets' | 'leave' | 'projects';

export default function TeamReportsContent() {
  const { t } = useTranslation();

  // State
  const [reportType, setReportType] = useState<ReportType>('timesheets');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('all');

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  // Initialize date range (last 30 days)
  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    setToDate(to.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);
  }, []);

  // Load employees and projects
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [employeesRes, projectsRes] = await Promise.all([
          employeesService.getAll(),
          projectsService.getAll(),
        ]);

        setEmployees(employeesRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err: any) {
        console.error('Failed to load metadata:', err);
        Sentry.captureException(err);
      }
    };

    loadMetadata();
  }, []);

  // Load report data
  useEffect(() => {
    if (fromDate && toDate) {
      loadReportData();
    }
  }, [fromDate, toDate, selectedUserIds, selectedProjectIds, status, reportType]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (reportType === 'timesheets') {
        const data = await reportsService.getTimesheetReport({
          from: fromDate,
          to: toDate,
          userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
          status: status !== 'all' ? (status as any) : undefined,
        });
        setReportData(data);
      } else if (reportType === 'leave') {
        const data = await reportsService.getLeaveReport({
          from: fromDate,
          to: toDate,
          userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          status: status !== 'all' ? (status as any) : undefined,
        });
        setReportData(data);
      }

      posthog.capture('team_reports_loaded', {
        report_type: reportType,
        from: fromDate,
        to: toDate,
        user_filter_count: selectedUserIds.length,
        project_filter_count: selectedProjectIds.length,
      });
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Failed to load report data');
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    try {
      const timestamp = new Date().toISOString().split('T')[0];

      if (reportType === 'timesheets') {
        // Export user stats
        reportsService.exportToCSV(
          reportData.userStats,
          `timesheet-report-${timestamp}.csv`
        );
      } else if (reportType === 'leave') {
        // Export leave stats
        reportsService.exportToCSV(
          reportData.leaveStats,
          `leave-report-${timestamp}.csv`
        );
      }

      posthog.capture('team_reports_exported', {
        report_type: reportType,
        from: fromDate,
        to: toDate,
      });
    } catch (err: any) {
      console.error('Failed to export:', err);
      Sentry.captureException(err);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === employees.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(employees.map((e) => e.id));
    }
  };

  const selectAllProjects = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-fg-light dark:text-fg-dark">
            {t('teamReports.title')}
          </h1>
          <p className="mt-1 text-sm text-fg-muted-light dark:text-fg-muted-dark">
            {t('teamReports.subtitle')}
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-bg-subtle-light p-1 dark:bg-bg-subtle-dark">
          <button
            type="button"
            onClick={() => setReportType('timesheets')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              reportType === 'timesheets'
                ? 'bg-primary-light text-white dark:bg-primary-dark'
                : 'text-fg-muted-light hover:text-fg-light dark:text-fg-muted-dark dark:hover:text-fg-dark'
            }`}
          >
            {t('teamReports.timesheetReport')}
          </button>
          <button
            type="button"
            onClick={() => setReportType('leave')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              reportType === 'leave'
                ? 'bg-primary-light text-white dark:bg-primary-dark'
                : 'text-fg-muted-light hover:text-fg-light dark:text-fg-muted-dark dark:hover:text-fg-dark'
            }`}
          >
            {t('teamReports.leaveReport')}
          </button>
          <button
            type="button"
            onClick={() => setReportType('projects')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              reportType === 'projects'
                ? 'bg-primary-light text-white dark:bg-primary-dark'
                : 'text-fg-muted-light hover:text-fg-light dark:text-fg-muted-dark dark:hover:text-fg-dark'
            }`}
          >
            {t('teamReports.projectReport')}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
          <h3 className="mb-4 text-sm font-semibold text-fg-light dark:text-fg-dark">
            {t('teamReports.filters')}
          </h3>

          {/* Date Range */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-fg-light dark:text-fg-dark">
                {t('teamReports.fromDate')}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-bg-light px-3 py-2 text-sm focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:border-border-dark dark:bg-bg-dark dark:focus:border-primary-dark dark:focus:ring-primary-dark/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-fg-light dark:text-fg-dark">
                {t('teamReports.toDate')}
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-bg-light px-3 py-2 text-sm focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:border-border-dark dark:bg-bg-dark dark:focus:border-primary-dark dark:focus:ring-primary-dark/20"
              />
            </div>
          </div>

          {/* Status Filter (for timesheets and leave) */}
          {reportType !== 'projects' && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-fg-light dark:text-fg-dark">
                {t('teamReports.status')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-bg-light px-3 py-2 text-sm focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:border-border-dark dark:bg-bg-dark dark:focus:border-primary-dark dark:focus:ring-primary-dark/20"
              >
                <option value="all">{t('common.all')}</option>
                {reportType === 'timesheets' && (
                  <>
                    <option value="draft">{t('timesheet.draft')}</option>
                    <option value="submitted">{t('timesheet.submitted')}</option>
                    <option value="approved">{t('timesheet.approved')}</option>
                    <option value="rejected">{t('timesheet.rejected')}</option>
                  </>
                )}
                {reportType === 'leave' && (
                  <>
                    <option value="pending">{t('leave.pending')}</option>
                    <option value="approved">{t('leave.approved')}</option>
                    <option value="rejected">{t('leave.rejected')}</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Team Members Filter */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-fg-light dark:text-fg-dark">
                {t('teamReports.teamMembers')}
              </label>
              <button
                type="button"
                onClick={selectAllUsers}
                className="text-sm text-primary-light hover:underline dark:text-primary-dark"
              >
                {selectedUserIds.length === employees.length
                  ? t('common.deselectAll')
                  : t('common.selectAll')}
              </button>
            </div>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border-light bg-bg-subtle-light px-3 py-2 hover:bg-bg-subtle-light/50 dark:border-border-dark dark:bg-bg-subtle-dark dark:hover:bg-bg-subtle-dark/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(employee.id)}
                    onChange={() => toggleUser(employee.id)}
                    className="h-4 w-4 rounded border-border-light text-primary-light focus:ring-2 focus:ring-primary-light dark:border-border-dark dark:text-primary-dark dark:focus:ring-primary-dark"
                  />
                  <span className="text-sm text-fg-light dark:text-fg-dark">
                    {employee.name || employee.email}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Projects Filter (for timesheets only) */}
          {reportType === 'timesheets' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-fg-light dark:text-fg-dark">
                  {t('teamReports.projects')}
                </label>
                <button
                  type="button"
                  onClick={selectAllProjects}
                  className="text-sm text-primary-light hover:underline dark:text-primary-dark"
                >
                  {selectedProjectIds.length === projects.length
                    ? t('common.deselectAll')
                    : t('common.selectAll')}
                </button>
              </div>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border-light bg-bg-subtle-light px-3 py-2 hover:bg-bg-subtle-light/50 dark:border-border-dark dark:bg-bg-subtle-dark dark:hover:bg-bg-subtle-dark/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="h-4 w-4 rounded border-border-light text-primary-light focus:ring-2 focus:ring-primary-light dark:border-border-dark dark:text-primary-dark dark:focus:ring-primary-dark"
                    />
                    <span className="text-sm text-fg-light dark:text-fg-dark">
                      {project.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !reportData}
            className="flex items-center gap-2 rounded-lg bg-primary-light px-4 py-2 text-sm font-medium text-white hover:bg-primary-light/90 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            {t('teamReports.exportCSV')}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-light border-r-transparent dark:border-primary-dark"></div>
              <p className="text-sm text-fg-muted-light dark:text-fg-muted-dark">
                {t('common.loading')}...
              </p>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <>
            {/* Timesheet Report */}
            {reportType === 'timesheets' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.totalHours')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-fg-light dark:text-fg-dark">
                      {reportData.totalHours.toFixed(1)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.activeEmployees')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-fg-light dark:text-fg-dark">
                      {reportData.teamUtilization.activeEmployees} / {reportData.teamUtilization.totalEmployees}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.avgHoursPerEmployee')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-fg-light dark:text-fg-dark">
                      {reportData.teamUtilization.avgHoursPerEmployee.toFixed(1)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.totalTimesheets')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-fg-light dark:text-fg-dark">
                      {reportData.timesheetCount}
                    </div>
                  </div>
                </div>

                {/* Timesheet Status */}
                <div className="rounded-lg border border-border-light bg-bg-light p-6 dark:border-border-dark dark:bg-bg-dark">
                  <h3 className="mb-4 text-lg font-semibold text-fg-light dark:text-fg-dark">
                    {t('teamReports.timesheetStatus')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-500">{reportData.statusStats.draft}</div>
                      <div className="mt-1 text-sm text-fg-muted-light dark:text-fg-muted-dark">
                        {t('timesheet.draft')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-500">{reportData.statusStats.submitted}</div>
                      <div className="mt-1 text-sm text-fg-muted-light dark:text-fg-muted-dark">
                        {t('timesheet.submitted')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500">{reportData.statusStats.approved}</div>
                      <div className="mt-1 text-sm text-fg-muted-light dark:text-fg-muted-dark">
                        {t('timesheet.approved')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500">{reportData.statusStats.rejected}</div>
                      <div className="mt-1 text-sm text-fg-muted-light dark:text-fg-muted-dark">
                        {t('timesheet.rejected')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Allocations */}
                {reportData.projectAllocations.length > 0 && (
                  <div className="rounded-lg border border-border-light bg-bg-light p-6 dark:border-border-dark dark:bg-bg-dark">
                    <h3 className="mb-4 text-lg font-semibold text-fg-light dark:text-fg-dark">
                      {t('teamReports.projectAllocations')}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border-light dark:border-border-dark">
                          <tr>
                            <th className="pb-3 text-left text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.project')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.totalHours')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.users')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.avgPerUser')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.percentage')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.projectAllocations.map((project: any) => (
                            <tr
                              key={project.projectId}
                              className="border-b border-border-light last:border-b-0 dark:border-border-dark"
                            >
                              <td className="py-3 text-sm text-fg-light dark:text-fg-dark">
                                {project.projectName}
                              </td>
                              <td className="py-3 text-right text-sm text-fg-light dark:text-fg-dark">
                                {project.totalHours.toFixed(1)}
                              </td>
                              <td className="py-3 text-right text-sm text-fg-light dark:text-fg-dark">
                                {project.userCount}
                              </td>
                              <td className="py-3 text-right text-sm text-fg-light dark:text-fg-dark">
                                {project.avgHoursPerUser.toFixed(1)}
                              </td>
                              <td className="py-3 text-right text-sm font-medium text-primary-light dark:text-primary-dark">
                                {((project.totalHours / reportData.totalHours) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* User Stats */}
                {reportData.userStats.length > 0 && (
                  <div className="rounded-lg border border-border-light bg-bg-light p-6 dark:border-border-dark dark:bg-bg-dark">
                    <h3 className="mb-4 text-lg font-semibold text-fg-light dark:text-fg-dark">
                      {t('teamReports.employeeBreakdown')}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border-light dark:border-border-dark">
                          <tr>
                            <th className="pb-3 text-left text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.employee')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.totalHours')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.avgWeekly')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.projects')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.userStats.map((user: any) => (
                            <tr
                              key={user.userId}
                              className="border-b border-border-light last:border-b-0 dark:border-border-dark"
                            >
                              <td className="py-3 text-sm text-fg-light dark:text-fg-dark">
                                {user.userName}
                              </td>
                              <td className="py-3 text-right text-sm text-fg-light dark:text-fg-dark">
                                {user.totalHours.toFixed(1)}
                              </td>
                              <td className="py-3 text-right text-sm text-fg-light dark:text-fg-dark">
                                {user.avgWeeklyHours.toFixed(1)}
                              </td>
                              <td className="py-3 text-right text-sm text-fg-light dark:text-fg-dark">
                                {user.projectCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leave Report */}
            {reportType === 'leave' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.totalRequests')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-fg-light dark:text-fg-dark">
                      {reportData.summary.totalRequests}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.pendingRequests')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-500">
                      {reportData.summary.pendingRequests}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.approvedRequests')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-green-500">
                      {reportData.summary.approvedRequests}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
                    <div className="text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                      {t('teamReports.totalDays')}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-fg-light dark:text-fg-dark">
                      {reportData.summary.totalDays}
                    </div>
                  </div>
                </div>

                {/* Employee Leave Stats */}
                {reportData.leaveStats.length > 0 && (
                  <div className="rounded-lg border border-border-light bg-bg-light p-6 dark:border-border-dark dark:bg-bg-dark">
                    <h3 className="mb-4 text-lg font-semibold text-fg-light dark:text-fg-dark">
                      {t('teamReports.employeeLeave')}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border-light dark:border-border-dark">
                          <tr>
                            <th className="pb-3 text-left text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.employee')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.totalDays')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.pending')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.approved')}
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-fg-muted-light dark:text-fg-muted-dark">
                              {t('teamReports.rejected')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.leaveStats.map((leave: any) => (
                            <tr
                              key={leave.userId}
                              className="border-b border-border-light last:border-b-0 dark:border-border-dark"
                            >
                              <td className="py-3 text-sm text-fg-light dark:text-fg-dark">
                                {leave.userName}
                              </td>
                              <td className="py-3 text-right text-sm font-medium text-fg-light dark:text-fg-dark">
                                {leave.totalDays}
                              </td>
                              <td className="py-3 text-right text-sm text-amber-600 dark:text-amber-400">
                                {leave.pendingDays}
                              </td>
                              <td className="py-3 text-right text-sm text-green-600 dark:text-green-400">
                                {leave.approvedDays}
                              </td>
                              <td className="py-3 text-right text-sm text-red-600 dark:text-red-400">
                                {leave.rejectedDays}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Projects Report */}
            {reportType === 'projects' && (
              <div className="rounded-lg border border-border-light bg-bg-light p-6 text-center dark:border-border-dark dark:bg-bg-dark">
                <p className="text-sm text-fg-muted-light dark:text-fg-muted-dark">
                  {t('teamReports.projectReportComingSoon')}
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !reportData && (
          <div className="rounded-lg border border-border-light bg-bg-light p-12 text-center dark:border-border-dark dark:bg-bg-dark">
            <span className="material-symbols-outlined mb-4 text-6xl text-fg-muted-light dark:text-fg-muted-dark">
              assessment
            </span>
            <p className="text-sm text-fg-muted-light dark:text-fg-muted-dark">
              {t('teamReports.selectFilters')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
