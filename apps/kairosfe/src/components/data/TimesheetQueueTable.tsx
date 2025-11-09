import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import {
  getTimesheets,
  approveTimesheet,
  rejectTimesheet,
} from '@/lib/api/services/timesheets';
import TimesheetDetailModal from './TimesheetDetailModal';
import type { Timesheet } from '@kairos/shared';
import { showToast } from '@/lib/utils/toast';
import '@/lib/i18n';

export default function TimesheetQueueTable() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = permissions.includes('approve_timesheets');

  useEffect(() => {
    loadPendingTimesheets();
  }, []);

  const loadPendingTimesheets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // In a real app, this would filter by manager's team
      // For now, we'll get all pending timesheets
      const allTimesheets = await getTimesheets({ status: 'pending' });
      setTimesheets(allTimesheets);
    } catch (error) {
      console.error('Failed to load pending timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timesheetId: string) => {
    if (!confirm(t('timesheet.confirmApprove'))) return;

    try {
      await approveTimesheet(timesheetId);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('timesheet_approved', {
          timesheetId,
          managerId: user?.id,
        });
      }

      // Remove from list (optimistic update)
      setTimesheets((prev) => prev.filter((ts) => ts.id !== timesheetId));
      setSelectedTimesheet(null);
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      // Reload on error
      loadPendingTimesheets();
    }
  };

  const handleRejectClick = (timesheetId: string) => {
    setRejectingId(timesheetId);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) {
      showToast.error(t('timesheet.rejectionReasonRequired'));
      return;
    }

    try {
      await rejectTimesheet(rejectingId, rejectionReason);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('timesheet_rejected', {
          timesheetId: rejectingId,
          managerId: user?.id,
        });
      }

      // Remove from list (optimistic update)
      setTimesheets((prev) => prev.filter((ts) => ts.id !== rejectingId));
      setRejectingId(null);
      setRejectionReason('');
      setSelectedTimesheet(null);
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
      // Reload on error
      loadPendingTimesheets();
    }
  };

  if (!canApprove) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          {t('timesheet.noPermissionToApprove')}
        </p>
      </div>
    );
  }

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

  if (timesheets.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
          check_circle
        </span>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('timesheet.noPendingTimesheets')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('timesheet.allTimesheetsReviewed')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('timesheet.employee')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('timesheet.week')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('timesheet.totalHours')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('timesheet.submitted')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {timesheets.map((timesheet) => (
              <tr key={timesheet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('timesheet.employeeId')}: {timesheet.userId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(timesheet.weekStart).toLocaleDateString()} -{' '}
                    {new Date(timesheet.weekEnd).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {timesheet.totalHours}h
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {timesheet.submittedAt
                      ? new Date(timesheet.submittedAt).toLocaleDateString()
                      : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedTimesheet(timesheet.id)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                  >
                    {t('timesheet.view')}
                  </button>
                  <button
                    onClick={() => handleApprove(timesheet.id)}
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                  >
                    {t('timesheet.approve')}
                  </button>
                  <button
                    onClick={() => handleRejectClick(timesheet.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t('timesheet.reject')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedTimesheet && (
        <TimesheetDetailModal
          timesheetId={selectedTimesheet}
          onClose={() => setSelectedTimesheet(null)}
          onApprove={() => handleApprove(selectedTimesheet)}
          onReject={() => handleRejectClick(selectedTimesheet)}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('timesheet.rejectTimesheet')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('timesheet.provideRejectionReason')}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              placeholder={t('timesheet.rejectionReasonPlaceholder')}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {t('timesheet.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
