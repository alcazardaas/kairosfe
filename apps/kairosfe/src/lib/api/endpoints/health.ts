/**
 * Health endpoints
 * Generated from OpenAPI spec - Health tag
 */

import { apiClient } from '../client';
import type { HealthCheckDto } from '../schemas';
import { HealthCheckDtoSchema } from '../schemas';

/**
 * HealthController_check
 * GET /health
 * Check the health status of the API and database connection
 */
export async function checkHealth(): Promise<HealthCheckDto> {
  return apiClient.request<HealthCheckDto>('/health', {
    method: 'GET',
    operationId: 'HealthController_check',
    schema: HealthCheckDtoSchema,
  });
}
