/**
 * Comprehensive tests for Projects Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectsService } from './projects';
import * as projectsEndpoints from '../endpoints/projects';
import * as searchEndpoint from '../endpoints/search';
import type { ProjectDto } from '../schemas';

// Mock all endpoint functions
vi.mock('../endpoints/projects');
vi.mock('../endpoints/search');

describe('projectsService', () => {
  const mockProject: ProjectDto = {
    id: 'proj-1',
    tenantId: 'tenant-1',
    name: 'Alpha Project',
    clientName: 'ACME Corp',
    description: 'Main project for ACME',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    budgetHours: 1000,
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockProject2: ProjectDto = {
    id: 'proj-2',
    tenantId: 'tenant-1',
    name: 'Beta Project',
    clientName: 'Beta Inc',
    description: null,
    startDate: '2025-02-01',
    endDate: null,
    budgetHours: null,
    active: true,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
  };

  const mockInactiveProject: ProjectDto = {
    id: 'proj-3',
    tenantId: 'tenant-1',
    name: 'Gamma Project',
    clientName: 'Gamma LLC',
    description: null,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budgetHours: 500,
    active: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-12-31T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all projects without parameters', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      const result = await projectsService.getAll();

      expect(projectsEndpoints.findAllProjects).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch projects with pagination', async () => {
      const mockResponse = {
        data: [mockProject],
        total: 100,
        page: 2,
        pageSize: 20,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      await projectsService.getAll({ page: 2, limit: 20 });

      expect(projectsEndpoints.findAllProjects).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
      });
    });

    it('should fetch projects with sort parameter', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      await projectsService.getAll({ sort: '-createdAt' });

      expect(projectsEndpoints.findAllProjects).toHaveBeenCalledWith({
        sort: '-createdAt',
      });
    });

    it('should fetch active projects only', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      await projectsService.getAll({ active: true });

      expect(projectsEndpoints.findAllProjects).toHaveBeenCalledWith({
        active: true,
      });
    });

    it('should fetch projects with search query', async () => {
      const mockResponse = {
        data: [mockProject],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      await projectsService.getAll({ search: 'Alpha' });

      expect(projectsEndpoints.findAllProjects).toHaveBeenCalledWith({
        search: 'Alpha',
      });
    });

    it('should fetch projects with all parameters combined', async () => {
      const mockResponse = {
        data: [mockProject],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      await projectsService.getAll({
        page: 1,
        limit: 10,
        sort: 'name',
        active: true,
        search: 'Alpha',
      });

      expect(projectsEndpoints.findAllProjects).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sort: 'name',
        active: true,
        search: 'Alpha',
      });
    });
  });

  describe('getById', () => {
    it('should fetch project by ID', async () => {
      const mockResponse = {
        data: mockProject,
      };

      vi.mocked(projectsEndpoints.findProjectById).mockResolvedValue(mockResponse);

      const result = await projectsService.getById('proj-1');

      expect(projectsEndpoints.findProjectById).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle project not found error', async () => {
      vi.mocked(projectsEndpoints.findProjectById).mockRejectedValue(
        new Error('Project not found')
      );

      await expect(projectsService.getById('non-existent')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('create', () => {
    it('should create project with all fields', async () => {
      const createData = {
        name: 'New Project',
        clientName: 'New Client',
        description: 'Project description',
        startDate: '2025-03-01',
        endDate: '2025-12-31',
        budgetHours: 2000,
      };

      const mockResponse = {
        data: {
          ...mockProject,
          ...createData,
          id: 'proj-new',
        },
      };

      vi.mocked(projectsEndpoints.createProject).mockResolvedValue(mockResponse);

      const result = await projectsService.create(createData);

      expect(projectsEndpoints.createProject).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockResponse);
    });

    it('should create project with required fields only', async () => {
      const createData = {
        name: 'Minimal Project',
        clientName: 'Client Name',
      };

      const mockResponse = {
        data: {
          ...mockProject2,
          ...createData,
          id: 'proj-minimal',
        },
      };

      vi.mocked(projectsEndpoints.createProject).mockResolvedValue(mockResponse);

      const result = await projectsService.create(createData);

      expect(projectsEndpoints.createProject).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation error', async () => {
      const createData = {
        name: 'Duplicate Project',
        clientName: 'Client',
      };

      vi.mocked(projectsEndpoints.createProject).mockRejectedValue(
        new Error('Project name already exists')
      );

      await expect(projectsService.create(createData)).rejects.toThrow(
        'Project name already exists'
      );
    });
  });

  describe('update', () => {
    it('should update project name', async () => {
      const updateData = {
        name: 'Updated Alpha Project',
      };

      const mockResponse = {
        data: {
          ...mockProject,
          ...updateData,
        },
      };

      vi.mocked(projectsEndpoints.updateProject).mockResolvedValue(mockResponse);

      const result = await projectsService.update('proj-1', updateData);

      expect(projectsEndpoints.updateProject).toHaveBeenCalledWith('proj-1', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        description: 'Updated description',
        endDate: '2026-06-30',
        budgetHours: 1500,
      };

      const mockResponse = {
        data: {
          ...mockProject,
          ...updateData,
        },
      };

      vi.mocked(projectsEndpoints.updateProject).mockResolvedValue(mockResponse);

      await projectsService.update('proj-1', updateData);

      expect(projectsEndpoints.updateProject).toHaveBeenCalledWith('proj-1', updateData);
    });

    it('should deactivate project', async () => {
      const updateData = {
        active: false,
      };

      const mockResponse = {
        data: {
          ...mockProject,
          active: false,
        },
      };

      vi.mocked(projectsEndpoints.updateProject).mockResolvedValue(mockResponse);

      const result = await projectsService.update('proj-1', updateData);

      expect(projectsEndpoints.updateProject).toHaveBeenCalledWith('proj-1', updateData);
      expect(result.data.active).toBe(false);
    });

    it('should handle update error', async () => {
      vi.mocked(projectsEndpoints.updateProject).mockRejectedValue(
        new Error('Project not found')
      );

      await expect(
        projectsService.update('non-existent', { name: 'Test' })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      vi.mocked(projectsEndpoints.deleteProject).mockResolvedValue(undefined);

      await projectsService.delete('proj-1');

      expect(projectsEndpoints.deleteProject).toHaveBeenCalledWith('proj-1');
    });

    it('should handle deletion error', async () => {
      vi.mocked(projectsEndpoints.deleteProject).mockRejectedValue(
        new Error('Cannot delete project with existing time entries')
      );

      await expect(projectsService.delete('proj-1')).rejects.toThrow(
        'Cannot delete project with existing time entries'
      );
    });
  });

  describe('getMembers', () => {
    it('should fetch project members', async () => {
      const mockMembers = {
        data: [
          {
            userId: 'user-1',
            userName: 'John Doe',
            userEmail: 'john@test.com',
            role: 'lead' as const,
            assignedAt: '2025-01-01T00:00:00.000Z',
          },
          {
            userId: 'user-2',
            userName: 'Jane Smith',
            userEmail: 'jane@test.com',
            role: 'member' as const,
            assignedAt: '2025-01-02T00:00:00.000Z',
          },
        ],
      };

      vi.mocked(projectsEndpoints.getProjectMembers).mockResolvedValue(mockMembers);

      const result = await projectsService.getMembers('proj-1');

      expect(projectsEndpoints.getProjectMembers).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(mockMembers);
    });

    it('should handle empty members list', async () => {
      const mockMembers = {
        data: [],
      };

      vi.mocked(projectsEndpoints.getProjectMembers).mockResolvedValue(mockMembers);

      const result = await projectsService.getMembers('proj-1');

      expect(result.data).toHaveLength(0);
    });
  });

  describe('addMember', () => {
    it('should add member with role', async () => {
      const mockResponse = {
        success: true,
        message: 'Member added successfully',
      };

      vi.mocked(projectsEndpoints.addProjectMember).mockResolvedValue(mockResponse);

      await projectsService.addMember('proj-1', 'user-1', 'lead');

      expect(projectsEndpoints.addProjectMember).toHaveBeenCalledWith('proj-1', {
        userId: 'user-1',
        role: 'lead',
      });
    });

    it('should add member without role (default)', async () => {
      const mockResponse = {
        success: true,
        message: 'Member added successfully',
      };

      vi.mocked(projectsEndpoints.addProjectMember).mockResolvedValue(mockResponse);

      await projectsService.addMember('proj-1', 'user-2');

      expect(projectsEndpoints.addProjectMember).toHaveBeenCalledWith('proj-1', {
        userId: 'user-2',
        role: undefined,
      });
    });

    it('should add observer to project', async () => {
      const mockResponse = {
        success: true,
        message: 'Member added successfully',
      };

      vi.mocked(projectsEndpoints.addProjectMember).mockResolvedValue(mockResponse);

      await projectsService.addMember('proj-1', 'user-3', 'observer');

      expect(projectsEndpoints.addProjectMember).toHaveBeenCalledWith('proj-1', {
        userId: 'user-3',
        role: 'observer',
      });
    });

    it('should handle add member error', async () => {
      vi.mocked(projectsEndpoints.addProjectMember).mockRejectedValue(
        new Error('User already assigned to project')
      );

      await expect(projectsService.addMember('proj-1', 'user-1')).rejects.toThrow(
        'User already assigned to project'
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member from project', async () => {
      const mockResponse = {
        success: true,
        message: 'Member removed successfully',
      };

      vi.mocked(projectsEndpoints.removeProjectMember).mockResolvedValue(mockResponse);

      await projectsService.removeMember('proj-1', 'user-1');

      expect(projectsEndpoints.removeProjectMember).toHaveBeenCalledWith('proj-1', 'user-1');
    });

    it('should handle remove member error', async () => {
      vi.mocked(projectsEndpoints.removeProjectMember).mockRejectedValue(
        new Error('Member not found in project')
      );

      await expect(projectsService.removeMember('proj-1', 'user-99')).rejects.toThrow(
        'Member not found in project'
      );
    });
  });

  describe('search', () => {
    it('should search projects with default limit', async () => {
      const mockSearchResponse = {
        data: [
          { id: 'proj-1', name: 'Alpha Project', type: 'project' as const },
          { id: 'proj-2', name: 'Alpha Beta', type: 'project' as const },
        ],
      };

      vi.mocked(searchEndpoint.searchProjects).mockResolvedValue(mockSearchResponse);

      await projectsService.search('Alpha');

      expect(searchEndpoint.searchProjects).toHaveBeenCalledWith({
        q: 'Alpha',
        limit: '10',
      });
    });

    it('should search projects with custom limit', async () => {
      const mockSearchResponse = {
        data: [{ id: 'proj-1', name: 'Alpha Project', type: 'project' as const }],
      };

      vi.mocked(searchEndpoint.searchProjects).mockResolvedValue(mockSearchResponse);

      await projectsService.search('Alpha', 5);

      expect(searchEndpoint.searchProjects).toHaveBeenCalledWith({
        q: 'Alpha',
        limit: '5',
      });
    });

    it('should handle empty search results', async () => {
      const mockSearchResponse = {
        data: [],
      };

      vi.mocked(searchEndpoint.searchProjects).mockResolvedValue(mockSearchResponse);

      const result = await projectsService.search('NonExistent');

      expect(result.data).toHaveLength(0);
    });
  });

  describe('searchProjects', () => {
    it('should search active projects and return simplified format', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2, mockInactiveProject],
        total: 3,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      const result = await projectsService.searchProjects('Alpha');

      expect(result).toEqual([{ id: 'proj-1', name: 'Alpha Project' }]);
    });

    it('should filter out inactive projects', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2, mockInactiveProject],
        total: 3,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      const result = await projectsService.searchProjects('Project');

      // Should return only active projects
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'proj-1', name: 'Alpha Project' },
        { id: 'proj-2', name: 'Beta Project' },
      ]);
    });

    it('should be case-insensitive', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      const result = await projectsService.searchProjects('beta');

      expect(result).toEqual([{ id: 'proj-2', name: 'Beta Project' }]);
    });

    it('should return empty array when no matches found', async () => {
      const mockResponse = {
        data: [mockProject, mockProject2],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(projectsEndpoints.findAllProjects).mockResolvedValue(mockResponse);

      const result = await projectsService.searchProjects('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('bulkAssignMembers', () => {
    it('should bulk assign members with role', async () => {
      const mockResponse = {
        success: true,
        assigned: 3,
        failed: 0,
        errors: [],
      };

      vi.mocked(projectsEndpoints.bulkAssignMembers).mockResolvedValue(mockResponse);

      const result = await projectsService.bulkAssignMembers(
        'proj-1',
        ['user-1', 'user-2', 'user-3'],
        'member'
      );

      expect(projectsEndpoints.bulkAssignMembers).toHaveBeenCalledWith('proj-1', {
        userIds: ['user-1', 'user-2', 'user-3'],
        role: 'member',
      });
      expect(result.assigned).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should bulk assign members without role', async () => {
      const mockResponse = {
        success: true,
        assigned: 2,
        failed: 0,
        errors: [],
      };

      vi.mocked(projectsEndpoints.bulkAssignMembers).mockResolvedValue(mockResponse);

      await projectsService.bulkAssignMembers('proj-1', ['user-1', 'user-2']);

      expect(projectsEndpoints.bulkAssignMembers).toHaveBeenCalledWith('proj-1', {
        userIds: ['user-1', 'user-2'],
        role: undefined,
      });
    });

    it('should handle partial success in bulk assignment', async () => {
      const mockResponse = {
        success: true,
        assigned: 2,
        failed: 1,
        errors: ['user-3: Already assigned to project'],
      };

      vi.mocked(projectsEndpoints.bulkAssignMembers).mockResolvedValue(mockResponse);

      const result = await projectsService.bulkAssignMembers('proj-1', [
        'user-1',
        'user-2',
        'user-3',
      ]);

      expect(result.assigned).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle bulk assignment error', async () => {
      vi.mocked(projectsEndpoints.bulkAssignMembers).mockRejectedValue(
        new Error('Invalid user IDs')
      );

      await expect(
        projectsService.bulkAssignMembers('proj-1', ['invalid-user'])
      ).rejects.toThrow('Invalid user IDs');
    });
  });
});
