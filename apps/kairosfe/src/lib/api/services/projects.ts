/**
 * Projects Service
 * Service layer for project operations
 */

import { findAllProjects } from '../endpoints/projects';
import type { ProjectListResponse } from '../schemas/projects';

export const projectsService = {
  /**
   * Get all projects
   */
  async getAll(): Promise<ProjectListResponse> {
    return findAllProjects();
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
};
