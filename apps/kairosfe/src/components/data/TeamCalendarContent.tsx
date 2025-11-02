/**
 * Team Calendar Component
 * Displays team availability, timesheets, leave, and holidays in a calendar view
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/browser';
import {
  getTeamCalendarData,
  getWeekRange,
  getMonthRange,
  formatDateISO,
  getDatesInRange,
} from '@/lib/api/services/calendar';
import { employeesService } from '@/lib/api/services/employees';
import type { CalendarData, Employee, LeaveRequest, Holiday } from '@kairos/shared';

type ViewMode = 'week' | 'month';

interface DayData {
  date: Date;
  dateStr: string;
  holidays: Holiday[];
  leaves: LeaveRequest[];
  isToday: boolean;
  isWeekend: boolean;
}

interface DayDetailsModalData {
  date: Date;
  dateStr: string;
  holidays: Holiday[];
  leaves: LeaveRequest[];
}

export default function TeamCalendarContent() {
  const { t } = useTranslation();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayDetailsModal, setDayDetailsModal] = useState<DayDetailsModalData | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return getWeekRange(currentDate);
    } else {
      return getMonthRange(currentDate);
    }
  }, [viewMode, currentDate]);

  // Get array of dates in current range
  const dates = useMemo(() => {
    return getDatesInRange(dateRange.from, dateRange.to);
  }, [dateRange]);

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await employeesService.getAll();
        setEmployees(response.data || []);
      } catch (err: any) {
        console.error('Failed to load employees:', err);
        Sentry.captureException(err);
      }
    };

    loadEmployees();
  }, []);

  // Load calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getTeamCalendarData(
          dateRange.from,
          dateRange.to,
          selectedUserIds.length > 0 ? selectedUserIds : undefined
        );
        setCalendarData(data);

        posthog.capture('team_calendar_loaded', {
          view_mode: viewMode,
          from: dateRange.from,
          to: dateRange.to,
          user_filter_count: selectedUserIds.length,
        });
      } catch (err: any) {
        console.error('Failed to load calendar data:', err);
        setError(err.message || 'Failed to load calendar data');
        Sentry.captureException(err);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [dateRange, selectedUserIds, viewMode]);

  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);

    posthog.capture('team_calendar_navigate', {
      direction: 'previous',
      view_mode: viewMode,
    });
  };

  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);

    posthog.capture('team_calendar_navigate', {
      direction: 'next',
      view_mode: viewMode,
    });
  };

  // Go to today
  const handleToday = () => {
    setCurrentDate(new Date());
    posthog.capture('team_calendar_today');
  };

  // Change view mode
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    posthog.capture('team_calendar_view_mode_changed', { mode });
  };

  // Toggle user filter
  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Select all users
  const handleSelectAll = () => {
    if (selectedUserIds.length === employees.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(employees.map((e) => e.id));
    }
  };

  // Get data for a specific day
  const getDayData = (date: Date): DayData => {
    const dateStr = formatDateISO(date);
    const dayHolidays = calendarData?.holidays.filter((h) => h.date === dateStr) || [];
    const dayLeaves = calendarData?.leaves.filter((l) => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return current >= start && current <= end;
    }) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return {
      date,
      dateStr,
      holidays: dayHolidays,
      leaves: dayLeaves,
      isToday: checkDate.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  };

  // Open day details modal
  const handleDayClick = (dayData: DayData) => {
    if (dayData.holidays.length > 0 || dayData.leaves.length > 0) {
      setDayDetailsModal({
        date: dayData.date,
        dateStr: dayData.dateStr,
        holidays: dayData.holidays,
        leaves: dayData.leaves,
      });

      posthog.capture('team_calendar_day_clicked', {
        date: dayData.dateStr,
        has_holidays: dayData.holidays.length > 0,
        has_leaves: dayData.leaves.length > 0,
      });
    }
  };

  // Close day details modal
  const handleCloseModal = () => {
    setDayDetailsModal(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!calendarData) return;

    setExportLoading(true);

    try {
      const rows: string[][] = [['Date', 'Type', 'Name', 'User', 'Status']];

      // Add holidays
      calendarData.holidays.forEach((holiday) => {
        rows.push([
          holiday.date,
          'Holiday',
          holiday.name,
          '-',
          holiday.is_recurring ? 'Recurring' : 'One-Time',
        ]);
      });

      // Add leaves
      calendarData.leaves.forEach((leave) => {
        rows.push([
          `${leave.start_date} to ${leave.end_date}`,
          'Leave',
          leave.benefit_type_name || 'Leave',
          leave.user_name || leave.user_id,
          leave.status,
        ]);
      });

      // Convert to CSV
      const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-calendar-${dateRange.from}-to-${dateRange.to}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      posthog.capture('team_calendar_exported', {
        view_mode: viewMode,
        from: dateRange.from,
        to: dateRange.to,
        holidays_count: calendarData.holidays.length,
        leaves_count: calendarData.leaves.length,
      });
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      Sentry.captureException(err);
    } finally {
      setExportLoading(false);
    }
  };

  // Format period label
  const periodLabel = useMemo(() => {
    if (viewMode === 'week') {
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }, [viewMode, currentDate, dates]);

  if (loading && !calendarData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-light border-r-transparent"></div>
          <p className="text-sm text-fg-muted-light dark:text-fg-muted-dark">
            {t('common.loading')}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-fg-light dark:text-fg-dark">
            {t('teamCalendar.title')}
          </h1>
          <p className="mt-1 text-sm text-fg-muted-light dark:text-fg-muted-dark">
            {t('teamCalendar.subtitle')}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 rounded-lg bg-bg-subtle-light p-1 dark:bg-bg-subtle-dark">
            <button
              type="button"
              onClick={() => handleViewModeChange('week')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary-light text-white dark:bg-primary-dark'
                  : 'text-fg-muted-light hover:text-fg-light dark:text-fg-muted-dark dark:hover:text-fg-dark'
              }`}
            >
              {t('teamCalendar.weekView')}
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('month')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary-light text-white dark:bg-primary-dark'
                  : 'text-fg-muted-light hover:text-fg-light dark:text-fg-muted-dark dark:hover:text-fg-dark'
              }`}
            >
              {t('teamCalendar.monthView')}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevious}
              className="rounded-lg border border-border-light p-2 hover:bg-bg-subtle-light dark:border-border-dark dark:hover:bg-bg-subtle-dark"
              title={t('common.previous')}
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium hover:bg-bg-subtle-light dark:border-border-dark dark:hover:bg-bg-subtle-dark"
            >
              {t('teamCalendar.today')}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg border border-border-light p-2 hover:bg-bg-subtle-light dark:border-border-dark dark:hover:bg-bg-subtle-dark"
              title={t('common.next')}
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>

            <div className="ml-2 text-base font-semibold text-fg-light dark:text-fg-dark">
              {periodLabel}
            </div>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exportLoading || !calendarData}
            className="flex items-center gap-2 rounded-lg bg-primary-light px-4 py-2 text-sm font-medium text-white hover:bg-primary-light/90 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            {exportLoading ? t('common.exporting') : t('teamCalendar.exportCSV')}
          </button>
        </div>

        {/* Team Member Filter */}
        <div className="mb-6 rounded-lg border border-border-light bg-bg-light p-4 dark:border-border-dark dark:bg-bg-dark">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-fg-light dark:text-fg-dark">
              {t('teamCalendar.filterByTeamMembers')}
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-primary-light hover:underline dark:text-primary-dark"
            >
              {selectedUserIds.length === employees.length
                ? t('common.deselectAll')
                : t('common.selectAll')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {employees.map((employee) => (
              <label
                key={employee.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border-light bg-bg-subtle-light px-3 py-2 hover:bg-bg-subtle-light/50 dark:border-border-dark dark:bg-bg-subtle-dark dark:hover:bg-bg-subtle-dark/50"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(employee.id)}
                  onChange={() => handleUserToggle(employee.id)}
                  className="h-4 w-4 rounded border-border-light text-primary-light focus:ring-2 focus:ring-primary-light dark:border-border-dark dark:text-primary-dark dark:focus:ring-primary-dark"
                />
                <span className="text-sm text-fg-light dark:text-fg-dark">
                  {employee.name || employee.email}
                </span>
              </label>
            ))}
            {employees.length === 0 && (
              <p className="text-sm text-fg-muted-light dark:text-fg-muted-dark">
                {t('teamCalendar.noTeamMembers')}
              </p>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Legend */}
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border-light bg-bg-subtle-light p-3 text-xs dark:border-border-dark dark:bg-bg-subtle-dark">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-fg-light dark:text-fg-dark">{t('teamCalendar.holiday')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500"></div>
            <span className="text-fg-light dark:text-fg-dark">
              {t('teamCalendar.leavePending')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-fg-light dark:text-fg-dark">
              {t('teamCalendar.leaveApproved')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-fg-light dark:text-fg-dark">
              {t('teamCalendar.leaveRejected')}
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full rounded-lg border border-border-light dark:border-border-dark">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border-light bg-bg-subtle-light dark:border-border-dark dark:bg-bg-subtle-dark">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div
                  key={day}
                  className={`border-r border-border-light p-2 text-center text-xs font-medium uppercase text-fg-muted-light last:border-r-0 dark:border-border-dark dark:text-fg-muted-dark ${
                    index === 0 || index === 6 ? 'bg-bg-light/50 dark:bg-bg-dark/50' : ''
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {dates.map((date, index) => {
                const dayData = getDayData(date);
                const hasEvents = dayData.holidays.length > 0 || dayData.leaves.length > 0;

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(dayData)}
                    className={`min-h-[100px] border-r border-b border-border-light p-2 last:border-r-0 dark:border-border-dark ${
                      dayData.isWeekend
                        ? 'bg-bg-subtle-light/30 dark:bg-bg-subtle-dark/30'
                        : 'bg-bg-light dark:bg-bg-dark'
                    } ${
                      dayData.isToday
                        ? 'ring-2 ring-primary-light dark:ring-primary-dark'
                        : ''
                    } ${hasEvents ? 'cursor-pointer hover:bg-bg-subtle-light dark:hover:bg-bg-subtle-dark' : ''}`}
                  >
                    {/* Date number */}
                    <div
                      className={`mb-2 text-sm font-medium ${
                        dayData.isToday
                          ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-white dark:bg-primary-dark'
                          : dayData.isWeekend
                            ? 'text-fg-muted-light dark:text-fg-muted-dark'
                            : 'text-fg-light dark:text-fg-dark'
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {/* Holidays */}
                      {dayData.holidays.map((holiday) => (
                        <div
                          key={holiday.id}
                          className="truncate rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white"
                          title={holiday.name}
                        >
                          {holiday.name}
                        </div>
                      ))}

                      {/* Leaves */}
                      {dayData.leaves.slice(0, 3).map((leave) => {
                        const bgColor =
                          leave.status === 'approved'
                            ? 'bg-green-500'
                            : leave.status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-amber-500';

                        return (
                          <div
                            key={leave.id}
                            className={`truncate rounded ${bgColor} px-1.5 py-0.5 text-xs text-white`}
                            title={`${leave.user_name || 'User'} - ${leave.benefit_type_name || 'Leave'}`}
                          >
                            {leave.user_name || 'User'}
                          </div>
                        );
                      })}

                      {/* More indicator */}
                      {dayData.leaves.length > 3 && (
                        <div className="text-xs text-fg-muted-light dark:text-fg-muted-dark">
                          +{dayData.leaves.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Details Modal */}
        {dayDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-bg-light p-6 shadow-xl dark:bg-bg-dark">
              {/* Modal Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-fg-light dark:text-fg-dark">
                    {dayDetailsModal.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg p-1 hover:bg-bg-subtle-light dark:hover:bg-bg-subtle-dark"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                {/* Holidays */}
                {dayDetailsModal.holidays.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-fg-light dark:text-fg-dark">
                      {t('teamCalendar.holidays')} ({dayDetailsModal.holidays.length})
                    </h3>
                    <div className="space-y-2">
                      {dayDetailsModal.holidays.map((holiday) => (
                        <div
                          key={holiday.id}
                          className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950"
                        >
                          <div className="font-medium text-blue-900 dark:text-blue-100">
                            {holiday.name}
                          </div>
                          {holiday.is_recurring && (
                            <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                              {t('teamCalendar.recurring')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leaves */}
                {dayDetailsModal.leaves.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-fg-light dark:text-fg-dark">
                      {t('teamCalendar.teamLeave')} ({dayDetailsModal.leaves.length})
                    </h3>
                    <div className="space-y-2">
                      {dayDetailsModal.leaves.map((leave) => {
                        const borderColor =
                          leave.status === 'approved'
                            ? 'border-green-200 dark:border-green-900'
                            : leave.status === 'rejected'
                              ? 'border-red-200 dark:border-red-900'
                              : 'border-amber-200 dark:border-amber-900';

                        const bgColor =
                          leave.status === 'approved'
                            ? 'bg-green-50 dark:bg-green-950'
                            : leave.status === 'rejected'
                              ? 'bg-red-50 dark:bg-red-950'
                              : 'bg-amber-50 dark:bg-amber-950';

                        const textColor =
                          leave.status === 'approved'
                            ? 'text-green-900 dark:text-green-100'
                            : leave.status === 'rejected'
                              ? 'text-red-900 dark:text-red-100'
                              : 'text-amber-900 dark:text-amber-100';

                        return (
                          <div
                            key={leave.id}
                            className={`rounded-lg border ${borderColor} ${bgColor} p-3`}
                          >
                            <div className={`font-medium ${textColor}`}>
                              {leave.user_name || 'User'}
                            </div>
                            <div className={`mt-1 text-sm ${textColor}`}>
                              {leave.benefit_type_name || 'Leave'}
                            </div>
                            <div className={`mt-1 text-xs ${textColor}`}>
                              {new Date(leave.start_date).toLocaleDateString()} -{' '}
                              {new Date(leave.end_date).toLocaleDateString()}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  leave.status === 'approved'
                                    ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                                    : leave.status === 'rejected'
                                      ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                      : 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
                                }`}
                              >
                                {leave.status}
                              </span>
                              <span className={`text-xs ${textColor}`}>
                                {leave.total_days} {leave.unit === 'hours' ? 'hours' : 'days'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {dayDetailsModal.holidays.length === 0 && dayDetailsModal.leaves.length === 0 && (
                  <p className="text-center text-sm text-fg-muted-light dark:text-fg-muted-dark">
                    {t('teamCalendar.noEventsForDay')}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg bg-bg-subtle-light px-4 py-2 text-sm font-medium hover:bg-bg-subtle-light/80 dark:bg-bg-subtle-dark dark:hover:bg-bg-subtle-dark/80"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
