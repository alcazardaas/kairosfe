import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tasksService, type CreateTaskDto, type UpdateTaskDto } from '@/lib/api/services/tasks';
import { projectsService } from '@/lib/api/services/projects';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import type { TaskDto } from '@/lib/api/schemas/tasks';

// Validation schema for task form
const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  projectId: z.string().uuid('Please select a project'),
  parentTaskId: z.string().uuid().nullable().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Project {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

// Task with hierarchy information
interface TaskWithHierarchy extends TaskDto {
  children: TaskWithHierarchy[];
  level: number;
  projectName?: string;
}

export default function TasksManagementContent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithHierarchy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const selectedProjectId = watch('projectId');

  // Load tasks and projects on mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter tasks when search, filter, or tasks change
  useEffect(() => {
    filterTasks();
  }, [searchQuery, filterProjectId, tasks, projects]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, projectsResponse] = await Promise.all([
        tasksService.getAll(),
        projectsService.getAll(),
      ]);
      setTasks(tasksResponse.data || []);
      setProjects(projectsResponse.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load tasks');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'tasks_load_failure' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical task structure
  const buildHierarchy = (tasksList: TaskDto[], projectsList: Project[]): TaskWithHierarchy[] => {
    const taskMap = new Map<string, TaskWithHierarchy>();
    const roots: TaskWithHierarchy[] = [];

    // Create map with project names
    tasksList.forEach((task) => {
      const project = projectsList.find((p) => p.id === task.projectId);
      taskMap.set(task.id, {
        ...task,
        children: [],
        level: 0,
        projectName: project?.name || 'Unknown Project',
      });
    });

    // Build hierarchy
    tasksList.forEach((task) => {
      const taskWithHierarchy = taskMap.get(task.id)!;
      if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
        const parent = taskMap.get(task.parentTaskId)!;
        taskWithHierarchy.level = parent.level + 1;
        parent.children.push(taskWithHierarchy);
      } else {
        roots.push(taskWithHierarchy);
      }
    });

    return roots;
  };

  // Flatten hierarchy for display
  const flattenHierarchy = (nodes: TaskWithHierarchy[]): TaskWithHierarchy[] => {
    const result: TaskWithHierarchy[] = [];
    const traverse = (node: TaskWithHierarchy) => {
      result.push(node);
      node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return result;
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Apply project filter
    if (filterProjectId && filterProjectId !== 'all') {
      filtered = filtered.filter((t) => t.projectId === filterProjectId);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(query));
    }

    // Build and flatten hierarchy
    const hierarchy = buildHierarchy(filtered, projects);
    const flattened = flattenHierarchy(hierarchy);

    setFilteredTasks(flattened);
  };

  // Get available parent tasks (no circular dependencies)
  const getAvailableParentTasks = (currentTaskId?: string): TaskDto[] => {
    const projectId = selectedProjectId;
    if (!projectId) return [];

    // Filter tasks by selected project
    let available = tasks.filter((t) => t.projectId === projectId);

    // If editing, exclude current task and its descendants
    if (currentTaskId) {
      const excludeIds = new Set<string>();
      const addDescendants = (taskId: string) => {
        excludeIds.add(taskId);
        tasks.filter((t) => t.parentTaskId === taskId).forEach((child) => addDescendants(child.id));
      };
      addDescendants(currentTaskId);
      available = available.filter((t) => !excludeIds.has(t.id));
    }

    return available;
  };

  const openCreateModal = () => {
    reset({
      name: '',
      projectId: filterProjectId !== 'all' ? filterProjectId : '',
      parentTaskId: null,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (task: TaskDto) => {
    setSelectedTask(task);
    reset({
      name: task.name,
      projectId: task.projectId,
      parentTaskId: task.parentTaskId,
    });
    setIsEditModalOpen(true);
  };

  const onCreateSubmit = async (data: TaskFormData) => {
    try {
      setSaving(true);
      const createData: CreateTaskDto = {
        name: data.name,
        projectId: data.projectId,
        parentTaskId: data.parentTaskId || null,
      };

      await tasksService.create(createData);
      toast.success('Task created successfully');
      setIsCreateModalOpen(false);
      await loadData();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('task_created');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'task_create_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onEditSubmit = async (data: TaskFormData) => {
    if (!selectedTask) return;

    try {
      setSaving(true);
      const updateData: UpdateTaskDto = {
        name: data.name,
        projectId: data.projectId,
        parentTaskId: data.parentTaskId || null,
      };

      await tasksService.update(selectedTask.id, updateData);
      toast.success('Task updated successfully');
      setIsEditModalOpen(false);
      setSelectedTask(null);
      await loadData();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('task_updated');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'task_update_failure' },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task: TaskDto) => {
    // Check if task has children
    const hasChildren = tasks.some((t) => t.parentTaskId === task.id);
    if (hasChildren) {
      toast.error('Cannot delete task with subtasks. Please delete subtasks first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete task "${task.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await tasksService.delete(task.id);
      toast.success('Task deleted successfully');
      await loadData();

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('task_deleted');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { type: 'task_delete_failure' },
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="material-symbols-outlined animate-spin text-4xl text-primary-light dark:text-primary-dark">
            progress_activity
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
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
            Tasks Administration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage tasks and organize them hierarchically within projects
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center rounded-md bg-primary-light px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-light/90 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
        >
          <span className="material-symbols-outlined mr-2 text-sm">add</span>
          Create Task
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
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="project-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Project:
          </label>
          <select
            id="project-filter"
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">All Projects</option>
            {projects
              .filter((p) => p.active)
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Task Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Parent Task
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-gray-400">
                        task_alt
                      </span>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery || filterProjectId !== 'all'
                          ? 'No tasks found matching your filters'
                          : 'No tasks yet. Create your first task to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const parentTask = task.parentTaskId
                    ? tasks.find((t) => t.id === task.parentTaskId)
                    : null;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Indentation for hierarchy */}
                          {task.level > 0 && (
                            <span
                              className="text-gray-400"
                              style={{ marginLeft: `${task.level * 1.5}rem` }}
                            >
                              └─
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {task.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {task.projectName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {parentTask ? parentTask.name : '-'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="inline-flex items-center text-primary-light hover:text-primary-light/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
                            title="Edit task"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            className="inline-flex items-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete task"
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
                Create New Task
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
                <label htmlFor="create-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="create-project"
                  {...register('projectId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select a project...</option>
                  {projects
                    .filter((p) => p.active)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="create-name"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Backend Development"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parent Task (Optional)
                </label>
                <select
                  id="create-parent"
                  {...register('parentTaskId')}
                  disabled={!selectedProjectId}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">None (Top-level task)</option>
                  {selectedProjectId &&
                    getAvailableParentTasks().map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                </select>
                {!selectedProjectId && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select a project first to choose a parent task
                  </p>
                )}
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
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Task
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTask(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <label htmlFor="edit-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-project"
                  {...register('projectId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select a project...</option>
                  {projects
                    .filter((p) => p.active)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Name <span className="text-red-500">*</span>
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
                <label htmlFor="edit-parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parent Task (Optional)
                </label>
                <select
                  id="edit-parent"
                  {...register('parentTaskId')}
                  disabled={!selectedProjectId}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">None (Top-level task)</option>
                  {selectedProjectId &&
                    getAvailableParentTasks(selectedTask.id).map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                </select>
                {!selectedProjectId && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select a project first to choose a parent task
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTask(null);
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
