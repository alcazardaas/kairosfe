/**
 * Search endpoints
 * Generated from OpenAPI spec - Search tag
 */

import { apiClient } from '../client';
import type {
  SearchProjectsResponse,
  SearchTasksResponse,
} from '../schemas';
import {
  SearchProjectsResponseSchema,
  SearchTasksResponseSchema,
} from '../schemas';

interface SearchProjectsParams {
  q: string;
  limit?: string;
}

interface SearchTasksParams {
  q: string;
  project_id?: string;
  limit?: string;
}

/**
 * SearchController_searchProjects
 * GET /search/projects
 * Search projects by name or code within the current tenant
 */
export async function searchProjects(params: SearchProjectsParams): Promise<SearchProjectsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.q);
  if (params.limit) {
    searchParams.append('limit', params.limit);
  }

  return apiClient.request<SearchProjectsResponse>(`/search/projects?${searchParams.toString()}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'SearchController_searchProjects',
    schema: SearchProjectsResponseSchema,
  });
}

/**
 * SearchController_searchTasks
 * GET /search/tasks
 * Search tasks by name within the current tenant, optionally filtered by project
 */
export async function searchTasks(params: SearchTasksParams): Promise<SearchTasksResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.q);
  if (params.project_id) {
    searchParams.append('project_id', params.project_id);
  }
  if (params.limit) {
    searchParams.append('limit', params.limit);
  }

  return apiClient.request<SearchTasksResponse>(`/search/tasks?${searchParams.toString()}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'SearchController_searchTasks',
    schema: SearchTasksResponseSchema,
  });
}
