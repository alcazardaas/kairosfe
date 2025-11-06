import { z } from 'zod';
import { createDataResponseSchema } from './common';

/**
 * Time Entry-related schemas from OpenAPI spec
 */

// Time Entry DTO
export const TimeEntryDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  weekStartDate: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  hours: z.number(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

export type TimeEntryDto = z.infer<typeof TimeEntryDtoSchema>;

// Time Entry Response
export const TimeEntryResponseSchema = createDataResponseSchema(TimeEntryDtoSchema);
export type TimeEntryResponse = z.infer<typeof TimeEntryResponseSchema>;

// Time Entry List Response
// Using flat pagination structure to match backend format (same as timesheets)
export const TimeEntryListResponseSchema = z.object({
  data: z.array(TimeEntryDtoSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});
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

// Daily Total DTO (for week view)
export const DailyTotalDtoSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  totalHours: z.number(),
});

export type DailyTotalDto = z.infer<typeof DailyTotalDtoSchema>;

// Project Breakdown DTO (for week view)
export const ProjectBreakdownDtoSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string(),
  totalHours: z.number(),
});

export type ProjectBreakdownDto = z.infer<typeof ProjectBreakdownDtoSchema>;

// Week View Response (optimized endpoint for Epic 1 Story 1)
export const WeekViewResponseSchema = z.object({
  timesheet: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    weekStartDate: z.string(),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']),
    submittedAt: z.string().nullable(),
    reviewedAt: z.string().nullable(),
    reviewNote: z.string().nullable(),
  }).nullable(), // Timesheet can be null when no timesheet exists for the week
  entries: z.array(TimeEntryDtoSchema),
  dailyTotals: z.array(DailyTotalDtoSchema),
  weeklyTotal: z.number(),
  projectBreakdown: z.array(ProjectBreakdownDtoSchema),
});

export type WeekViewResponse = z.infer<typeof WeekViewResponseSchema>;

// Bulk Operation Request (Epic 2 Story 4 & 5)
export const BulkTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  dayOfWeek: z.number().min(0).max(6),
  hours: z.number(),
  note: z.string().optional(),
});

export const BulkOperationRequestSchema = z.object({
  userId: z.string().uuid(),
  weekStartDate: z.string(),
  entries: z.array(BulkTimeEntrySchema),
});

export type BulkOperationRequest = z.infer<typeof BulkOperationRequestSchema>;

// Bulk Operation Response
export const BulkOperationResponseSchema = z.object({
  created: z.number(),
  updated: z.number(),
  failed: z.number(),
  entries: z.array(TimeEntryDtoSchema),
});

export type BulkOperationResponse = z.infer<typeof BulkOperationResponseSchema>;

// Copy Week Request (Epic 2 Story 6)
export const CopyWeekRequestSchema = z.object({
  fromWeekStart: z.string(),
  toWeekStart: z.string(),
});

export type CopyWeekRequest = z.infer<typeof CopyWeekRequestSchema>;

// Validation Error DTO (Epic 3 Story 3)
export const ValidationErrorDtoSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
});

export type ValidationErrorDto = z.infer<typeof ValidationErrorDtoSchema>;

// Validation Result (Epic 3 Story 3)
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorDtoSchema),
  canSubmit: z.boolean(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;
