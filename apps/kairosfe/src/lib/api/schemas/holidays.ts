import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema } from './common';

/**
 * Holiday-related schemas from OpenAPI spec
 */

// Holiday DTO
export const HolidayDtoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  date: z.string(),
  is_recurring: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type HolidayDto = z.infer<typeof HolidayDtoSchema>;

// Holiday Response
export const HolidayResponseSchema = createDataResponseSchema(HolidayDtoSchema);
export type HolidayResponse = z.infer<typeof HolidayResponseSchema>;

// Holiday List Response
export const HolidayListResponseSchema = createPaginatedResponseSchema(HolidayDtoSchema);
export type HolidayListResponse = z.infer<typeof HolidayListResponseSchema>;
