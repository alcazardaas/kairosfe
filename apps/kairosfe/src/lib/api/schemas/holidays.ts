import { z } from 'zod';
import { createDataResponseSchema, createPaginatedResponseSchema } from './common';

/**
 * Holiday-related schemas from OpenAPI spec
 */

// Holiday DTO
export const HolidayDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  countryCode: z.string(),
  name: z.string(),
  date: z.string(),
  type: z.enum(['public', 'company', 'regional']),
  isRecurring: z.boolean(),
  description: z.string().nullable(),
});

export type HolidayDto = z.infer<typeof HolidayDtoSchema>;

// Holiday Response
export const HolidayResponseSchema = createDataResponseSchema(HolidayDtoSchema);
export type HolidayResponse = z.infer<typeof HolidayResponseSchema>;

// Holiday List Response
export const HolidayListResponseSchema = createPaginatedResponseSchema(HolidayDtoSchema);
export type HolidayListResponse = z.infer<typeof HolidayListResponseSchema>;
