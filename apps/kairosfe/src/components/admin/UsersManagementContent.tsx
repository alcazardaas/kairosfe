import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employeesService } from '@/lib/api/services/employees';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import type { Employee, UserRole } from '@kairos/shared';

// Validation schema for user form
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['employee', 'manager', 'admin']),
  jobTitle: z.string().optional(),
  startDate: z.string().optional(),
  managerId: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  sendInvite: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersManagementContent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Employee[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  // Managers list for dropdown
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      sendInvite: true,
    },
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
    loadManagers();
  }, []);

  // Filter users when search or filters change
  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterStatus, filterRole, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await employeesService.getAll();
      setUsers(response.data || []);

      // Track page view
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('admin_users_viewed');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error(t('employees.errors.updateFailed'));

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'users_load_failure' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await employeesService.searchManagers('');
      setManagers(response);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.profile?.jobTitle?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((u) => u.membership.status === filterStatus);
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter((u) => u.membership.role === filterRole);
    }

    setFilteredUsers(filtered);
  };

  const openCreateModal = () => {
    reset({
      email: '',
      name: '',
      role: 'employee',
      jobTitle: '',
      startDate: '',
      managerId: '',
      location: '',
      phone: '',
      sendInvite: true,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: Employee) => {
    setSelectedUser(user);
    reset({
      email: user.email,
      name: user.name || '',
      role: user.membership.role,
      jobTitle: user.profile?.jobTitle || '',
      startDate: user.profile?.startDate || '',
      managerId: user.profile?.managerUserId || '',
      location: user.profile?.location || '',
      phone: user.profile?.phone || '',
      sendInvite: false,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: Employee) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const onSubmitCreate = async (data: UserFormData) => {
    try {
      setSaving(true);
      await employeesService.create({
        email: data.email,
        name: data.name,
        role: data.role,
        jobTitle: data.jobTitle || undefined,
        startDate: data.startDate || undefined,
        managerId: data.managerId || undefined,
        location: data.location || undefined,
        phone: data.phone || undefined,
        sendInvite: data.sendInvite,
      });

      toast.success(
        data.sendInvite
          ? t('employees.success.createdInvite', { email: data.email })
          : t('employees.success.created')
      );
      setIsCreateModalOpen(false);
      await loadUsers();

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('user_created', {
          role: data.role,
          sendInvite: data.sendInvite,
        });
      }
    } catch (error: unknown) {
      console.error('Failed to create user:', error);
      const errorMessage = error instanceof Error ? error.message : t('employees.errors.createFailed');
      toast.error(errorMessage);

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'user_create_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onSubmitEdit = async (data: UserFormData) => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await employeesService.update(selectedUser.id, {
        name: data.name,
        role: data.role,
        jobTitle: data.jobTitle || undefined,
        startDate: data.startDate || undefined,
        managerId: data.managerId || undefined,
        location: data.location || undefined,
        phone: data.phone || undefined,
      });

      toast.success(t('employees.success.updated'));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await loadUsers();

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('user_updated', {
          userId: selectedUser.id,
        });
      }
    } catch (error: unknown) {
      console.error('Failed to update user:', error);
      const errorMessage = error instanceof Error ? error.message : t('employees.errors.updateFailed');
      toast.error(errorMessage);

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'user_update_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await employeesService.deactivate(selectedUser.id);

      toast.success(t('employees.success.deleted'));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await loadUsers();

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('user_deactivated', {
          userId: selectedUser.id,
        });
      }
    } catch (error: unknown) {
      console.error('Failed to deactivate user:', error);
      const errorMessage = error instanceof Error ? error.message : t('employees.errors.deleteFailed');
      toast.error(errorMessage);

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'user_delete_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (user: Employee) => {
    try {
      setSaving(true);
      await employeesService.reactivate(user.id);

      toast.success('User reactivated successfully');
      await loadUsers();

      // Track event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('user_reactivated', {
          userId: user.id,
        });
      }
    } catch (error: unknown) {
      console.error('Failed to reactivate user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate user';
      toast.error(errorMessage);

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'user_reactivate_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'employee':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('employees.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('employees.title')}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('employees.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">{t('employees.filters.all')}</option>
            <option value="active">{t('employees.filters.active')}</option>
            <option value="inactive">{t('employees.filters.inactive')}</option>
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* Add User Button */}
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t('employees.addEmployee')}
        </button>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <span className="material-symbols-outlined mb-4 text-6xl text-gray-300 dark:text-gray-600">
            group_off
          </span>
          <p className="text-gray-600 dark:text-gray-400">{t('employees.noResults')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('employees.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('employees.table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('employees.table.role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('employees.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('employees.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.name || t('employees.noProfile')}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(user.membership.role)}`}
                      >
                        {user.membership.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(user.membership.status)}`}
                      >
                        {user.membership.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.profile?.jobTitle || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="mr-3 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit user"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      {user.membership.status === 'active' ? (
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Deactivate user"
                        >
                          <span className="material-symbols-outlined text-lg">block</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(user)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Reactivate user"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('employees.modals.add.title')}
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {t('employees.modals.add.subtitle')}
            </p>

            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.email')} *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder={t('employees.fields.emailPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.name')} *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder={t('employees.fields.namePlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.role')} *
                  </label>
                  <select
                    {...register('role')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                </div>

                {/* Job Title */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.jobTitle')}
                  </label>
                  <input
                    type="text"
                    {...register('jobTitle')}
                    placeholder={t('employees.fields.jobTitlePlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.startDate')}
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Manager */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.manager')}
                  </label>
                  <select
                    {...register('managerId')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">{t('employees.fields.managerPlaceholder')}</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.location')}
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    placeholder={t('employees.fields.locationPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.phone')}
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder={t('employees.fields.phonePlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Send Invite */}
                <div className="sm:col-span-2">
                  <label className="flex items-center">
                    <input type="checkbox" {...register('sendInvite')} className="mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('employees.modals.add.sendInvite')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('employees.modals.add.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? t('common.loading') : t('employees.modals.add.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('employees.modals.edit.title')}
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {t('employees.modals.edit.subtitle')}
            </p>

            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email (read-only) */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.email')}
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.name')} *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.role')} *
                  </label>
                  <select
                    {...register('role')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                </div>

                {/* Job Title */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.jobTitle')}
                  </label>
                  <input
                    type="text"
                    {...register('jobTitle')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.startDate')}
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Manager */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.manager')}
                  </label>
                  <select
                    {...register('managerId')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">{t('employees.fields.managerPlaceholder')}</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.location')}
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('employees.fields.phone')}
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('employees.modals.edit.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? t('common.loading') : t('employees.modals.edit.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('employees.modals.delete.title')}
              </h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {t('employees.modals.delete.message', { name: selectedUser.name || selectedUser.email })}
            </p>
            <p className="mb-6 text-sm text-red-600 dark:text-red-400">
              {t('employees.modals.delete.warning')}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('employees.modals.delete.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('employees.modals.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
