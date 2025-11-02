import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { organizationService, type OrganizationData } from '@/lib/api/services/organization';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

// Validation schema for organization settings
const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
  country: z.string().length(2, 'Must be a 2-letter country code'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

// Common timezones list
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Madrid' },
  { value: 'Europe/Lisbon', label: 'Lisbon' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'UTC', label: 'UTC' },
];

// Common countries list (can be expanded)
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'PT', label: 'Portugal' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'AU', label: 'Australia' },
];

export default function OrganizationSettingsContent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  // Load organization settings
  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationService.get();
      setOrganization(response.data);

      // Reset form with loaded values
      reset({
        name: response.data.name,
        phone: response.data.phone || '',
        address: response.data.address || '',
        logoUrl: response.data.logoUrl || '',
        timezone: response.data.timezone,
        country: response.data.country,
      });
    } catch (error) {
      console.error('Failed to load organization settings:', error);
      toast.error('Failed to load organization settings');

      // Send to Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'organization_load_failure' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      setSaving(true);

      // Convert empty strings to null for optional fields
      const updateData = {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        logoUrl: data.logoUrl || null,
        timezone: data.timezone,
        country: data.country,
      };

      const response = await organizationService.update(updateData);
      setOrganization(response.data);

      // Reset form to mark as not dirty
      reset(data);

      toast.success('Organization settings updated successfully');

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('organization_settings_updated', {
          organizationId: response.data.id,
        });
      }
    } catch (error) {
      console.error('Failed to update organization settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update organization settings');

      // Send to Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'organization_update_failure' },
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Organization Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your organization's information and preferences
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Organization Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Acme Corporation"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            {...register('phone')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address
          </label>
          <textarea
            id="address"
            {...register('address')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="123 Main Street, Suite 100, City, State 12345"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Logo URL
          </label>
          <input
            type="url"
            id="logoUrl"
            {...register('logoUrl')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="https://example.com/logo.png"
          />
          {errors.logoUrl && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.logoUrl.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload your logo to a CDN or image hosting service, then paste the URL here
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Timezone <span className="text-red-500">*</span>
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.timezone.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This affects how dates and times are displayed throughout the application
          </p>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            {...register('country')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.country.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Used for holiday calendars and regional settings
          </p>
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

      {/* Organization Info Card */}
      {organization && (
        <div className="mt-8 max-w-2xl rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Organization Information
          </h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Organization ID:</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100">{organization.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Created:</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(organization.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Last Updated:</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(organization.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
