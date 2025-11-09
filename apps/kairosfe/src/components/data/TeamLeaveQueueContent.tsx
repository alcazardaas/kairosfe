import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  calculateBusinessDays,
} from '@/lib/api/services/leave-requests';
import AuthGuard from '@/components/auth/AuthGuard';
import type { LeaveRequest } from '@kairos/shared';
import { showToast } from '@/lib/utils/toast';
import '@/lib/i18n';

export default function TeamLeaveQueueContent() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = permissions.includes('approve_leave_requests');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getLeaveRequests({ team: true, status: 'pending' });
      setRequests(data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm(t('leaveRequest.confirmApprove'))) return;

    try {
      await approveLeaveRequest(id);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('leave_approved', {
          requestId: id,
          managerId: user?.id,
        });
      }

      // Remove from queue
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error('Failed to approve leave request:', error);
      loadRequests();
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) {
      showToast.error(t('leaveRequest.rejectionReasonRequired'));
      return;
    }

    try {
      await rejectLeaveRequest(rejectingId, rejectionReason);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('leave_rejected', {
          requestId: rejectingId,
          managerId: user?.id,
        });
      }

      // Remove from queue
      setRequests((prev) => prev.filter((req) => req.id !== rejectingId));

      setRejectingId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      loadRequests();
    }
  };

  const getLeaveTypeLabel = (type: LeaveRequest['type']) => {
    return t(`leaveRequest.types.${type}`);
  };

  if (!canApprove) {
    return (
      <AuthGuard>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
              block
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('leaveRequest.noPermissionToApprove')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('leaveRequest.managerAccessRequired')}
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('leaveRequest.teamLeaveQueue')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('leaveRequest.reviewPendingRequests')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-yellow-600 dark:text-yellow-400">
                  pending_actions
                </span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('leaveRequest.pendingRequests')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {requests.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
                  task_alt
                </span>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('leaveRequest.noPendingRequests')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('leaveRequest.allRequestsReviewed')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('leaveRequest.employee')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('leaveRequest.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('leaveRequest.dates')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('leaveRequest.duration')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('leaveRequest.reason')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('leaveRequest.requestedAt')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {requests.map((request) => {
                      const businessDays = calculateBusinessDays(
                        request.startDate,
                        request.endDate
                      );

                      return (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {request.userName || request.userEmail || request.userId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {getLeaveTypeLabel(request.type)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {new Date(request.startDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('common.to')} {new Date(request.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {businessDays} {t(`common.unit.${businessDays === 1 ? 'day' : 'days'}`)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {request.reason || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium"
                              >
                                {t('leaveRequest.approve')}
                              </button>
                              <button
                                onClick={() => handleRejectClick(request.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                              >
                                {t('leaveRequest.reject')}
                              </button>
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
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('leaveRequest.rejectRequest')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('leaveRequest.provideRejectionReason')}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              placeholder={t('leaveRequest.rejectionReasonPlaceholder')}
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
                {t('leaveRequest.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
