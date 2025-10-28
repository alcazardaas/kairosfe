/**
 * Project endpoints
 * Generated from OpenAPI spec - Projects tag
 */

import { apiClient } from '../client';
import type {
  ProjectListResponse,
  ProjectResponse,
  ProjectMembersResponse,
  ProjectMemberResponse,
} from '../schemas';
import {
  ProjectListResponseSchema,
  ProjectResponseSchema,
  ProjectMembersResponseSchema,
  ProjectMemberResponseSchema,
} from '../schemas';

/**
 * ProjectsController_findAll
 * GET /projects
 * Retrieve a paginated list of projects with optional filtering and sorting
 */
export async function findAllProjects(): Promise<ProjectListResponse> {
  return apiClient.request<ProjectListResponse>('/projects', {
    method: 'GET',
    requiresAuth: true,
    operationId: 'ProjectsController_findAll',
    schema: ProjectListResponseSchema,
  });
}

/**
 * ProjectsController_create
 * POST /projects
 * Create a new project within a tenant
 */
export async function createProject(data: unknown): Promise<ProjectResponse> {
  return apiClient.request<ProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'ProjectsController_create',
    schema: ProjectResponseSchema,
  });
}

/**
 * ProjectsController_findOne
 * GET /projects/{id}
 * Retrieve a project by its ID
 */
export async function findProjectById(id: string): Promise<ProjectResponse> {
  return apiClient.request<ProjectResponse>(`/projects/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'ProjectsController_findOne',
    schema: ProjectResponseSchema,
  });
}

/**
 * ProjectsController_update
 * PATCH /projects/{id}
 * Update an existing project by its ID
 */
export async function updateProject(id: string, data: unknown): Promise<ProjectResponse> {
  return apiClient.request<ProjectResponse>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'ProjectsController_update',
    schema: ProjectResponseSchema,
  });
}

/**
 * ProjectsController_remove
 * DELETE /projects/{id}
 * Delete a project by its ID
 */
export async function deleteProject(id: string): Promise<void> {
  return apiClient.request<void>(`/projects/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'ProjectsController_remove',
  });
}

/**
 * ProjectsController_getMembers
 * GET /projects/{id}/members
 * Retrieve all users assigned to a specific project
 */
export async function getProjectMembers(id: string): Promise<ProjectMembersResponse> {
  return apiClient.request<ProjectMembersResponse>(`/projects/${id}/members`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'ProjectsController_getMembers',
    schema: ProjectMembersResponseSchema,
  });
}

/**
 * ProjectsController_addMember
 * POST /projects/{id}/members
 * Assign a user to a project with an optional role
 */
export async function addProjectMember(id: string, data: unknown): Promise<ProjectMemberResponse> {
  return apiClient.request<ProjectMemberResponse>(`/projects/${id}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'ProjectsController_addMember',
    schema: ProjectMemberResponseSchema,
  });
}

/**
 * ProjectsController_removeMember
 * DELETE /projects/{id}/members/{userId}
 * Remove a user assignment from a project
 */
export async function removeProjectMember(id: string, userId: string): Promise<void> {
  return apiClient.request<void>(`/projects/${id}/members/${userId}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'ProjectsController_removeMember',
  });
}
