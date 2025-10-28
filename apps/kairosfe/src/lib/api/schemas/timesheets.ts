import { z } from 'zod';
import { createDataResponseSchema, TimesheetStatusSchema } from './common';

/**
 * Timesheet-related schemas from OpenAPI spec
 */

// Timesheet DTO
export const TimesheetDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  weekStartDate: z.string(),
  status: TimesheetStatusSchema,
  submittedAt: z.string().datetime().nullable(),
  submittedByUserId: z.string().uuid().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  reviewedByUserId: z.string().uuid().nullable(),
  reviewNote: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  time_entries: z.array(z.string()).optional(),
});

export type TimesheetDto = z.infer<typeof TimesheetDtoSchema>;

// Timesheet Response
export const TimesheetResponseSchema = createDataResponseSchema(TimesheetDtoSchema);
export type TimesheetResponse = z.infer<typeof TimesheetResponseSchema>;

// Timesheet List Response
export const TimesheetListResponseSchema = z.object({
  data: z.array(TimesheetDtoSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
});

export type TimesheetListResponse = z.infer<typeof TimesheetListResponseSchema>;
