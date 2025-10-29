/**
 * TimesheetStatusBadge Component
 * Displays the current status of a timesheet with appropriate styling
 * Epic 3: Submit & Approve timesheets
 */

import { useTranslation } from 'react-i18next';
import type { TimesheetStatus } from '../../lib/api/schemas';

interface TimesheetStatusBadgeProps {
  status: TimesheetStatus;
  className?: string;
}

export default function TimesheetStatusBadge({ status, className = '' }: TimesheetStatusBadgeProps) {
  const { t } = useTranslation();

  const statusConfig = {
    draft: {
      label: t('timesheet.status.draft'),
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-300 dark:border-gray-600',
    },
    pending: {
      label: t('timesheet.status.pending'),
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      borderColor: 'border-yellow-300 dark:border-yellow-600',
    },
    approved: {
      label: t('timesheet.status.approved'),
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-300 dark:border-green-600',
    },
    rejected: {
      label: t('timesheet.status.rejected'),
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-300',
      borderColor: 'border-red-300 dark:border-red-600',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
