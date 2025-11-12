/**
 * Comprehensive tests for Employees Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { employeesService } from './employees';
import * as usersEndpoints from '../endpoints/users';
import { apiClient } from '../client';

// Mock endpoints and API client
vi.mock('../endpoints/users');
vi.mock('../client');

describe('employeesService', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    membership: {
      role: 'employee' as const,
      status: 'active' as const,
    },
    profile: {
      jobTitle: 'Developer',
      startDate: '2024-01-01',
      managerUserId: null,
      location: null,
      phone: null,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockUserListResponse = {
    data: [mockUser],
    page: 1,
    limit: 10,
    total: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all employees without parameters', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      const result = await employeesService.getAll();

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUserListResponse);
    });

    it('should fetch employees with page and limit', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({ page: 2, limit: 20 });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
      });
    });

    it('should fetch employees with search query', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({ search: 'john' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        q: 'john',
      });
    });

    it('should fetch employees by role', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({ role: 'manager' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        role: 'manager',
      });
    });

    it('should fetch employees by status', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({ status: 'active' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        status: 'active',
      });
    });

    it('should fetch employees by manager', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({ managerId: 'manager-1' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        manager_id: 'manager-1',
      });
    });

    it('should fetch employees with sort', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({ sort: 'name:asc' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        sort: 'name:asc',
      });
    });

    it('should fetch employees with all parameters combined', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getAll({
        page: 2,
        limit: 20,
        search: 'john',
        role: 'manager',
        status: 'active',
        managerId: 'manager-1',
        sort: 'name:asc',
      });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        q: 'john',
        role: 'manager',
        status: 'active',
        manager_id: 'manager-1',
        sort: 'name:asc',
      });
    });
  });

  describe('getByRole', () => {
    it('should fetch employees by role', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      const result = await employeesService.getByRole('manager');

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        role: 'manager',
      });
      expect(result).toEqual(mockUserListResponse);
    });

    it('should fetch employees by role with additional params', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getByRole('admin', { page: 1, limit: 10 });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: 'admin',
      });
    });
  });

  describe('getByStatus', () => {
    it('should fetch employees by status', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      const result = await employeesService.getByStatus('active');

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(result).toEqual(mockUserListResponse);
    });

    it('should fetch employees by status with additional params', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getByStatus('disabled', { search: 'test' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        q: 'test',
        status: 'disabled',
      });
    });
  });

  describe('getActive', () => {
    it('should fetch active employees', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      const result = await employeesService.getActive();

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(result).toEqual(mockUserListResponse);
    });

    it('should fetch active employees with additional params', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getActive({ role: 'manager' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        role: 'manager',
        status: 'active',
      });
    });
  });

  describe('getDirectReports', () => {
    it('should fetch manager direct reports', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      const result = await employeesService.getDirectReports('manager-1');

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        manager_id: 'manager-1',
      });
      expect(result).toEqual(mockUserListResponse);
    });

    it('should fetch direct reports with additional params', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.getDirectReports('manager-1', { status: 'active' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        status: 'active',
        manager_id: 'manager-1',
      });
    });
  });

  describe('search', () => {
    it('should search employees by query', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      const result = await employeesService.search('john');

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        q: 'john',
      });
      expect(result).toEqual(mockUserListResponse);
    });

    it('should search employees with additional params', async () => {
      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockUserListResponse);

      await employeesService.search('john', { role: 'employee' });

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        role: 'employee',
        q: 'john',
      });
    });
  });

  describe('create', () => {
    const mockCreateResponse = {
      data: mockUser,
    };

    it('should create employee with minimal data', async () => {
      vi.mocked(usersEndpoints.createUser).mockResolvedValue(mockCreateResponse);

      const createParams = {
        email: 'new@test.com',
        name: 'New User',
        role: 'employee' as const,
      };

      const result = await employeesService.create(createParams);

      expect(usersEndpoints.createUser).toHaveBeenCalledWith({
        email: 'new@test.com',
        name: 'New User',
        role: 'employee',
        sendInvite: true,
      });
      expect(result).toEqual(mockCreateResponse);
    });

    it('should create employee without sending invite', async () => {
      vi.mocked(usersEndpoints.createUser).mockResolvedValue(mockCreateResponse);

      const createParams = {
        email: 'new@test.com',
        name: 'New User',
        role: 'employee' as const,
        sendInvite: false,
      };

      await employeesService.create(createParams);

      expect(usersEndpoints.createUser).toHaveBeenCalledWith({
        email: 'new@test.com',
        name: 'New User',
        role: 'employee',
        sendInvite: false,
      });
    });

    it('should create employee with full profile data', async () => {
      vi.mocked(usersEndpoints.createUser).mockResolvedValue(mockCreateResponse);

      const createParams = {
        email: 'new@test.com',
        name: 'New User',
        role: 'employee' as const,
        jobTitle: 'Senior Developer',
        startDate: '2025-02-01',
        managerId: 'manager-1',
        location: 'New York',
        phone: '+1234567890',
      };

      await employeesService.create(createParams);

      expect(usersEndpoints.createUser).toHaveBeenCalledWith({
        email: 'new@test.com',
        name: 'New User',
        role: 'employee',
        sendInvite: true,
        profile: {
          jobTitle: 'Senior Developer',
          startDate: '2025-02-01',
          managerUserId: 'manager-1',
          location: 'New York',
          phone: '+1234567890',
        },
      });
    });

    it('should create employee with partial profile data', async () => {
      vi.mocked(usersEndpoints.createUser).mockResolvedValue(mockCreateResponse);

      const createParams = {
        email: 'new@test.com',
        name: 'New User',
        role: 'employee' as const,
        jobTitle: 'Developer',
      };

      await employeesService.create(createParams);

      expect(usersEndpoints.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            jobTitle: 'Developer',
          }),
        })
      );
    });

    it('should handle creation error', async () => {
      vi.mocked(usersEndpoints.createUser).mockRejectedValue(
        new Error('Email already exists')
      );

      const createParams = {
        email: 'existing@test.com',
        name: 'New User',
        role: 'employee' as const,
      };

      await expect(employeesService.create(createParams)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('update', () => {
    const mockUpdateResponse = {
      data: mockUser,
    };

    it('should update employee name', async () => {
      vi.mocked(usersEndpoints.updateUser).mockResolvedValue(mockUpdateResponse);

      const result = await employeesService.update('user-1', { name: 'Updated Name' });

      expect(usersEndpoints.updateUser).toHaveBeenCalledWith('user-1', {
        name: 'Updated Name',
      });
      expect(result).toEqual(mockUpdateResponse);
    });

    it('should update employee role', async () => {
      vi.mocked(usersEndpoints.updateUser).mockResolvedValue(mockUpdateResponse);

      await employeesService.update('user-1', { role: 'manager' });

      expect(usersEndpoints.updateUser).toHaveBeenCalledWith('user-1', {
        role: 'manager',
      });
    });

    it('should update employee profile fields', async () => {
      vi.mocked(usersEndpoints.updateUser).mockResolvedValue(mockUpdateResponse);

      await employeesService.update('user-1', {
        jobTitle: 'Senior Developer',
        location: 'Remote',
      });

      expect(usersEndpoints.updateUser).toHaveBeenCalledWith('user-1', {
        profile: {
          jobTitle: 'Senior Developer',
          location: 'Remote',
        },
      });
    });

    it('should update both basic and profile fields', async () => {
      vi.mocked(usersEndpoints.updateUser).mockResolvedValue(mockUpdateResponse);

      await employeesService.update('user-1', {
        name: 'Updated Name',
        jobTitle: 'Lead Developer',
        managerId: 'manager-2',
      });

      expect(usersEndpoints.updateUser).toHaveBeenCalledWith('user-1', {
        name: 'Updated Name',
        profile: {
          jobTitle: 'Lead Developer',
          managerUserId: 'manager-2',
        },
      });
    });

    it('should handle null profile values', async () => {
      vi.mocked(usersEndpoints.updateUser).mockResolvedValue(mockUpdateResponse);

      await employeesService.update('user-1', {
        managerId: null,
        phone: null,
      });

      expect(usersEndpoints.updateUser).toHaveBeenCalledWith('user-1', {
        profile: {
          managerUserId: null,
          phone: null,
        },
      });
    });

    it('should handle update error', async () => {
      vi.mocked(usersEndpoints.updateUser).mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        employeesService.update('non-existent', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('deactivate', () => {
    it('should deactivate employee', async () => {
      vi.mocked(usersEndpoints.deleteUser).mockResolvedValue(undefined);

      await employeesService.deactivate('user-1');

      expect(usersEndpoints.deleteUser).toHaveBeenCalledWith('user-1');
    });

    it('should handle deactivation error', async () => {
      vi.mocked(usersEndpoints.deleteUser).mockRejectedValue(
        new Error('User not found')
      );

      await expect(employeesService.deactivate('non-existent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('reactivate', () => {
    it('should reactivate employee', async () => {
      vi.mocked(apiClient.request).mockResolvedValue(undefined);

      await employeesService.reactivate('user-1');

      expect(apiClient.request).toHaveBeenCalledWith('/users/user-1/reactivate', {
        method: 'PUT',
        requiresAuth: true,
        operationId: 'UsersController_reactivate',
      });
    });

    it('should handle reactivation error', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(
        new Error('User not found')
      );

      await expect(employeesService.reactivate('non-existent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('invite', () => {
    const mockCreateResponse = {
      data: mockUser,
    };

    it('should invite new employee', async () => {
      vi.mocked(usersEndpoints.createUser).mockResolvedValue(mockCreateResponse);

      const result = await employeesService.invite('new@test.com', 'New User', 'employee');

      expect(usersEndpoints.createUser).toHaveBeenCalledWith({
        email: 'new@test.com',
        name: 'New User',
        role: 'employee',
        sendInvite: true,
      });
      expect(result).toEqual(mockCreateResponse);
    });

    it('should invite manager', async () => {
      vi.mocked(usersEndpoints.createUser).mockResolvedValue(mockCreateResponse);

      await employeesService.invite('manager@test.com', 'Manager User', 'manager');

      expect(usersEndpoints.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'manager',
          sendInvite: true,
        })
      );
    });
  });

  describe('searchManagers', () => {
    it('should search and filter managers', async () => {
      const mockManagersResponse = {
        data: [
          {
            ...mockUser,
            id: 'manager-1',
            name: 'Manager One',
            membership: { role: 'manager' as const, status: 'active' as const },
          },
          {
            ...mockUser,
            id: 'admin-1',
            name: 'Admin User',
            membership: { role: 'admin' as const, status: 'active' as const },
          },
          {
            ...mockUser,
            id: 'employee-1',
            name: 'Employee User',
            membership: { role: 'employee' as const, status: 'active' as const },
          },
        ],
        page: 1,
        limit: 50,
        total: 3,
      };

      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockManagersResponse);

      const result = await employeesService.searchManagers('john');

      expect(usersEndpoints.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        q: 'john',
        role: undefined,
        status: 'active',
      });

      // Should only return managers and admins, not employees
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'manager-1', name: 'Manager One' },
        { id: 'admin-1', name: 'Admin User' },
      ]);
    });

    it('should handle empty search results', async () => {
      const mockEmptyResponse = {
        data: [],
        page: 1,
        limit: 50,
        total: 0,
      };

      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockEmptyResponse);

      const result = await employeesService.searchManagers('nonexistent');

      expect(result).toEqual([]);
    });

    it('should use email as name fallback', async () => {
      const mockManagersResponse = {
        data: [
          {
            ...mockUser,
            id: 'manager-1',
            name: null,
            email: 'manager@test.com',
            membership: { role: 'manager' as const, status: 'active' as const },
          },
        ],
        page: 1,
        limit: 50,
        total: 1,
      };

      vi.mocked(usersEndpoints.getUsers).mockResolvedValue(mockManagersResponse);

      const result = await employeesService.searchManagers('test');

      expect(result).toEqual([{ id: 'manager-1', name: 'manager@test.com' }]);
    });
  });

  describe('bulkImport', () => {
    it('should import users with dryRun false', async () => {
      const mockImportResult = {
        success: true,
        created: 10,
        updated: 0,
        errors: [],
      };

      vi.mocked(usersEndpoints.importUsers).mockResolvedValue(mockImportResult);

      const mockFile = new File(['content'], 'users.csv', { type: 'text/csv' });
      const result = await employeesService.bulkImport(mockFile, false);

      expect(usersEndpoints.importUsers).toHaveBeenCalledWith(mockFile, false);
      expect(result).toEqual(mockImportResult);
    });

    it('should import users with dryRun true', async () => {
      const mockImportResult = {
        success: true,
        created: 0,
        updated: 0,
        errors: [],
      };

      vi.mocked(usersEndpoints.importUsers).mockResolvedValue(mockImportResult);

      const mockFile = new File(['content'], 'users.csv', { type: 'text/csv' });
      await employeesService.bulkImport(mockFile, true);

      expect(usersEndpoints.importUsers).toHaveBeenCalledWith(mockFile, true);
    });

    it('should default dryRun to false', async () => {
      const mockImportResult = {
        success: true,
        created: 5,
        updated: 0,
        errors: [],
      };

      vi.mocked(usersEndpoints.importUsers).mockResolvedValue(mockImportResult);

      const mockFile = new File(['content'], 'users.csv', { type: 'text/csv' });
      await employeesService.bulkImport(mockFile);

      expect(usersEndpoints.importUsers).toHaveBeenCalledWith(mockFile, false);
    });

    it('should handle import errors', async () => {
      vi.mocked(usersEndpoints.importUsers).mockRejectedValue(
        new Error('Invalid file format')
      );

      const mockFile = new File(['content'], 'users.txt', { type: 'text/plain' });

      await expect(employeesService.bulkImport(mockFile)).rejects.toThrow(
        'Invalid file format'
      );
    });
  });

  describe('downloadTemplate', () => {
    it('should download CSV template by default', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });

      vi.mocked(usersEndpoints.downloadImportTemplate).mockResolvedValue(mockBlob);

      const result = await employeesService.downloadTemplate();

      expect(usersEndpoints.downloadImportTemplate).toHaveBeenCalledWith('csv');
      expect(result).toEqual(mockBlob);
    });

    it('should download CSV template explicitly', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });

      vi.mocked(usersEndpoints.downloadImportTemplate).mockResolvedValue(mockBlob);

      await employeesService.downloadTemplate('csv');

      expect(usersEndpoints.downloadImportTemplate).toHaveBeenCalledWith('csv');
    });

    it('should download XLSX template', async () => {
      const mockBlob = new Blob(['xlsx content'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      vi.mocked(usersEndpoints.downloadImportTemplate).mockResolvedValue(mockBlob);

      const result = await employeesService.downloadTemplate('xlsx');

      expect(usersEndpoints.downloadImportTemplate).toHaveBeenCalledWith('xlsx');
      expect(result).toEqual(mockBlob);
    });

    it('should handle download error', async () => {
      vi.mocked(usersEndpoints.downloadImportTemplate).mockRejectedValue(
        new Error('Template not found')
      );

      await expect(employeesService.downloadTemplate()).rejects.toThrow(
        'Template not found'
      );
    });
  });
});
