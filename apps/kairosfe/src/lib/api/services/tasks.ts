/**
 * Tasks Service
 * Service layer for task operations
 */

import {
  findAllTasks,
  findTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../endpoints/tasks';
import type { TaskListResponse, TaskResponse } from '../schemas/tasks';

export interface GetTasksParams {
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTaskDto {
  name: string;
  project_id: string;
  parent_task_id?: string | null;
}

export interface UpdateTaskDto {
  name?: string;
  project_id?: string;
  parent_task_id?: string | null;
}

export const tasksService = {
  /**
   * Get tasks with optional filtering
   * @param params - Filter parameters
   */
  async getAll(params?: GetTasksParams): Promise<TaskListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.projectId) queryParams.append('project_id', params.projectId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return findAllTasks(queryParams);
  },

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<TaskResponse> {
    return findTaskById(id);
  },

  /**
   * Create a new task
   */
  async create(data: CreateTaskDto): Promise<TaskResponse> {
    return createTask(data);
  },

  /**
   * Update an existing task
   */
  async update(id: string, data: UpdateTaskDto): Promise<TaskResponse> {
    return updateTask(id, data);
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    return deleteTask(id);
  },

  /**
   * Get tasks by project ID
   * @param projectId - Project ID to filter tasks
   */
  async getByProject(projectId: string): Promise<TaskListResponse> {
    return this.getAll({ projectId });
  },

  /**
   * Search tasks for dropdown (simplified format)
   * @param query - Search query (filters by name)
   * @param projectId - Optional project ID to filter
   * @returns Array of {id, name} objects for dropdowns
   */
  async searchTasks(query: string, projectId?: string): Promise<Array<{ id: string; name: string }>> {
    const response = await this.getAll({
      search: query,
      projectId,
      limit: 50, // Limit for dropdown performance
    });

    return response.data.map((t) => ({
      id: t.id,
      name: t.name,
    }));
  },
};
