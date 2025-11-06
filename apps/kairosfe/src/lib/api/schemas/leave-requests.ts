import { z } from 'zod';
import { createDataResponseSchema, LeaveRequestStatusSchema } from './common';

/**
 * Leave Request-related schemas from OpenAPI spec
 */

// Leave Request DTO
export const LeaveRequestDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  benefitTypeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  amount: z.number(),
  status: LeaveRequestStatusSchema,
  approverUserId: z.string().uuid().nullable(),
  approvedAt: z.string().datetime().nullable(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type LeaveRequestDto = z.infer<typeof LeaveRequestDtoSchema>;

// Leave Request Response
export const LeaveRequestResponseSchema = createDataResponseSchema(LeaveRequestDtoSchema);
export type LeaveRequestResponse = z.infer<typeof LeaveRequestResponseSchema>;

// Leave Request List Response
export const LeaveRequestListResponseSchema = z.object({
  data: z.array(LeaveRequestDtoSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export type LeaveRequestListResponse = z.infer<typeof LeaveRequestListResponseSchema>;

// Leave Request Meta
export const LeaveRequestMetaDtoSchema = z.object({
  userId: z.string().uuid(),
  count: z.number(),
});

export type LeaveRequestMetaDto = z.infer<typeof LeaveRequestMetaDtoSchema>;

// Benefit Balance DTO
export const BenefitBalanceDtoSchema = z.object({
  id: z.string().uuid(),
  benefitTypeId: z.string().uuid(),
  benefitTypeKey: z.string(),
  benefitTypeName: z.string(),
  currentBalance: z.string(), // numeric string from DB
  totalAmount: z.string(),
  usedAmount: z.string(),
  unit: z.enum(['days', 'hours']),
  requiresApproval: z.boolean().optional(),
});

export type BenefitBalanceDto = z.infer<typeof BenefitBalanceDtoSchema>;

// Benefit Balances Response
export const BenefitBalancesResponseSchema = z.object({
  data: z.array(BenefitBalanceDtoSchema),
  meta: LeaveRequestMetaDtoSchema,
});

export type BenefitBalancesResponse = z.infer<typeof BenefitBalancesResponseSchema>;
