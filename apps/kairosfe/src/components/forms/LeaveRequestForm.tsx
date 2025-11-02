import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { calculateBusinessDays } from '@/lib/api/services/leave-requests';
import { checkDateOverlap, type OverlapCheck } from '@/lib/api/services/calendar';
import { useAuthStore } from '@/lib/store';
import { findAllBenefitTypes } from '@/lib/api/endpoints/benefit-types';
import type { BenefitTypeDto } from '@/lib/api/schemas/benefits';
import '@/lib/i18n';

const leaveRequestSchema = z.object({
  benefitTypeId: z.string().uuid('Please select a leave type'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestFormProps {
  onSubmit: (data: LeaveRequestFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<LeaveRequestFormData>;
  isEditing?: boolean;
}

export default function LeaveRequestForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: LeaveRequestFormProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [overlapCheck, setOverlapCheck] = useState<OverlapCheck | null>(null);
  const [checkingOverlap, setCheckingOverlap] = useState(false);
  const [benefitTypes, setBenefitTypes] = useState<BenefitTypeDto[]>([]);
  const [loadingBenefitTypes, setLoadingBenefitTypes] = useState(true);
  const [benefitTypesError, setBenefitTypesError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: initialData || {
      benefitTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const businessDays =
    startDate && endDate && new Date(endDate) >= new Date(startDate)
      ? calculateBusinessDays(startDate, endDate)
      : 0;

  // Fetch benefit types on mount
  useEffect(() => {
    loadBenefitTypes();
  }, []);

  const loadBenefitTypes = async () => {
    try {
      setLoadingBenefitTypes(true);
      setBenefitTypesError(null);
      const response = await findAllBenefitTypes();
      setBenefitTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load benefit types:', error);
      setBenefitTypesError('Failed to load leave types');
    } finally {
      setLoadingBenefitTypes(false);
    }
  };

  // Check for overlaps when dates change
  useEffect(() => {
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      checkOverlaps();
    } else {
      setOverlapCheck(null);
    }
  }, [startDate, endDate]);

  const checkOverlaps = async () => {
    try {
      setCheckingOverlap(true);
      const result = await checkDateOverlap(startDate, endDate, user?.id);
      setOverlapCheck(result);

      // Track event if there's an overlap
      if (result.hasOverlap && typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('pto_overlap_warned', {
          userId: user?.id,
          holidaysCount: result.holidays.length,
          leavesCount: result.leaves.length,
        });
      }
    } catch (error) {
      console.error('Failed to check date overlap:', error);
    } finally {
      setCheckingOverlap(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Leave Type */}
      <div>
        <label
          htmlFor="benefitTypeId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('leaveRequest.leaveType')}
        </label>

        {loadingBenefitTypes ? (
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {t('common.loading')}...
          </div>
        ) : benefitTypesError ? (
          <div className="space-y-2">
            <div className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {benefitTypesError}
            </div>
            <button
              type="button"
              onClick={loadBenefitTypes}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <select
            id="benefitTypeId"
            {...register('benefitTypeId')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a leave type...</option>
            {benefitTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        )}

        {errors.benefitTypeId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.benefitTypeId.message}
          </p>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('leaveRequest.startDate')}
        </label>
        <input
          type="date"
          id="startDate"
          {...register('startDate')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
        {errors.startDate && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.startDate.message}
          </p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label
          htmlFor="endDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('leaveRequest.endDate')}
        </label>
        <input
          type="date"
          id="endDate"
          {...register('endDate')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
        {errors.endDate && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.endDate.message}
          </p>
        )}
      </div>

      {/* Business Days Display */}
      {businessDays > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {t('leaveRequest.businessDays', { count: businessDays })}
          </p>
        </div>
      )}

      {/* Overlap Warning */}
      {checkingOverlap && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('calendar.checkingOverlap')}...
          </p>
        </div>
      )}

      {overlapCheck && overlapCheck.hasOverlap && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl">
              warning
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                {t('calendar.overlapDetected')}
              </h4>

              {overlapCheck.holidays.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    {t('calendar.holidays')}:
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                    {overlapCheck.holidays.map((holiday) => (
                      <li key={holiday.id}>
                        • {holiday.name} ({new Date(holiday.date).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {overlapCheck.leaves.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    {t('calendar.teamMembersOut', { count: overlapCheck.leaves.length })}
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                    {overlapCheck.leaves.slice(0, 3).map((leave, idx) => (
                      <li key={idx}>
                        • {leave.userName} ({new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()})
                      </li>
                    ))}
                    {overlapCheck.leaves.length > 3 && (
                      <li>• {t('calendar.andMore', { count: overlapCheck.leaves.length - 3 })}</li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                {t('calendar.overlapWarningNote')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reason */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('leaveRequest.reason')}{' '}
          <span className="text-gray-500 dark:text-gray-400">
            ({t('common.optional')})
          </span>
        </label>
        <textarea
          id="reason"
          {...register('reason')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          placeholder={t('leaveRequest.reasonPlaceholder')}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.reason.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? t('common.saving')
            : isEditing
              ? t('common.save')
              : t('leaveRequest.submitRequest')}
        </button>
      </div>
    </form>
  );
}
