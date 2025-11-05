import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { projectsService } from '@/lib/api/services/projects';
import { usersService } from '@/lib/api/services/users';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import type { ProjectResponse, ProjectDto } from '@/lib/api/schemas/projects';

// Validation schema for project form - using camelCase to match backend
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().max(2000).nullable().optional(),
  code: z.string().min(1, 'Project code is required'),
  active: z.boolean(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  clientName: z.string().max(255).nullable().optional(),
  budgetHours: z.string().nullable().optional(), // String input, will convert to number
});

type ProjectFormData = z.infer<typeof projectSchema>;

// Member management types
interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  role: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ProjectsManagementContent() {
  const { t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);
  const [saving, setSaving] = useState(false);

  // Members management
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects when search or filter changes
  useEffect(() => {
    filterProjects();
  }, [searchQuery, filterStatus, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsService.getAll();
      setProjects(response.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'projects_load_failure' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter((p) => p.active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((p) => !p.active);
    }

    setFilteredProjects(filtered);
  };

  const openCreateModal = () => {
    reset({
      name: '',
      description: '',
      code: '',
      active: true,
      startDate: '',
      endDate: '',
      clientName: '',
      budgetHours: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (project: ProjectDto) => {
    setSelectedProject(project);
    reset({
      name: project.name,
      description: project.description || '',
      code: project.code,
      active: project.active,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      clientName: project.clientName || '',
      budgetHours: project.budgetHours || '',
    });
    setIsEditModalOpen(true);
  };

  const openMembersModal = async (project: ProjectDto) => {
    setSelectedProject(project);
    setIsMembersModalOpen(true);
    await loadProjectMembers(project.id);
    await loadAvailableUsers();
  };

  const loadProjectMembers = async (projectId: string) => {
    try {
      setLoadingMembers(true);
      const response = await projectsService.getMembers(projectId);
      setMembers(response.data || []);
    } catch (error) {
      console.error('Failed to load project members:', error);
      toast.error('Failed to load project members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersService.getAll();
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  const onCreateSubmit = async (data: ProjectFormData) => {
    try {
      setSaving(true);
      await projectsService.create({
        name: data.name,
        description: data.description || null,
        code: data.code || null,
        active: data.active,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        clientName: data.clientName || null,
        budgetHours: data.budgetHours ? parseFloat(data.budgetHours) : null,
      });

      toast.success('Project created successfully');
      setIsCreateModalOpen(false);
      await loadProjects();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_created');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'project_create_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onEditSubmit = async (data: ProjectFormData) => {
    if (!selectedProject) return;

    try{
      setSaving(true);
      await projectsService.update(selectedProject.id, {
        name: data.name,
        description: data.description || null,
        code: data.code || null,
        active: data.active,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        clientName: data.clientName || null,
        budgetHours: data.budgetHours ? parseFloat(data.budgetHours) : null,
      });

      toast.success('Project updated successfully');
      setIsEditModalOpen(false);
      setSelectedProject(null);
      await loadProjects();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_updated');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update project');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'project_update_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: ProjectDto) => {
    if (!confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectsService.delete(project.id);
      toast.success('Project deleted successfully');
      await loadProjects();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_deleted');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'project_delete_failure' },
        });
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedProject || !selectedUserId) return;

    try {
      await projectsService.addMember(selectedProject.id, selectedUserId, memberRole || undefined);
      toast.success('Member added successfully');
      setSelectedUserId('');
      setMemberRole('');
      await loadProjectMembers(selectedProject.id);

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_member_added');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;

    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      await projectsService.removeMember(selectedProject.id, userId);
      toast.success('Member removed successfully');
      await loadProjectMembers(selectedProject.id);

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('project_member_removed');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="material-symbols-outlined animate-spin text-4xl text-primary-light dark:text-primary-dark">
            progress_activity
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
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
            Projects Administration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage projects and team assignments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-light/90 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
        >
          <span className="material-symbols-outlined mr-2 text-sm">add</span>
          Create Project
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
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-gray-400">
                        folder_open
                      </span>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery || filterStatus !== 'all'
                          ? 'No projects found matching your filters'
                          : 'No projects yet. Create your first project to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {project.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {project.description || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                          project.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {project.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openMembersModal(project)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Manage members"
                        >
                          <span className="material-symbols-outlined text-sm">group</span>
                        </button>
                        <button
                          onClick={() => openEditModal(project)}
                          className="inline-flex items-center text-primary-light hover:text-primary-light/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
                          title="Edit project"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="inline-flex items-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete project"
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
                Create New Project
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
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="create-name"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Website Redesign"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="create-code"
                  {...register('code')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="WEB-001"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('projectDescription')}
                </label>
                <textarea
                  id="create-description"
                  {...register('description')}
                  rows={3}
                  maxLength={2000}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder={t('descriptionPlaceholder')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="create-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('projectStartDate')}
                  </label>
                  <input
                    type="date"
                    id="create-start-date"
                    {...register('startDate')}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="create-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('projectEndDate')}
                  </label>
                  <input
                    type="date"
                    id="create-end-date"
                    {...register('endDate')}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('clientOptional')}
                </label>
                <input
                  type="text"
                  id="create-client"
                  {...register('clientName')}
                  maxLength={255}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label htmlFor="create-budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('projectBudget')}
                </label>
                <input
                  type="number"
                  id="create-budget"
                  {...register('budgetHours')}
                  step="0.5"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder={t('budgetHoursPlaceholder')}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create-active"
                  {...register('active')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="create-active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
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
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Project
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProject(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Name <span className="text-red-500">*</span>
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
                <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-code"
                  {...register('code')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('projectDescription')}
                </label>
                <textarea
                  id="edit-description"
                  {...register('description')}
                  rows={3}
                  maxLength={2000}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder={t('descriptionPlaceholder')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('projectStartDate')}
                  </label>
                  <input
                    type="date"
                    id="edit-start-date"
                    {...register('startDate')}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="edit-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('projectEndDate')}
                  </label>
                  <input
                    type="date"
                    id="edit-end-date"
                    {...register('endDate')}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('clientOptional')}
                </label>
                <input
                  type="text"
                  id="edit-client"
                  {...register('clientName')}
                  maxLength={255}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label htmlFor="edit-budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('projectBudget')}
                </label>
                <input
                  type="number"
                  id="edit-budget"
                  {...register('budgetHours')}
                  step="0.5"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder={t('budgetHoursPlaceholder')}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-active"
                  {...register('active')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-light focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="edit-active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedProject(null);
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

      {/* Members Modal */}
      {isMembersModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Project Members - {selectedProject.name}
              </h2>
              <button
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setSelectedProject(null);
                  setMembers([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Add Member Form */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Add New Member
              </h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select user...</option>
                  {availableUsers
                    .filter((user) => !members.some((m) => m.userId === user.id))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="Role (optional)"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 sm:w-40"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId}
                  className="inline-flex items-center justify-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold hover:bg-primary-light/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
                >
                  <span className="material-symbols-outlined mr-1 text-sm">add</span>
                  Add
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="max-h-96 overflow-y-auto">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-2xl text-primary-light dark:text-primary-dark">
                    progress_activity
                  </span>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="material-symbols-outlined text-4xl text-gray-400">
                    group_off
                  </span>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No members assigned to this project yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400">
                          person
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.userName}
                          </p>
                          {member.role && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Role: {member.role}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove member"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setSelectedProject(null);
                  setMembers([]);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
