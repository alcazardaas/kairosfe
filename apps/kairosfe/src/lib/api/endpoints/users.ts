/**
 * Users/Employees endpoints
 * Based on API documentation at referenceFE/API_USERS_ENDPOINT.md
 */

import { apiClient } from '../client';
import type {
  UserListResponse,
  GetUsersQueryParams,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '../schemas/users';
import {
  UserListResponseSchema,
  CreateUserResponseSchema,
  UpdateUserResponseSchema,
} from '../schemas/users';

/**
 * UsersController_findAll
 * GET /users
 * Retrieve a paginated list of employees within a tenant
 *
 * Access: Admin and Manager roles only
 *
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise<UserListResponse> - Paginated list of employees with metadata
 *
 * @example
 * // Get active employees
 * const users = await getUsers({ status: 'active', page: 1, limit: 20 });
 *
 * @example
 * // Search by name/email
 * const users = await getUsers({ q: 'john', sort: 'name:asc' });
 *
 * @example
 * // Get manager's direct reports
 * const users = await getUsers({ manager_id: 'uuid-here' });
 */
export async function getUsers(params?: GetUsersQueryParams): Promise<UserListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.q) queryParams.append('q', params.q);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.manager_id) queryParams.append('manager_id', params.manager_id);

  const endpoint = `/users${queryParams.toString() ? `?${queryParams}` : ''}`;

  return apiClient.request<UserListResponse>(endpoint, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'UsersController_findAll',
    schema: UserListResponseSchema,
  });
}

/**
 * UsersController_create
 * POST /users
 * Create a new user/employee and optionally send invitation email
 *
 * Access: Admin and Manager roles only
 *
 * @param data - User creation data (email, name, role, profile, sendInvite)
 * @returns Promise<CreateUserResponse> - Created user with membership and profile
 *
 * @example
 * // Create employee with full profile
 * const newUser = await createUser({
 *   email: 'john.doe@example.com',
 *   name: 'John Doe',
 *   role: 'employee',
 *   profile: {
 *     jobTitle: 'Frontend Developer',
 *     startDate: '2025-10-26',
 *     managerUserId: 'manager-uuid',
 *     location: 'Lisbon',
 *     phone: '+351912345678'
 *   },
 *   sendInvite: true
 * });
 *
 * @throws {400} Invalid email format or validation error
 * @throws {401} Invalid or expired session token
 * @throws {403} Forbidden - requires admin or manager role
 * @throws {409} Email already exists for this tenant
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  return apiClient.request<CreateUserResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'UsersController_create',
    schema: CreateUserResponseSchema,
  });
}

/**
 * UsersController_update
 * PATCH /users/{id}
 * Update an existing user's information
 *
 * Access: Admin and Manager roles only
 *
 * @param id - User UUID
 * @param data - Partial user update data (name, role, profile fields)
 * @returns Promise<UpdateUserResponse> - Updated user data
 *
 * @example
 * // Update user role and job title
 * const updated = await updateUser('user-uuid', {
 *   role: 'manager',
 *   profile: {
 *     jobTitle: 'Lead Frontend Engineer'
 *   }
 * });
 *
 * @throws {400} Invalid manager hierarchy or validation error
 * @throws {403} You cannot change your own role
 * @throws {404} User not found
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<UpdateUserResponse> {
  return apiClient.request<UpdateUserResponse>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'UsersController_update',
    schema: UpdateUserResponseSchema,
  });
}

/**
 * UsersController_delete
 * DELETE /users/{id}
 * Deactivate a user (soft delete - sets status to 'disabled')
 *
 * Access: Admin only
 *
 * @param id - User UUID
 * @returns Promise<void> - No content (204)
 *
 * @example
 * // Deactivate user
 * await deleteUser('user-uuid');
 *
 * @throws {401} Invalid or expired session token
 * @throws {403} Forbidden - requires admin role
 * @throws {404} User not found
 */
export async function deleteUser(id: string): Promise<void> {
  return apiClient.request<void>(`/users/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'UsersController_delete',
  });
}

/**
 * Bulk Import Types
 */
export interface ImportRowError {
  row: number;
  email: string;
  errors: string[];
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'invited' | 'active' | 'disabled';
  note?: string;
}

export interface ImportResult {
  success: boolean;
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  errorCount: number;
  createdCount?: number;
  existingCount?: number;
  message?: string;
  errors?: ImportRowError[];
  createdUsers?: UserSummary[];
  existingUsers?: UserSummary[];
}

/**
 * UsersController_importUsers
 * POST /users/import
 * Bulk import users from CSV or Excel file
 *
 * Access: Admin only
 *
 * @param file - CSV or Excel file (max 10MB)
 * @param dryRun - If true, validate only without creating users
 * @returns Promise<ImportResult> - Import result with success/error details
 *
 * @example
 * // Validate file (dry-run)
 * const result = await importUsers(file, true);
 *
 * @example
 * // Import users
 * const result = await importUsers(file, false);
 *
 * @throws {400} Invalid file type, empty file, or validation errors
 * @throws {401} Invalid or expired session token
 * @throws {403} Forbidden - requires admin role
 * @throws {413} File size exceeds 10MB limit
 */
export async function importUsers(file: File, dryRun: boolean = false): Promise<ImportResult> {
  const endpoint = `/users/import?dryRun=${dryRun}`;
  return apiClient.upload<ImportResult>(endpoint, file, true);
}

/**
 * UsersController_downloadTemplate
 * GET /users/import/template
 * Download import template file
 *
 * Access: Admin only
 *
 * @param format - Template format ('csv' or 'xlsx')
 * @returns Promise<Blob> - Template file
 *
 * @example
 * // Download CSV template
 * const blob = await downloadImportTemplate('csv');
 * const url = window.URL.createObjectURL(blob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = 'user-import-template.csv';
 * link.click();
 */
export async function downloadImportTemplate(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
  const endpoint = `/users/import/template?format=${format}`;
  return apiClient.downloadFile(endpoint, true);
}
