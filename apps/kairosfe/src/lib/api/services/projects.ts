/**
 * Projects Service
 * Service layer for project operations
 */

import {
  findAllProjects,
  findProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  bulkAssignMembers,
} from '../endpoints/projects';
import { searchProjects as searchProjectsEndpoint } from '../endpoints/search';
import type {
  ProjectListResponse,
  ProjectResponse,
  CreateProjectDto,
  UpdateProjectDto,
  AssignProjectMemberDto,
  BulkAssignMembersDto,
  BulkAssignmentResponse,
} from '../schemas/projects';

export const projectsService = {
  /**
   * Get all projects with optional filtering and pagination
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    active?: boolean;
    search?: string;
  }): Promise<ProjectListResponse> {
    return findAllProjects(params);
  },

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<ProjectResponse> {
    return findProjectById(id);
  },

  /**
   * Create a new project
   */
  async create(data: CreateProjectDto): Promise<ProjectResponse> {
    return createProject(data);
  },

  /**
   * Update an existing project
   */
  async update(id: string, data: UpdateProjectDto): Promise<ProjectResponse> {
    return updateProject(id, data);
  },

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    return deleteProject(id);
  },

  /**
   * Get project members
   */
  async getMembers(projectId: string) {
    return getProjectMembers(projectId);
  },

  /**
   * Add a member to a project
   */
  async addMember(projectId: string, userId: string, role?: 'member' | 'lead' | 'observer') {
    const data: AssignProjectMemberDto = {
      userId,
      role,
    };
    return addProjectMember(projectId, data);
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId: string, userId: string) {
    return removeProjectMember(projectId, userId);
  },

  /**
   * Search projects by query
   */
  async search(query: string, limit: number = 10) {
    return searchProjectsEndpoint({ q: query, limit: limit.toString() });
  },

  /**
   * Search projects for dropdown (simplified format)
   * @param query - Search query (filters by name)
   * @returns Array of {id, name} objects for dropdowns
   */
  async searchProjects(query: string): Promise<Array<{ id: string; name: string }>> {
    const response = await findAllProjects();

    // Filter active projects and search by name
    return response.data
      .filter((p) => p.active && p.name.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({
        id: p.id,
        name: p.name,
      }));
  },

  /**
   * Bulk assign multiple users to a project
   */
  async bulkAssignMembers(
    projectId: string,
    userIds: string[],
    role?: 'member' | 'lead' | 'observer',
  ): Promise<BulkAssignmentResponse> {
    const data: BulkAssignMembersDto = {
      userIds,
      role,
    };
    return bulkAssignMembers(projectId, data);
  },
};
