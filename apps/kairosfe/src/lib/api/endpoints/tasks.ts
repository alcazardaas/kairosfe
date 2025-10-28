/**
 * Task endpoints
 * Generated from OpenAPI spec - Tasks tag
 */

import { apiClient } from '../client';
import type {
  TaskListResponse,
  TaskResponse,
} from '../schemas';
import {
  TaskListResponseSchema,
  TaskResponseSchema,
} from '../schemas';

/**
 * TasksController_findAll
 * GET /tasks
 * Retrieve a paginated list of tasks with optional filtering and sorting
 */
export async function findAllTasks(params?: URLSearchParams): Promise<TaskListResponse> {
  const url = params ? `/tasks?${params.toString()}` : '/tasks';
  return apiClient.request<TaskListResponse>(url, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TasksController_findAll',
    schema: TaskListResponseSchema,
  });
}

/**
 * TasksController_create
 * POST /tasks
 * Create a new task within a project
 */
export async function createTask(data: unknown): Promise<TaskResponse> {
  return apiClient.request<TaskResponse>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TasksController_create',
    schema: TaskResponseSchema,
  });
}

/**
 * TasksController_findOne
 * GET /tasks/{id}
 * Retrieve a task by its ID
 */
export async function findTaskById(id: string): Promise<TaskResponse> {
  return apiClient.request<TaskResponse>(`/tasks/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'TasksController_findOne',
    schema: TaskResponseSchema,
  });
}

/**
 * TasksController_update
 * PATCH /tasks/{id}
 * Update an existing task by its ID
 */
export async function updateTask(id: string, data: unknown): Promise<TaskResponse> {
  return apiClient.request<TaskResponse>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'TasksController_update',
    schema: TaskResponseSchema,
  });
}

/**
 * TasksController_remove
 * DELETE /tasks/{id}
 * Delete a task by its ID
 */
export async function deleteTask(id: string): Promise<void> {
  return apiClient.request<void>(`/tasks/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'TasksController_remove',
  });
}
