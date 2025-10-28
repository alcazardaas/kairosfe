import { z } from 'zod';
import { createDataResponseSchema, RoleSchema, MembershipStatusSchema } from './common';

/**
 * Auth-related schemas from OpenAPI spec
 */

// Login Request
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantId: z.string().uuid().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Login Response Data
export const LoginResponseDataSchema = z.object({
  sessionToken: z.string(),
  refreshToken: z.string(),
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

export type LoginResponseData = z.infer<typeof LoginResponseDataSchema>;

export const LoginResponseSchema = createDataResponseSchema(LoginResponseDataSchema);
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Refresh Token Request
export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

// Refresh Token Response
export const RefreshResponseSchema = createDataResponseSchema(LoginResponseDataSchema);
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// User DTO
export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  locale: z.string().optional(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

// Tenant DTO
export const TenantDtoSchema = z.object({
  id: z.string().uuid(),
});

export type TenantDto = z.infer<typeof TenantDtoSchema>;

// Membership DTO
export const MembershipDtoSchema = z.object({
  role: RoleSchema,
  status: MembershipStatusSchema,
});

export type MembershipDto = z.infer<typeof MembershipDtoSchema>;

// Timesheet Policy DTO
export const TimesheetPolicyDtoSchema = z.object({
  tenantId: z.string().uuid(),
  hoursPerWeek: z.number(),
  weekStartDay: z.number().min(0).max(6),
  requireApproval: z.boolean(),
  allowEditAfterSubmit: z.boolean(),
});

export type TimesheetPolicyDto = z.infer<typeof TimesheetPolicyDtoSchema>;

// Me Response Data
export const MeResponseDataSchema = z.object({
  user: UserDtoSchema,
  tenant: TenantDtoSchema,
  membership: MembershipDtoSchema,
  timesheetPolicy: TimesheetPolicyDtoSchema.nullable(),
});

export type MeResponseData = z.infer<typeof MeResponseDataSchema>;

export const MeResponseSchema = createDataResponseSchema(MeResponseDataSchema);
export type MeResponse = z.infer<typeof MeResponseSchema>;
