import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { createLeaveRequest } from '@/lib/api/services/leave-requests';
import LeaveBalanceDisplay from './LeaveBalanceDisplay';
import LeaveRequestsTable from './LeaveRequestsTable';
import LeaveRequestForm from '@/components/forms/LeaveRequestForm';
import AuthGuard from '@/components/auth/AuthGuard';
import type { CreateLeaveRequestData } from '@/lib/api/services/leave-requests';
import '@/lib/i18n';

export default function LeaveRequestsContentNew() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'employee' | 'manager'>('employee');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canApprove = permissions.includes('approve_leave_requests');

  const handleSubmit = async (data: CreateLeaveRequestData) => {
    try {
      await createLeaveRequest(data);

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('leave_requested', {
          type: data.type,
          userId: user?.id,
        });
      }

      setShowForm(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to create leave request:', error);
      throw error;
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('nav.leaveRequests')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {viewMode === 'employee'
                ? t('leaveRequest.manageYourLeave')
                : t('leaveRequest.reviewTeamRequests')}
            </p>
          </div>

          {/* View Mode Toggle (for managers) */}
          {canApprove && (
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setViewMode('employee')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'employee'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('leaveRequest.myRequests')}
              </button>
              <button
                onClick={() => setViewMode('manager')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'manager'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('leaveRequest.teamRequests')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Balance (only in employee mode) */}
            {viewMode === 'employee' && (
              <div className="lg:col-span-1">
                <LeaveBalanceDisplay key={refreshTrigger} />
              </div>
            )}

            {/* Right Column - Requests Table */}
            <div className={viewMode === 'employee' ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                {/* Action Button (only in employee mode) */}
                {viewMode === 'employee' && !showForm && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">add</span>
                      {t('leaveRequest.newRequest')}
                    </button>
                  </div>
                )}

                {/* Form Modal */}
                {showForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                        {t('leaveRequest.newRequest')}
                      </h2>
                      <LeaveRequestForm
                        onSubmit={handleSubmit}
                        onCancel={() => setShowForm(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Requests Table */}
                <LeaveRequestsTable key={refreshTrigger} mode={viewMode} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
