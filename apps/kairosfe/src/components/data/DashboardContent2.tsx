import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { getWeeklyStats, getProjectStats, getTimesheets } from '@/lib/api/services/timesheets';
import { getLeaveRequests } from '@/lib/api/services/leave-requests';
import { getHolidays } from '@/lib/api/services/calendar';
import AuthGuard from '@/components/auth/AuthGuard';
import type { WeeklyStats, ProjectStats, Holiday } from '@kairos/shared';
import '@/lib/i18n';

export default function DashboardContent2() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [pendingTimesheetsCount, setPendingTimesheetsCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const canApproveTimesheets = permissions.includes('approve_timesheets');
  const canApproveLeave = permissions.includes('approve_leave_requests');

  useEffect(() => {
    loadDashboardData();

    // Track page view
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('dashboard_viewed', {
        userId: user?.id,
      });
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const promises: Promise<any>[] = [
        getWeeklyStats({ userId: user.id }),
        getProjectStats({ userId: user.id }),
        getHolidays(new Date().getFullYear()),
      ];

      // Add manager-only data
      if (canApproveTimesheets) {
        promises.push(
          getTimesheets({ team: true, status: 'pending' }).then((ts) => ts.length)
        );
      }

      if (canApproveLeave) {
        promises.push(
          getLeaveRequests({ team: true, status: 'pending' }).then((lr) => lr.length)
        );
      }

      const results = await Promise.all(promises);

      setWeeklyStats(results[0] as WeeklyStats);
      setProjectStats(results[1] as ProjectStats[]);
      setHolidays(results[2] as Holiday[]);

      if (canApproveTimesheets) {
        setPendingTimesheetsCount(results[3] as number);
      }

      if (canApproveLeave) {
        const leaveIndex = canApproveTimesheets ? 4 : 3;
        setPendingLeaveCount(results[leaveIndex] as number);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const topProjects = projectStats.slice(0, 5);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-8">
          <div className="container mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('dashboard.welcome', { name: user?.name })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('dashboard.overview')}
            </p>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* This Week Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('dashboard.thisWeekHours')}
                </h2>
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">
                  schedule
                </span>
              </div>

              {weeklyStats && weeklyStats.totalHours > 0 ? (
                <>
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {weeklyStats.totalHours.toFixed(1)}h
                  </div>

                  {/* Simple bar chart */}
                  <div className="space-y-2">
                    {Object.entries(weeklyStats.hoursPerDay)
                      .slice(-7)
                      .map(([date, hours]) => (
                        <div key={date} className="flex items-center gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 w-12">
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min((hours / 8) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">
                            {hours}h
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl mb-2">
                    event_busy
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('dashboard.noHoursThisWeek')}
                  </p>
                </div>
              )}
            </div>

            {/* By Project */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('dashboard.byProject')}
                </h2>
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
                  pie_chart
                </span>
              </div>

              {topProjects.length > 0 ? (
                <div className="space-y-3">
                  {topProjects.map((project, index) => (
                    <div key={project.projectId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {project.projectName}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">
                          {project.totalHours}h
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0
                              ? 'bg-blue-600'
                              : index === 1
                                ? 'bg-green-600'
                                : index === 2
                                  ? 'bg-purple-600'
                                  : index === 3
                                    ? 'bg-orange-600'
                                    : 'bg-pink-600'
                          }`}
                          style={{ width: `${project.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl mb-2">
                    folder_off
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('dashboard.noProjectData')}
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Holidays */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('dashboard.upcomingHolidays')}
                </h2>
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">
                  celebration
                </span>
              </div>

              {upcomingHolidays.length > 0 ? (
                <div className="space-y-3">
                  {upcomingHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {new Date(holiday.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(holiday.date).toLocaleDateString(undefined, { month: 'short' })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {holiday.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {holiday.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl mb-2">
                    event_available
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('dashboard.noUpcomingHolidays')}
                  </p>
                </div>
              )}
            </div>

            {/* Manager: Pending Timesheets */}
            {canApproveTimesheets && (
              <a
                href="/team-timesheets"
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('dashboard.pendingTimesheets')}
                  </h2>
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-3xl">
                    pending_actions
                  </span>
                </div>
                <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {pendingTimesheetsCount}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.awaitingReview')} →
                </p>
              </a>
            )}

            {/* Manager: Pending Leave Requests */}
            {canApproveLeave && (
              <a
                href="/team-leave"
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('dashboard.pendingLeaveRequests')}
                  </h2>
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-3xl">
                    event_note
                  </span>
                </div>
                <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {pendingLeaveCount}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.awaitingApproval')} →
                </p>
              </a>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
