import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { benefitTypesService, type CreateBenefitTypeDto, type UpdateBenefitTypeDto } from '@/lib/api/services/benefit-types';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import type { BenefitTypeDto } from '@/lib/api/schemas/benefits';
import type { Unit } from '@/lib/api/schemas/common';

// Validation schema for benefit type form
const benefitTypeSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_-]+$/, 'Key must be lowercase alphanumeric with hyphens/underscores'),
  name: z.string().min(1, 'Name is required'),
  unit: z.enum(['days', 'hours']),
  requires_approval: z.boolean(),
});

type BenefitTypeFormData = z.infer<typeof benefitTypeSchema>;

export default function BenefitTypesManagementContent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [benefitTypes, setBenefitTypes] = useState<BenefitTypeDto[]>([]);
  const [filteredBenefitTypes, setFilteredBenefitTypes] = useState<BenefitTypeDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitTypeDto | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BenefitTypeFormData>({
    resolver: zodResolver(benefitTypeSchema),
  });

  // Load benefit types on mount
  useEffect(() => {
    loadBenefitTypes();
  }, []);

  // Filter benefit types when search or filters change
  useEffect(() => {
    filterBenefitTypes();
  }, [searchQuery, filterUnit, benefitTypes]);

  const loadBenefitTypes = async () => {
    try {
      setLoading(true);
      const response = await benefitTypesService.getAll();
      setBenefitTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load benefit types:', error);
      toast.error('Failed to load benefit types');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'benefit_types_load_failure' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterBenefitTypes = () => {
    let filtered = [...benefitTypes];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bt) =>
          bt.name.toLowerCase().includes(query) ||
          bt.key.toLowerCase().includes(query)
      );
    }

    // Apply unit filter
    if (filterUnit && filterUnit !== 'all') {
      filtered = filtered.filter((bt) => bt.unit === filterUnit);
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredBenefitTypes(filtered);
  };

  const openCreateModal = () => {
    reset({
      key: '',
      name: '',
      unit: 'days',
      requires_approval: true,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (benefitType: BenefitTypeDto) => {
    setSelectedBenefitType(benefitType);
    reset({
      key: benefitType.key,
      name: benefitType.name,
      unit: benefitType.unit,
      requires_approval: benefitType.requires_approval,
    });
    setIsEditModalOpen(true);
  };

  const onCreateSubmit = async (data: BenefitTypeFormData) => {
    try {
      setSaving(true);
      const createData: CreateBenefitTypeDto = {
        key: data.key,
        name: data.name,
        unit: data.unit,
        requires_approval: data.requires_approval,
      };

      await benefitTypesService.create(createData);
      toast.success('Benefit type created successfully');
      setIsCreateModalOpen(false);
      await loadBenefitTypes();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('benefit_type_created');
      }
    } catch (error) {
      console.error('Failed to create benefit type:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create benefit type');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'benefit_type_create_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onEditSubmit = async (data: BenefitTypeFormData) => {
    if (!selectedBenefitType) return;

    try {
      setSaving(true);
      const updateData: UpdateBenefitTypeDto = {
        key: data.key,
        name: data.name,
        unit: data.unit,
        requires_approval: data.requires_approval,
      };

      await benefitTypesService.update(selectedBenefitType.id, updateData);
      toast.success('Benefit type updated successfully');
      setIsEditModalOpen(false);
      setSelectedBenefitType(null);
      await loadBenefitTypes();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('benefit_type_updated');
      }
    } catch (error) {
      console.error('Failed to update benefit type:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update benefit type');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'benefit_type_update_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (benefitType: BenefitTypeDto) => {
    if (!confirm(`Are you sure you want to delete benefit type "${benefitType.name}"? This action cannot be undone and may affect existing leave balances.`)) {
      return;
    }

    try {
      await benefitTypesService.delete(benefitType.id);
      toast.success('Benefit type deleted successfully');
      await loadBenefitTypes();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('benefit_type_deleted');
      }
    } catch (error) {
      console.error('Failed to delete benefit type:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete benefit type');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'benefit_type_delete_failure' },
        });
      }
    }
  };

  // Get unit display name
  const getUnitDisplay = (unit: Unit): string => {
    return t(`common.unit.${unit}`);
  };

  // Get unit icon
  const getUnitIcon = (unit: Unit): string => {
    return t(`common.icon.${unit}`) as string;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="material-symbols-outlined animate-spin text-4xl text-primary-light dark:text-primary-dark">
            progress_activity
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading benefit types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Benefit Types Administration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure leave and benefit types (PTO, sick leave, etc.)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary-light/90 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
        >
          <span className="material-symbols-outlined mr-2 text-sm">add</span>
          Create Benefit Type
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
            placeholder="Search benefit types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Unit Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="unit-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Unit:
          </label>
          <select
            id="unit-filter"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">All Units</option>
            <option value="days">{t('common.unit.days')}</option>
            <option value="hours">{t('common.unit.hours')}</option>
          </select>
        </div>
      </div>

      {/* Benefit Types Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Approval
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredBenefitTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-gray-400">
                        card_travel
                      </span>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery || filterUnit !== 'all'
                          ? 'No benefit types found matching your filters'
                          : 'No benefit types yet. Create your first benefit type to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBenefitTypes.map((benefitType) => (
                  <tr key={benefitType.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {benefitType.key}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {benefitType.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-gray-500 dark:text-gray-400">
                          {getUnitIcon(benefitType.unit)}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {getUnitDisplay(benefitType.unit)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          benefitType.requires_approval
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {benefitType.requires_approval ? (
                          <>
                            <span className="material-symbols-outlined mr-1 text-xs">
                              gavel
                            </span>
                            Required
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined mr-1 text-xs">
                              check_circle
                            </span>
                            Auto-Approved
                          </>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(benefitType)}
                          className="inline-flex items-center text-primary-light hover:text-primary-light/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
                          title="Edit benefit type"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(benefitType)}
                          className="inline-flex items-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete benefit type"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                Create New Benefit Type
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
                <label htmlFor="create-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="create-key"
                  {...register('key')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="vacation-pto"
                />
                {errors.key && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.key.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Unique identifier (lowercase, alphanumeric, hyphens/underscores only)
                </p>
              </div>

              <div>
                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="create-name"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Vacation / PTO"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="create-unit"
                  {...register('unit')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="days">{t('common.unit.days')}</option>
                  <option value="hours">{t('common.unit.hours')}</option>
                </select>
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  How this benefit is measured (e.g., days for PTO, hours for flex time)
                </p>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="create-approval"
                    {...register('requires_approval')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="create-approval" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requires Approval
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If checked, leave requests using this benefit type will require manager approval
                  </p>
                </div>
              </div>

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
                  className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold hover:bg-primary-light/90 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
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
                      Create Benefit Type
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedBenefitType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Benefit Type
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedBenefitType(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <label htmlFor="edit-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-key"
                  {...register('key')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {errors.key && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.key.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name <span className="text-red-500">*</span>
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
                <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-unit"
                  {...register('unit')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="days">{t('common.unit.days')}</option>
                  <option value="hours">{t('common.unit.hours')}</option>
                </select>
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="edit-approval"
                    {...register('requires_approval')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="edit-approval" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requires Approval
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If checked, leave requests using this benefit type will require manager approval
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedBenefitType(null);
                  }}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold hover:bg-primary-light/90 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
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
