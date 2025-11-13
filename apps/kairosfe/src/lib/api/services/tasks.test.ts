/**
 * Comprehensive tests for Tasks Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tasksService } from './tasks';
import * as tasksEndpoints from '../endpoints/tasks';
import type { TaskDto } from '../schemas';

// Mock all endpoint functions
vi.mock('../endpoints/tasks');

describe('tasksService', () => {
  const mockTask: TaskDto = {
    id: 'task-1',
    tenantId: 'tenant-1',
    name: 'Implement Authentication',
    projectId: 'proj-1',
    parentTaskId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockSubTask: TaskDto = {
    id: 'task-2',
    tenantId: 'tenant-1',
    name: 'Setup JWT',
    projectId: 'proj-1',
    parentTaskId: 'task-1',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  };

  const mockTask2: TaskDto = {
    id: 'task-3',
    tenantId: 'tenant-1',
    name: 'Database Migration',
    projectId: 'proj-2',
    parentTaskId: null,
    createdAt: '2025-01-03T00:00:00.000Z',
    updatedAt: '2025-01-03T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all tasks without parameters', async () => {
      const mockResponse = {
        data: [mockTask, mockSubTask, mockTask2],
        total: 3,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.getAll();

      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expect.any(URLSearchParams));
      expect(result).toEqual(mockResponse);
    });

    it('should fetch tasks filtered by project ID', async () => {
      const mockResponse = {
        data: [mockTask, mockSubTask],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      await tasksService.getAll({ projectId: 'proj-1' });

      const expectedParams = new URLSearchParams({ project_id: 'proj-1' });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
    });

    it('should fetch tasks with search query', async () => {
      const mockResponse = {
        data: [mockTask],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      await tasksService.getAll({ search: 'Authentication' });

      const expectedParams = new URLSearchParams({ search: 'Authentication' });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
    });

    it('should fetch tasks with pagination', async () => {
      const mockResponse = {
        data: [mockTask],
        total: 100,
        page: 2,
        pageSize: 20,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      await tasksService.getAll({ page: 2, limit: 20 });

      const expectedParams = new URLSearchParams({
        page: '2',
        limit: '20',
      });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
    });

    it('should fetch tasks with all parameters combined', async () => {
      const mockResponse = {
        data: [mockTask],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      await tasksService.getAll({
        projectId: 'proj-1',
        search: 'Auth',
        page: 1,
        limit: 10,
      });

      const expectedParams = new URLSearchParams({
        project_id: 'proj-1',
        search: 'Auth',
        page: '1',
        limit: '10',
      });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.getAll({ search: 'NonExistent' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should fetch task by ID', async () => {
      const mockResponse = {
        data: mockTask,
      };

      vi.mocked(tasksEndpoints.findTaskById).mockResolvedValue(mockResponse);

      const result = await tasksService.getById('task-1');

      expect(tasksEndpoints.findTaskById).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle task not found error', async () => {
      vi.mocked(tasksEndpoints.findTaskById).mockRejectedValue(
        new Error('Task not found')
      );

      await expect(tasksService.getById('non-existent')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('create', () => {
    it('should create task without parent', async () => {
      const createData = {
        name: 'New Task',
        project_id: 'proj-1',
      };

      const mockResponse = {
        data: {
          ...mockTask,
          ...createData,
          id: 'task-new',
        },
      };

      vi.mocked(tasksEndpoints.createTask).mockResolvedValue(mockResponse);

      const result = await tasksService.create(createData);

      expect(tasksEndpoints.createTask).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockResponse);
    });

    it('should create subtask with parent task ID', async () => {
      const createData = {
        name: 'Sub Task',
        project_id: 'proj-1',
        parent_task_id: 'task-1',
      };

      const mockResponse = {
        data: {
          ...mockSubTask,
          name: 'Sub Task',
        },
      };

      vi.mocked(tasksEndpoints.createTask).mockResolvedValue(mockResponse);

      const result = await tasksService.create(createData);

      expect(tasksEndpoints.createTask).toHaveBeenCalledWith(createData);
      expect(result.data.parentTaskId).toBe('task-1');
    });

    it('should create task with null parent task ID', async () => {
      const createData = {
        name: 'Root Task',
        project_id: 'proj-1',
        parent_task_id: null,
      };

      const mockResponse = {
        data: {
          ...mockTask,
          name: 'Root Task',
        },
      };

      vi.mocked(tasksEndpoints.createTask).mockResolvedValue(mockResponse);

      await tasksService.create(createData);

      expect(tasksEndpoints.createTask).toHaveBeenCalledWith(createData);
    });

    it('should handle creation error', async () => {
      const createData = {
        name: 'Invalid Task',
        project_id: 'non-existent',
      };

      vi.mocked(tasksEndpoints.createTask).mockRejectedValue(
        new Error('Project not found')
      );

      await expect(tasksService.create(createData)).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('update', () => {
    it('should update task name', async () => {
      const updateData = {
        name: 'Updated Task Name',
      };

      const mockResponse = {
        data: {
          ...mockTask,
          ...updateData,
        },
      };

      vi.mocked(tasksEndpoints.updateTask).mockResolvedValue(mockResponse);

      const result = await tasksService.update('task-1', updateData);

      expect(tasksEndpoints.updateTask).toHaveBeenCalledWith('task-1', updateData);
      expect(result.data.name).toBe('Updated Task Name');
    });

    it('should update task project', async () => {
      const updateData = {
        project_id: 'proj-2',
      };

      const mockResponse = {
        data: {
          ...mockTask,
          projectId: 'proj-2',
        },
      };

      vi.mocked(tasksEndpoints.updateTask).mockResolvedValue(mockResponse);

      await tasksService.update('task-1', updateData);

      expect(tasksEndpoints.updateTask).toHaveBeenCalledWith('task-1', updateData);
    });

    it('should update parent task ID', async () => {
      const updateData = {
        parent_task_id: 'task-parent',
      };

      const mockResponse = {
        data: {
          ...mockTask,
          parentTaskId: 'task-parent',
        },
      };

      vi.mocked(tasksEndpoints.updateTask).mockResolvedValue(mockResponse);

      await tasksService.update('task-1', updateData);

      expect(tasksEndpoints.updateTask).toHaveBeenCalledWith('task-1', updateData);
    });

    it('should update parent task ID to null', async () => {
      const updateData = {
        parent_task_id: null,
      };

      const mockResponse = {
        data: {
          ...mockSubTask,
          parentTaskId: null,
        },
      };

      vi.mocked(tasksEndpoints.updateTask).mockResolvedValue(mockResponse);

      await tasksService.update('task-2', updateData);

      expect(tasksEndpoints.updateTask).toHaveBeenCalledWith('task-2', updateData);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        name: 'Renamed Task',
        project_id: 'proj-2',
        parent_task_id: 'task-parent',
      };

      const mockResponse = {
        data: {
          ...mockTask,
          name: 'Renamed Task',
          projectId: 'proj-2',
          parentTaskId: 'task-parent',
        },
      };

      vi.mocked(tasksEndpoints.updateTask).mockResolvedValue(mockResponse);

      await tasksService.update('task-1', updateData);

      expect(tasksEndpoints.updateTask).toHaveBeenCalledWith('task-1', updateData);
    });

    it('should handle update error', async () => {
      vi.mocked(tasksEndpoints.updateTask).mockRejectedValue(
        new Error('Task not found')
      );

      await expect(
        tasksService.update('non-existent', { name: 'Test' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('delete', () => {
    it('should delete task', async () => {
      vi.mocked(tasksEndpoints.deleteTask).mockResolvedValue(undefined);

      await tasksService.delete('task-1');

      expect(tasksEndpoints.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should handle deletion error', async () => {
      vi.mocked(tasksEndpoints.deleteTask).mockRejectedValue(
        new Error('Cannot delete task with existing time entries')
      );

      await expect(tasksService.delete('task-1')).rejects.toThrow(
        'Cannot delete task with existing time entries'
      );
    });
  });

  describe('getByProject', () => {
    it('should fetch tasks by project ID', async () => {
      const mockResponse = {
        data: [mockTask, mockSubTask],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.getByProject('proj-1');

      const expectedParams = new URLSearchParams({ project_id: 'proj-1' });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
      expect(result).toEqual(mockResponse);
    });

    it('should handle project with no tasks', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.getByProject('proj-empty');

      expect(result.data).toHaveLength(0);
    });
  });

  describe('searchTasks', () => {
    it('should search tasks and return simplified format', async () => {
      const mockResponse = {
        data: [mockTask, mockSubTask],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.searchTasks('Auth');

      const expectedParams = new URLSearchParams({
        search: 'Auth',
        limit: '50',
      });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
      expect(result).toEqual([
        { id: 'task-1', name: 'Implement Authentication' },
        { id: 'task-2', name: 'Setup JWT' },
      ]);
    });

    it('should search tasks filtered by project', async () => {
      const mockResponse = {
        data: [mockTask, mockSubTask],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.searchTasks('Auth', 'proj-1');

      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const callArgs = vi.mocked(tasksEndpoints.findAllTasks).mock.calls[0][0] as URLSearchParams;
      expect(callArgs.get('search')).toBe('Auth');
      expect(callArgs.get('project_id')).toBe('proj-1');
      expect(callArgs.get('limit')).toBe('50');
      expect(result).toHaveLength(2);
    });

    it('should limit results to 50 for dropdown performance', async () => {
      const mockResponse = {
        data: Array.from({ length: 100 }, (_, i) => ({
          ...mockTask,
          id: `task-${i}`,
          name: `Task ${i}`,
        })),
        total: 100,
        page: 1,
        pageSize: 100,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      await tasksService.searchTasks('Task');

      const expectedParams = new URLSearchParams({
        search: 'Task',
        limit: '50',
      });
      expect(tasksEndpoints.findAllTasks).toHaveBeenCalledWith(expectedParams);
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(tasksEndpoints.findAllTasks).mockResolvedValue(mockResponse);

      const result = await tasksService.searchTasks('NonExistent');

      expect(result).toEqual([]);
    });
  });
});
