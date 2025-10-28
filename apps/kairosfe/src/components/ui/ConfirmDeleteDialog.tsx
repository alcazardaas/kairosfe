import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { employeesService } from '@/lib/api/services/employees';
import { showToast } from '@/lib/utils/toast';
import type { Employee } from '@kairos/shared';
import '@/lib/i18n';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmDeleteDialog({
  isOpen,
  employee,
  onClose,
  onSuccess,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!employee) return;

    try {
      setIsDeleting(true);
      setError(null);

      await employeesService.deactivate(employee.id);

      // Success - show toast
      showToast.success(t('employees.success.deleted'));
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to deactivate employee:', err);

      // Handle specific error codes
      if (err.statusCode === 403) {
        setError(t('employees.errors.deleteFailed') + ' - Permission denied');
      } else if (err.statusCode === 404) {
        setError(t('employees.errors.notFound'));
      } else {
        setError(t('employees.errors.deleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Deactivate Employee
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to deactivate <strong>{employee.name || employee.email}</strong>?
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex">
              <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 mr-2">
                warning
              </span>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Warning
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  They will lose access to the system immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Email:</strong> {employee.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <strong>Role:</strong> {employee.membership.role}
            </p>
            {employee.profile?.jobTitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                <strong>Job Title:</strong> {employee.profile.jobTitle}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            {isDeleting ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}
