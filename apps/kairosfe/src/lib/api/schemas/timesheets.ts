import { z } from 'zod';
import { createDataResponseSchema, TimesheetStatusSchema } from './common';

/**
 * Timesheet-related schemas from OpenAPI spec
 */

// Timesheet DTO
export const TimesheetDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(), // Backend may not include this field
  userId: z.string().uuid(),
  weekStartDate: z.string(),
  status: TimesheetStatusSchema,
  submittedAt: z.string().nullable(),
  submittedByUserId: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  reviewedByUserId: z.string().nullable(),
  reviewNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeEntries: z.array(z.string()).optional(),
  // Additional fields from backend API response
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  totalHours: z.number().optional(),
});

export type TimesheetDto = z.infer<typeof TimesheetDtoSchema>;

// Timesheet Response
export const TimesheetResponseSchema = createDataResponseSchema(TimesheetDtoSchema);
export type TimesheetResponse = z.infer<typeof TimesheetResponseSchema>;

// Timesheet List Response
export const TimesheetListResponseSchema = z.object({
  data: z.array(TimesheetDtoSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export type TimesheetListResponse = z.infer<typeof TimesheetListResponseSchema>;
