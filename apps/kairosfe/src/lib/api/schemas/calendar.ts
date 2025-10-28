import { z } from 'zod';

/**
 * Calendar-related schemas from OpenAPI spec
 */

// Calendar Meta
export const CalendarMetaDtoSchema = z.object({
  userId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  include: z.array(z.string()),
});

export type CalendarMetaDto = z.infer<typeof CalendarMetaDtoSchema>;

// Calendar Response
export const CalendarResponseSchema = z.object({
  data: z.array(z.any()),
  meta: CalendarMetaDtoSchema,
});

export type CalendarResponse = z.infer<typeof CalendarResponseSchema>;
