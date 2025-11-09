import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { employeesService } from '@/lib/api/services/employees';
import { showToast } from '@/lib/utils/toast';
import AsyncCombobox from '@/components/ui/AsyncCombobox';
import type { UserRole } from '@kairos/shared';
import '@/lib/i18n';

// Form validation schema
const addEmployeeSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'employee'] as const, {
    required_error: 'Role is required',
  }),
  jobTitle: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().or(z.literal('')),
  managerId: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').optional().or(z.literal('')),
  sendInvite: z.boolean().default(true),
});

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      sendInvite: true,
      managerId: '',
    },
  });

  const onSubmit = async (data: AddEmployeeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await employeesService.create({
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        jobTitle: data.jobTitle || undefined,
        startDate: data.startDate || undefined,
        managerId: data.managerId || undefined,
        location: data.location || undefined,
        phone: data.phone || undefined,
        sendInvite: data.sendInvite,
      });

      // Success - show toast
      if (data.sendInvite) {
        showToast.success(t('employees.success.createdInvite', { email: data.email }));
      } else {
        showToast.success(t('employees.success.created'));
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create employee:', err);

      // Handle specific error codes
      if (typeof err === 'object' && err !== null && 'statusCode' in err) {
        const apiError = err as { statusCode: number; message?: string };
        if (apiError.statusCode === 409 || apiError.message?.includes('already exists')) {
          setError(t('employees.errors.emailExists'));
        } else if (apiError.statusCode === 403) {
          setError(t('employees.errors.createFailed') + ' - Permission denied');
        } else {
          setError(t('employees.errors.createFailed'));
        }
      } else if (err instanceof Error && err.message?.includes('already exists')) {
        setError(t('employees.errors.emailExists'));
      } else {
        setError(t('employees.errors.createFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Employee
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Invite a new team member to your organization
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="employee@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">Select role</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role.message}</p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title
              </label>
              <input
                type="text"
                {...register('jobTitle')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Software Engineer"
                disabled={isSubmitting}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate.message}</p>
              )}
            </div>

            {/* Manager */}
            <div>
              <Controller
                name="managerId"
                control={control}
                render={({ field }) => (
                  <AsyncCombobox
                    label={t('employees.fields.manager')}
                    placeholder={t('employees.fields.managerPlaceholder')}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onSearch={async (query) => {
                      const managers = await employeesService.searchManagers(query);
                      return managers;
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="New York, NY"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+1-555-0123"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Send Invite Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('sendInvite')}
                id="sendInvite"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="sendInvite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Send invitation email
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
