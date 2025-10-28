import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema } from './common';

/**
 * Project-related schemas from OpenAPI spec
 */

// Project DTO
export const ProjectDtoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  active: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
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
