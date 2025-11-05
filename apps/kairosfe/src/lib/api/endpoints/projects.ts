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
  CreateProjectDto,
  UpdateProjectDto,
  AssignProjectMemberDto,
  BulkAssignMembersDto,
  BulkAssignmentResponse,
} from '../schemas';
import {
  ProjectListResponseSchema,
  ProjectResponseSchema,
  ProjectMembersResponseSchema,
  ProjectMemberResponseSchema,
  BulkAssignmentResponseSchema,
} from '../schemas';

/**
 * ProjectsController_findAll
 * GET /projects
 * Retrieve a paginated list of projects with optional filtering and sorting
 */
export async function findAllProjects(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  active?: boolean;
  search?: string;
}): Promise<ProjectListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.active !== undefined) queryParams.append('active', params.active.toString());
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = queryString ? `/projects?${queryString}` : '/projects';

  return apiClient.request<ProjectListResponse>(url, {
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
export async function createProject(data: CreateProjectDto): Promise<ProjectResponse> {
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
export async function updateProject(id: string, data: UpdateProjectDto): Promise<ProjectResponse> {
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
export async function addProjectMember(
  id: string,
  data: AssignProjectMemberDto,
): Promise<ProjectMemberResponse> {
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

/**
 * ProjectsController_bulkAssignMembers
 * POST /projects/{id}/members/bulk
 * Assign multiple users to a project at once
 */
export async function bulkAssignMembers(
  id: string,
  data: BulkAssignMembersDto,
): Promise<BulkAssignmentResponse> {
  return apiClient.request<BulkAssignmentResponse>(`/projects/${id}/members/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'ProjectsController_bulkAssignMembers',
    schema: BulkAssignmentResponseSchema,
  });
}
