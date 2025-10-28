import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema } from './common';

/**
 * Task-related schemas from OpenAPI spec
 */

// Task DTO
export const TaskDtoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string(),
  parent_task_id: z.string().uuid().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TaskDto = z.infer<typeof TaskDtoSchema>;

// Task Response
export const TaskResponseSchema = createDataResponseSchema(TaskDtoSchema);
export type TaskResponse = z.infer<typeof TaskResponseSchema>;

// Task List Response
export const TaskListResponseSchema = createPaginatedResponseSchema(TaskDtoSchema);
export type TaskListResponse = z.infer<typeof TaskListResponseSchema>;
