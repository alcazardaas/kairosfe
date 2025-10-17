import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { LeaveType } from '@kairos/shared';
import { calculateBusinessDays } from '@/lib/api/services/leave-requests';
import '@/lib/i18n';

const leaveRequestSchema = z.object({
  type: z.enum(['vacation', 'sick', 'personal', 'bereavement', 'parental', 'other']),
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
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: initialData || {
      type: 'vacation',
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

  const leaveTypes: { value: LeaveType; labelKey: string }[] = [
    { value: 'vacation', labelKey: 'leaveRequest.types.vacation' },
    { value: 'sick', labelKey: 'leaveRequest.types.sick' },
    { value: 'personal', labelKey: 'leaveRequest.types.personal' },
    { value: 'bereavement', labelKey: 'leaveRequest.types.bereavement' },
    { value: 'parental', labelKey: 'leaveRequest.types.parental' },
    { value: 'other', labelKey: 'leaveRequest.types.other' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Leave Type */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('leaveRequest.leaveType')}
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          {leaveTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {t(type.labelKey)}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.type.message}
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
