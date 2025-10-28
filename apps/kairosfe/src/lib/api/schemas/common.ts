import { z } from 'zod';

/**
 * Common schemas shared across the API
 * Generated from OpenAPI spec at referenceFE/openapi.json
 */

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Pagination Meta Schema
export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

// Generic paginated response wrapper
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });

// Generic data wrapper
export const createDataResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });

// Roles enum
export const RoleSchema = z.enum(['admin', 'manager', 'employee']);
export type Role = z.infer<typeof RoleSchema>;

// Membership status enum
export const MembershipStatusSchema = z.enum(['active', 'inactive']);
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

// Timesheet status enum
export const TimesheetStatusSchema = z.enum(['draft', 'pending', 'approved', 'rejected']);
export type TimesheetStatus = z.infer<typeof TimesheetStatusSchema>;

// Leave request status enum
export const LeaveRequestStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);
export type LeaveRequestStatus = z.infer<typeof LeaveRequestStatusSchema>;

// Unit enum
export const UnitSchema = z.enum(['days', 'hours']);
export type Unit = z.infer<typeof UnitSchema>;

// Database connection status enum
export const DatabaseStatusSchema = z.enum(['connected', 'disconnected']);
export type DatabaseStatus = z.infer<typeof DatabaseStatusSchema>;
