import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import {
  getLeaveRequests,
  cancelLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '@/lib/api/services/leave-requests';
import type { LeaveRequest } from '@kairos/shared';
import { showToast } from '@/lib/utils/toast';
import '@/lib/i18n';

interface LeaveRequestsTableProps {
  mode?: 'employee' | 'manager';
}

export default function LeaveRequestsTable({ mode = 'employee' }: LeaveRequestsTableProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = permissions.includes('approve_leave_requests');
  const isManagerMode = mode === 'manager' && canApprove;

  useEffect(() => {
    loadRequests();
  }, [mode]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const params = isManagerMode ? { team: true } : { mine: true };
      const data = await getLeaveRequests(params);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t('leaveRequest.confirmCancel'))) return;

    try {
      await cancelLeaveRequest(id);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('leave_cancelled', {
          requestId: id,
          userId: user?.id,
        });
      }

      // Update local state
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: 'cancelled' as const } : req))
      );
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
      loadRequests();
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

      // Remove from list or update status
      if (isManagerMode) {
        setRequests((prev) => prev.filter((req) => req.id !== id));
      } else {
        loadRequests();
      }
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

      // Remove from list or update status
      if (isManagerMode) {
        setRequests((prev) => prev.filter((req) => req.id !== rejectingId));
      } else {
        loadRequests();
      }

      setRejectingId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      loadRequests();
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}
      >
        {t(`leaveRequest.status.${status}`)}
      </span>
    );
  };

  const getLeaveTypeLabel = (type: LeaveRequest['type']) => {
    return t(`leaveRequest.types.${type}`);
  };

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

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
          calendar_month
        </span>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {isManagerMode
            ? t('leaveRequest.noPendingRequests')
            : t('leaveRequest.noRequests')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isManagerMode
            ? t('leaveRequest.allRequestsReviewed')
            : t('leaveRequest.createFirstRequest')}
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
              {isManagerMode && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('leaveRequest.employee')}
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('leaveRequest.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('leaveRequest.dates')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('leaveRequest.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('leaveRequest.reason')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {isManagerMode && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {request.userName || request.userId}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {getLeaveTypeLabel(request.type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(request.startDate).toLocaleDateString()} -{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {request.reason || '-'}
                  </div>
                  {request.rejectionReason && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t('leaveRequest.rejected')}: {request.rejectionReason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Employee actions */}
                  {!isManagerMode && request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {t('common.cancel')}
                    </button>
                  )}

                  {/* Manager actions */}
                  {isManagerMode && request.status === 'pending' && (
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        {t('leaveRequest.approve')}
                      </button>
                      <button
                        onClick={() => handleRejectClick(request.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {t('leaveRequest.reject')}
                      </button>
                    </div>
                  )}

                  {request.status !== 'pending' && !isManagerMode && (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </>
  );
}
