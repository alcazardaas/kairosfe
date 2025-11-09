/**
 * Employees/Users Service
 * High-level service for managing employee/user data
 * Uses the users API endpoints
 */

import { getUsers, createUser, updateUser, deleteUser, importUsers, downloadImportTemplate } from '../endpoints/users';
import type { ImportResult } from '../endpoints/users';
import type {
  UserListResponse,
  GetUsersParams,
  EmployeeStatus,
  UserRole,
  CreateEmployeeParams,
  UpdateEmployeeParams,
  CreateUserRequest,
  UpdateUserRequest,
  CreateUserResponse,
  UpdateUserResponse,
} from '@kairos/shared';

// Re-export types for backwards compatibility
export type { Employee, EmployeeStatus, UserRole } from '@kairos/shared';
export type { ImportResult } from '../endpoints/users';

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string; // Maps to 'q' parameter
  role?: UserRole;
  status?: EmployeeStatus;
  managerId?: string; // Maps to 'manager_id' parameter
  sort?: string; // e.g., 'name:asc', 'email:desc'
}

/**
 * Employees Service
 * Provides high-level functions for working with employee data
 */
export const employeesService = {
  /**
   * Get all employees with optional filters
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns Promise<UserListResponse> - Paginated list of employees
   */
  async getAll(params?: GetEmployeesParams): Promise<UserListResponse> {
    // Map service params to API params
    const apiParams: GetUsersParams = {
      page: params?.page,
      limit: params?.limit,
      q: params?.search, // search -> q
      role: params?.role,
      status: params?.status,
      manager_id: params?.managerId, // managerId -> manager_id
      sort: params?.sort as any, // Type assertion for sort format
    };

    return getUsers(apiParams);
  },

  /**
   * Get employees by role
   * @param role - User role to filter by
   * @param params - Additional query parameters
   */
  async getByRole(role: UserRole, params?: Omit<GetEmployeesParams, 'role'>): Promise<UserListResponse> {
    return this.getAll({ ...params, role });
  },

  /**
   * Get employees by status
   * @param status - Employee status to filter by
   * @param params - Additional query parameters
   */
  async getByStatus(
    status: EmployeeStatus,
    params?: Omit<GetEmployeesParams, 'status'>
  ): Promise<UserListResponse> {
    return this.getAll({ ...params, status });
  },

  /**
   * Get active employees only
   * @param params - Additional query parameters
   */
  async getActive(params?: Omit<GetEmployeesParams, 'status'>): Promise<UserListResponse> {
    return this.getByStatus('active', params);
  },

  /**
   * Get manager's direct reports
   * @param managerId - Manager's user ID (UUID)
   * @param params - Additional query parameters
   */
  async getDirectReports(
    managerId: string,
    params?: Omit<GetEmployeesParams, 'managerId'>
  ): Promise<UserListResponse> {
    return this.getAll({ ...params, managerId });
  },

  /**
   * Search employees by name or email
   * @param query - Search query string
   * @param params - Additional query parameters
   */
  async search(query: string, params?: Omit<GetEmployeesParams, 'search'>): Promise<UserListResponse> {
    return this.getAll({ ...params, search: query });
  },

  /**
   * Create a new employee/user
   * @param params - Employee creation parameters
   * @returns Promise<CreateUserResponse> - Created employee data
   */
  async create(params: CreateEmployeeParams): Promise<CreateUserResponse> {
    // Map service params to API request format
    const request: CreateUserRequest = {
      email: params.email,
      name: params.name,
      role: params.role,
      sendInvite: params.sendInvite !== undefined ? params.sendInvite : true,
    };

    // Add profile if any profile fields are provided
    if (
      params.jobTitle ||
      params.startDate ||
      params.managerId ||
      params.location ||
      params.phone
    ) {
      request.profile = {
        jobTitle: params.jobTitle ?? null,
        startDate: params.startDate ?? null,
        managerUserId: params.managerId ?? null, // managerId -> managerUserId
        location: params.location ?? null,
        phone: params.phone ?? null,
      };
    }

    // Ensure sendInvite is always a boolean
    if (request.sendInvite === undefined) {
      request.sendInvite = false;
    }

    return createUser(request);
  },

  /**
   * Update an existing employee/user
   * @param id - Employee UUID
   * @param params - Partial employee update parameters
   * @returns Promise<UpdateUserResponse> - Updated employee data
   */
  async update(id: string, params: UpdateEmployeeParams): Promise<UpdateUserResponse> {
    // Map service params to API request format
    const request: UpdateUserRequest = {};

    if (params.name !== undefined) request.name = params.name;
    if (params.role !== undefined) request.role = params.role;

    // Add profile updates if any profile fields are provided
    if (
      params.jobTitle !== undefined ||
      params.startDate !== undefined ||
      params.managerId !== undefined ||
      params.location !== undefined ||
      params.phone !== undefined
    ) {
      request.profile = {};
      if (params.jobTitle !== undefined) request.profile.jobTitle = params.jobTitle ?? null;
      if (params.startDate !== undefined) request.profile.startDate = params.startDate ?? null;
      if (params.managerId !== undefined)
        request.profile.managerUserId = params.managerId ?? null; // managerId -> managerUserId
      if (params.location !== undefined) request.profile.location = params.location ?? null;
      if (params.phone !== undefined) request.profile.phone = params.phone ?? null;
    }

    return updateUser(id, request);
  },

  /**
   * Deactivate an employee/user (soft delete)
   * Sets the user's status to 'disabled'
   * @param id - Employee UUID
   * @returns Promise<void>
   */
  async deactivate(id: string): Promise<void> {
    return deleteUser(id);
  },

  /**
   * Reactivate an employee/user
   * Sets the user's status back to 'active'
   * @param id - Employee UUID
   * @returns Promise<void>
   */
  async reactivate(id: string): Promise<void> {
    // Call PUT /users/:id/reactivate endpoint
    // This endpoint needs to be implemented by backend team
    // For now, we'll create the API call structure
    const { apiClient } = await import('../client');
    return apiClient.request<void>(`/users/${id}/reactivate`, {
      method: 'PUT',
      requiresAuth: true,
      operationId: 'UsersController_reactivate',
    });
  },

  /**
   * Invite a new employee with minimal information
   * Simplified helper for creating a user with invitation
   * @param email - Employee email
   * @param name - Employee name
   * @param role - Employee role
   * @returns Promise<CreateUserResponse> - Created employee data
   */
  async invite(email: string, name: string, role: UserRole): Promise<CreateUserResponse> {
    return this.create({
      email,
      name,
      role,
      sendInvite: true,
    });
  },

  /**
   * Search for managers (users with manager or admin role)
   * Used for manager dropdown in employee forms
   */
  async searchManagers(query: string): Promise<{ id: string; name: string }[]> {
    const response = await this.getAll({
      page: 1,
      limit: 50,
      search: query,
      role: undefined, // Get all roles
      status: 'active',
    });

    // Filter for managers and admins only, map to dropdown format
    return response.data
      .filter((user) => user.membership.role === 'manager' || user.membership.role === 'admin')
      .map((user) => ({
        id: user.id,
        name: user.name || user.email,
      }));
  },

  /**
   * Bulk import users from CSV or Excel file
   * @param file - CSV or Excel file (max 10MB)
   * @param dryRun - If true, validate only without creating users
   * @returns Promise<ImportResult> - Import result with success/error details
   */
  async bulkImport(file: File, dryRun: boolean = false): Promise<ImportResult> {
    return importUsers(file, dryRun);
  },

  /**
   * Download import template file
   * @param format - Template format ('csv' or 'xlsx')
   * @returns Promise<Blob> - Template file
   */
  async downloadTemplate(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    return downloadImportTemplate(format);
  },
};
