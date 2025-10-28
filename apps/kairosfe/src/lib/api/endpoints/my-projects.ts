/**
 * My Projects endpoints
 * Generated from OpenAPI spec - My Projects tag
 */

import { apiClient } from '../client';
import type { ProjectMembersResponse } from '../schemas';
import { ProjectMembersResponseSchema } from '../schemas';

/**
 * MyProjectsController_getMyProjects
 * GET /my/projects
 * Retrieve all projects that the current user is assigned to
 */
export async function getMyProjects(): Promise<ProjectMembersResponse> {
  return apiClient.request<ProjectMembersResponse>('/my/projects', {
    method: 'GET',
    requiresAuth: true,
    operationId: 'MyProjectsController_getMyProjects',
    schema: ProjectMembersResponseSchema,
  });
}
