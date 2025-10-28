import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema } from './common';

/**
 * Time Entry-related schemas from OpenAPI spec
 */

// Time Entry DTO
export const TimeEntryDtoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  project_id: z.string().uuid(),
  task_id: z.string().uuid().nullable(),
  week_start_date: z.string().datetime(),
  day_of_week: z.number().min(0).max(6),
  hours: z.number(),
  note: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type TimeEntryDto = z.infer<typeof TimeEntryDtoSchema>;

// Time Entry Response
export const TimeEntryResponseSchema = createDataResponseSchema(TimeEntryDtoSchema);
export type TimeEntryResponse = z.infer<typeof TimeEntryResponseSchema>;

// Time Entry List Response
export const TimeEntryListResponseSchema = createPaginatedResponseSchema(TimeEntryDtoSchema);
export type TimeEntryListResponse = z.infer<typeof TimeEntryListResponseSchema>;

// Weekly Hours DTO
export const WeeklyHoursDtoSchema = z.object({
  userId: z.string().uuid(),
  weekStartDate: z.string(),
  totalHours: z.number(),
});

export type WeeklyHoursDto = z.infer<typeof WeeklyHoursDtoSchema>;

// Project Hours DTO
export const ProjectHoursDtoSchema = z.object({
  projectId: z.string().uuid(),
  totalHours: z.number(),
});

export type ProjectHoursDto = z.infer<typeof ProjectHoursDtoSchema>;
