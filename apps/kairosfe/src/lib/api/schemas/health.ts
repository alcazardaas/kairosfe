import { z } from 'zod';
import { DatabaseStatusSchema } from './common';

/**
 * Health check schema from OpenAPI spec
 */

export const HealthCheckDtoSchema = z.object({
  ok: z.boolean(),
  ts: z.string().datetime(),
  database: DatabaseStatusSchema,
  error: z.string().optional(),
});

export type HealthCheckDto = z.infer<typeof HealthCheckDtoSchema>;
