import { z } from 'zod';

/**
 * Zod schemas for Users/Employees API
 * Based on GET /api/v1/users endpoint
 */

// Enums
export const UserRoleSchema = z.enum(['admin', 'manager', 'employee']);
export const EmployeeStatusSchema = z.enum(['active', 'invited', 'disabled']);
export const SortDirectionSchema = z.enum(['asc', 'desc']);
export const UserSortFieldSchema = z.enum(['name', 'email', 'created_at', 'role', 'status']);

// Employee Membership Schema
export const EmployeeMembershipSchema = z.object({
  role: UserRoleSchema,
  status: EmployeeStatusSchema,
  createdAt: z.string(), // ISO 8601
});

// Employee Profile Schema
export const EmployeeProfileSchema = z.object({
  jobTitle: z.string().nullable(),
  startDate: z.string().nullable(), // YYYY-MM-DD
  managerUserId: z.string().uuid().nullable(),
  location: z.string().nullable(),
  phone: z.string().nullable(),
});

// Employee Schema
export const EmployeeSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  locale: z.string().nullable(),
  createdAt: z.string(), // ISO 8601
  lastLoginAt: z.string().nullable(), // ISO 8601
  membership: EmployeeMembershipSchema,
  profile: EmployeeProfileSchema.nullable(),
});

// Pagination Meta Schema
export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

// User List Response Schema
export const UserListResponseSchema = z.object({
  data: z.array(EmployeeSchema),
  meta: PaginationMetaSchema,
});

// Query Parameters Schema
export const GetUsersQueryParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.string().regex(/^(name|email|created_at|role|status):(asc|desc)$/).optional(),
  q: z.string().optional(), // search by name or email
  role: UserRoleSchema.optional(),
  status: EmployeeStatusSchema.optional(),
  manager_id: z.string().uuid().optional(),
});

// Create User Schemas
export const CreateUserProfileSchema = z.object({
  jobTitle: z.string().nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // YYYY-MM-DD
  managerUserId: z.string().uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).nullable().optional(), // E.164 format
});

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
  profile: CreateUserProfileSchema.optional(),
  sendInvite: z.boolean().optional().default(true),
});

export const CreateUserResponseDataSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    locale: z.string().nullable(),
    createdAt: z.string(), // ISO 8601
    updatedAt: z.string(), // ISO 8601
  }),
  membership: z.object({
    tenantId: z.string().uuid(),
    role: UserRoleSchema,
    status: EmployeeStatusSchema,
  }),
  profile: EmployeeProfileSchema.nullable(),
});

export const CreateUserResponseSchema = z.object({
  data: CreateUserResponseDataSchema,
});

// Update User Schemas
export const UpdateUserProfileSchema = z.object({
  jobTitle: z.string().nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  managerUserId: z.string().uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).nullable().optional(),
});

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  role: UserRoleSchema.optional(),
  profile: UpdateUserProfileSchema.optional(),
});

export const UpdateUserResponseSchema = z.object({
  data: CreateUserResponseDataSchema, // Same structure as create
});

// Type exports
export type EmployeeMembership = z.infer<typeof EmployeeMembershipSchema>;
export type EmployeeProfile = z.infer<typeof EmployeeProfileSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type GetUsersQueryParams = z.infer<typeof GetUsersQueryParamsSchema>;
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponseData = z.infer<typeof CreateUserResponseDataSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
