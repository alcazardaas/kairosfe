import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema } from './common';

/**
 * Project-related schemas from OpenAPI spec
 */

// Project DTO - matches backend camelCase format
export const ProjectDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  active: z.boolean(),
  description: z.string().nullable(),
  startDate: z.string().nullable(), // YYYY-MM-DD format
  endDate: z.string().nullable(), // YYYY-MM-DD format
  clientName: z.string().nullable(),
  budgetHours: z.string().nullable(), // Decimal string from backend
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProjectDto = z.infer<typeof ProjectDtoSchema>;

// Project Response
export const ProjectResponseSchema = createDataResponseSchema(ProjectDtoSchema);
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

// Project List Response
export const ProjectListResponseSchema = createPaginatedResponseSchema(ProjectDtoSchema);
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

// Project Member DTO
export const ProjectMemberDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type ProjectMemberDto = z.infer<typeof ProjectMemberDtoSchema>;

// Project Member Response
export const ProjectMemberResponseSchema = createDataResponseSchema(ProjectMemberDtoSchema);
export type ProjectMemberResponse = z.infer<typeof ProjectMemberResponseSchema>;

// Project Members Response
export const ProjectMembersResponseSchema = z.object({
  data: z.array(ProjectMemberDtoSchema),
});

export type ProjectMembersResponse = z.infer<typeof ProjectMembersResponseSchema>;

// Create Project DTO - matches backend camelCase format
export const CreateProjectDtoSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).nullable().optional(),
  active: z.boolean().optional(),
  description: z.string().max(2000).nullable().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  clientName: z.string().max(255).nullable().optional(),
  budgetHours: z.number().positive().nullable().optional(),
});

export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

// Update Project DTO (all fields optional) - matches backend camelCase format
export const UpdateProjectDtoSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(50).nullable().optional(),
  active: z.boolean().optional(),
  description: z.string().max(2000).nullable().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  clientName: z.string().max(255).nullable().optional(),
  budgetHours: z.number().positive().nullable().optional(),
});

export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

// Assign Project Member DTO
export const AssignProjectMemberDtoSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['member', 'lead', 'observer']).optional(),
});

export type AssignProjectMemberDto = z.infer<typeof AssignProjectMemberDtoSchema>;

// Bulk Assign Members DTO
export const BulkAssignMembersDtoSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  role: z.enum(['member', 'lead', 'observer']).optional(),
});

export type BulkAssignMembersDto = z.infer<typeof BulkAssignMembersDtoSchema>;

// Bulk Assignment Result Item
const BulkAssignmentSuccessSchema = z.object({
  userId: z.string().uuid(),
  membershipId: z.string().uuid(),
});

const BulkAssignmentFailureSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string(),
});

// Bulk Assignment Response
export const BulkAssignmentResponseSchema = z.object({
  data: z.object({
    success: z.array(BulkAssignmentSuccessSchema),
    failed: z.array(BulkAssignmentFailureSchema),
  }),
  summary: z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number(),
  }),
});

export type BulkAssignmentResponse = z.infer<typeof BulkAssignmentResponseSchema>;
