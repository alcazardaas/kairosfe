import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { holidaysService, type CreateHolidayDto, type UpdateHolidayDto } from '@/lib/api/services/holidays';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import type { HolidayDto } from '@/lib/api/schemas/holidays';

// Validation schema for holiday form
const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required'),
  is_recurring: z.boolean(),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

export default function HolidaysManagementContent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<HolidayDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterRecurring, setFilterRecurring] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayDto | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
  });

  // Load holidays on mount
  useEffect(() => {
    loadHolidays();
  }, []);

  // Filter holidays when search or filters change
  useEffect(() => {
    filterHolidays();
  }, [searchQuery, filterYear, filterRecurring, holidays]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidaysService.getAll();
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast.error('Failed to load holidays');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'holidays_load_failure' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get available years from holidays
  const getAvailableYears = (): number[] => {
    const years = new Set<number>();
    holidays.forEach((holiday) => {
      const year = new Date(holiday.date).getFullYear();
      if (!isNaN(year)) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Descending order
  };

  const filterHolidays = () => {
    let filtered = [...holidays];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((h) => h.name.toLowerCase().includes(query));
    }

    // Apply year filter
    if (filterYear && filterYear !== 'all') {
      filtered = filtered.filter((h) => {
        const year = new Date(h.date).getFullYear();
        return year.toString() === filterYear;
      });
    }

    // Apply recurring filter
    if (filterRecurring === 'recurring') {
      filtered = filtered.filter((h) => h.is_recurring);
    } else if (filterRecurring === 'one-time') {
      filtered = filtered.filter((h) => !h.is_recurring);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredHolidays(filtered);
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    reset({
      name: '',
      date: today,
      is_recurring: false,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (holiday: HolidayDto) => {
    setSelectedHoliday(holiday);
    // Format date for input (YYYY-MM-DD)
    const formattedDate = holiday.date.split('T')[0];
    reset({
      name: holiday.name,
      date: formattedDate,
      is_recurring: holiday.is_recurring,
    });
    setIsEditModalOpen(true);
  };

  const onCreateSubmit = async (data: HolidayFormData) => {
    try {
      setSaving(true);
      const createData: CreateHolidayDto = {
        name: data.name,
        date: data.date,
        is_recurring: data.is_recurring,
      };

      await holidaysService.create(createData);
      toast.success('Holiday created successfully');
      setIsCreateModalOpen(false);
      await loadHolidays();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('holiday_created');
      }
    } catch (error) {
      console.error('Failed to create holiday:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create holiday');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'holiday_create_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onEditSubmit = async (data: HolidayFormData) => {
    if (!selectedHoliday) return;

    try {
      setSaving(true);
      const updateData: UpdateHolidayDto = {
        name: data.name,
        date: data.date,
        is_recurring: data.is_recurring,
      };

      await holidaysService.update(selectedHoliday.id, updateData);
      toast.success('Holiday updated successfully');
      setIsEditModalOpen(false);
      setSelectedHoliday(null);
      await loadHolidays();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('holiday_updated');
      }
    } catch (error) {
      console.error('Failed to update holiday:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update holiday');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'holiday_update_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday: HolidayDto) => {
    if (!confirm(`Are you sure you want to delete holiday "${holiday.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await holidaysService.delete(holiday.id);
      toast.success('Holiday deleted successfully');
      await loadHolidays();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('holiday_deleted');
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete holiday');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'holiday_delete_failure' },
        });
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format date for short display (MMM DD)
  const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="material-symbols-outlined animate-spin text-4xl text-primary-light dark:text-primary-dark">
            progress_activity
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading holidays...</p>
        </div>
      </div>
    );
  }

  const availableYears = getAvailableYears();

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Holidays Administration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage organization holidays and recurring events
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-light/90 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
        >
          <span className="material-symbols-outlined mr-2 text-sm">add</span>
          Create Holiday
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search holidays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="year-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Year:
            </label>
            <select
              id="year-filter"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Recurring Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="recurring-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type:
            </label>
            <select
              id="recurring-filter"
              value={filterRecurring}
              onChange={(e) => setFilterRecurring(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="recurring">Recurring</option>
              <option value="one-time">One-Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Holidays Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Holiday Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-gray-400">
                        event
                      </span>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery || filterYear !== 'all' || filterRecurring !== 'all'
                          ? 'No holidays found matching your filters'
                          : 'No holidays yet. Create your first holiday to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((holiday) => {
                  const holidayDate = new Date(holiday.date);
                  const isUpcoming = holidayDate > new Date();

                  return (
                    <tr
                      key={holiday.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary-light/10 dark:bg-primary-dark/10">
                            <span className="text-xs font-medium text-primary-light dark:text-primary-dark">
                              {holidayDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </span>
                            <span className="text-lg font-bold text-primary-light dark:text-primary-dark">
                              {holidayDate.getDate()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {holidayDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {holidayDate.getFullYear()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {holiday.name}
                          </span>
                          {isUpcoming && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            holiday.is_recurring
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {holiday.is_recurring ? (
                            <>
                              <span className="material-symbols-outlined mr-1 text-xs">
                                repeat
                              </span>
                              Recurring
                            </>
                          ) : (
                            'One-Time'
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(holiday)}
                            className="inline-flex items-center text-primary-light hover:text-primary-light/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
                            title="Edit holiday"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(holiday)}
                            className="inline-flex items-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete holiday"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Create New Holiday
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Holiday Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="create-name"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="New Year's Day"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="create-date"
                  {...register('date')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create-recurring"
                  {...register('is_recurring')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="create-recurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Recurring (same date every year)
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If checked, this holiday will automatically apply to the same date in future years.
              </p>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light/90 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin mr-2 text-sm">
                        progress_activity
                      </span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined mr-2 text-sm">add</span>
                      Create Holiday
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Holiday
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedHoliday(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Holiday Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="edit-date"
                  {...register('date')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-recurring"
                  {...register('is_recurring')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="edit-recurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Recurring (same date every year)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedHoliday(null);
                  }}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light/90 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
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
                      <span className="material-symbols-outlined mr-2 text-sm">save</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
