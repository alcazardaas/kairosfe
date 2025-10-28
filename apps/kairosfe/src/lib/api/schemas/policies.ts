import { z } from 'zod';
import { createDataResponseSchema } from './common';
import { TimesheetPolicyDtoSchema } from './auth';

/**
 * Timesheet Policy-related schemas from OpenAPI spec
 */

// Timesheet Policy List Response
export const TimesheetPolicyListResponseSchema = z.object({
  data: z.array(TimesheetPolicyDtoSchema),
});

export type TimesheetPolicyListResponse = z.infer<typeof TimesheetPolicyListResponseSchema>;

// Timesheet Policy Response
export const TimesheetPolicyResponseSchema = createDataResponseSchema(TimesheetPolicyDtoSchema);
export type TimesheetPolicyResponse = z.infer<typeof TimesheetPolicyResponseSchema>;
