import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema, UnitSchema } from './common';

/**
 * Benefit Type-related schemas from OpenAPI spec
 */

// Benefit Type DTO
export const BenefitTypeDtoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  unit: UnitSchema,
  requires_approval: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type BenefitTypeDto = z.infer<typeof BenefitTypeDtoSchema>;

// Benefit Type Response
export const BenefitTypeResponseSchema = createDataResponseSchema(BenefitTypeDtoSchema);
export type BenefitTypeResponse = z.infer<typeof BenefitTypeResponseSchema>;

// Benefit Type List Response
export const BenefitTypeListResponseSchema = createPaginatedResponseSchema(BenefitTypeDtoSchema);
export type BenefitTypeListResponse = z.infer<typeof BenefitTypeListResponseSchema>;
