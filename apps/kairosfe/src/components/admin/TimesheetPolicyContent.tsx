import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { findTimesheetPolicyByTenantId, updateTimesheetPolicy } from '@/lib/api/endpoints/timesheet-policies';
import type { TimesheetPolicyDto } from '@/lib/api/schemas/auth';
import { useAuthStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

// Validation schema for timesheet policy
const timesheetPolicySchema = z.object({
  hoursPerWeek: z.number().min(1).max(168, 'Hours per week must be between 1 and 168'),
  weekStartDay: z.number().min(0).max(6, 'Week start day must be between 0 (Sunday) and 6 (Saturday)'),
  requireApproval: z.boolean(),
  allowEditAfterSubmit: z.boolean(),
});

type TimesheetPolicyFormData = z.infer<typeof timesheetPolicySchema>;

const weekDays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function TimesheetPolicyContent() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<TimesheetPolicyDto | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<TimesheetPolicyFormData>({
    resolver: zodResolver(timesheetPolicySchema),
  });

  // Get tenant ID from user context
  useEffect(() => {
    const loadTenantId = async () => {
      try {
        // Import dynamically to get tenant ID from /auth/me response
        const { apiClient } = await import('@/lib/api/client');
        const response = await apiClient.get<any>('/auth/me', true);
        const tid = response.data.tenant.id;
        setTenantId(tid);
      } catch (error) {
        console.error('Failed to get tenant ID:', error);
        toast.error('Failed to load tenant information');
      }
    };

    loadTenantId();
  }, []);

  // Load current policy
  useEffect(() => {
    if (!tenantId) return;

    const loadPolicy = async () => {
      try {
        setLoading(true);
        const response = await findTimesheetPolicyByTenantId(tenantId);
        setPolicy(response.data);

        // Reset form with loaded values
        reset({
          hoursPerWeek: response.data.hoursPerWeek,
          weekStartDay: response.data.weekStartDay,
          requireApproval: response.data.requireApproval,
          allowEditAfterSubmit: response.data.allowEditAfterSubmit,
        });
      } catch (error) {
        console.error('Failed to load timesheet policy:', error);
        toast.error('Failed to load timesheet policy');

        // Set default values if policy doesn't exist
        reset({
          hoursPerWeek: 40,
          weekStartDay: 1, // Monday
          requireApproval: true,
          allowEditAfterSubmit: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [tenantId, reset]);

  const onSubmit = async (data: TimesheetPolicyFormData) => {
    if (!tenantId) {
      toast.error('Tenant ID not available');
      return;
    }

    try {
      setSaving(true);
      const response = await updateTimesheetPolicy(tenantId, data);
      setPolicy(response.data);

      // Reset form to mark as not dirty
      reset(data);

      toast.success('Timesheet policy updated successfully');
    } catch (error) {
      console.error('Failed to update timesheet policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update timesheet policy');

      // Send to Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'timesheet_policy_update_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="material-symbols-outlined animate-spin text-4xl text-primary-light dark:text-primary-dark">
            progress_activity
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Timesheet Policy
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure timesheet policy settings for your organization
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Hours Per Week */}
        <div>
          <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Standard Hours Per Week
          </label>
          <input
            type="number"
            id="hoursPerWeek"
            {...register('hoursPerWeek', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="40"
          />
          {errors.hoursPerWeek && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.hoursPerWeek.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The expected number of working hours per week (e.g., 40)
          </p>
        </div>

        {/* Week Start Day */}
        <div>
          <label htmlFor="weekStartDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Week Start Day
          </label>
          <select
            id="weekStartDay"
            {...register('weekStartDay', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {weekDays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          {errors.weekStartDay && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.weekStartDay.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The first day of the working week for timesheets
          </p>
        </div>

        {/* Require Approval */}
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="requireApproval"
              type="checkbox"
              {...register('requireApproval')}
              className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="requireApproval" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Require Manager Approval
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Timesheets must be approved by a manager before they are finalized
            </p>
          </div>
        </div>

        {/* Allow Edit After Submit */}
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="allowEditAfterSubmit"
              type="checkbox"
              {...register('allowEditAfterSubmit')}
              className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="allowEditAfterSubmit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Allow Editing After Submission
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Employees can edit their timesheets after submitting for approval
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-light/90 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin mr-2 text-sm">
                  progress_activity
                </span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-sm">
                  save
                </span>
                Save Changes
              </>
            )}
          </button>

          {isDirty && (
            <button
              type="button"
              onClick={() => reset()}
              disabled={saving}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="material-symbols-outlined mr-2 text-sm">
                undo
              </span>
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Current Policy Info */}
      {policy && (
        <div className="mt-8 max-w-2xl rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Current Policy Information
          </h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Tenant ID:</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100">{policy.tenantId}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
