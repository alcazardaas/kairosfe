/**
 * Benefit Type endpoints
 * Generated from OpenAPI spec - Benefit Types tag
 */

import { apiClient } from '../client';
import type {
  BenefitTypeListResponse,
  BenefitTypeResponse,
} from '../schemas';
import {
  BenefitTypeListResponseSchema,
  BenefitTypeResponseSchema,
} from '../schemas';

/**
 * BenefitTypesController_findAll
 * GET /benefit-types
 * Retrieve a paginated list of benefit types (PTO, sick leave, etc.) with optional filtering
 */
export async function findAllBenefitTypes(): Promise<BenefitTypeListResponse> {
  return apiClient.request<BenefitTypeListResponse>('/benefit-types', {
    method: 'GET',
    requiresAuth: true,
    operationId: 'BenefitTypesController_findAll',
    schema: BenefitTypeListResponseSchema,
  });
}

/**
 * BenefitTypesController_create
 * POST /benefit-types
 * Create a new benefit type (e.g., PTO, sick leave) for a tenant
 */
export async function createBenefitType(data: unknown): Promise<BenefitTypeResponse> {
  return apiClient.request<BenefitTypeResponse>('/benefit-types', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'BenefitTypesController_create',
    schema: BenefitTypeResponseSchema,
  });
}

/**
 * BenefitTypesController_findOne
 * GET /benefit-types/{id}
 * Retrieve a benefit type by its ID
 */
export async function findBenefitTypeById(id: string): Promise<BenefitTypeResponse> {
  return apiClient.request<BenefitTypeResponse>(`/benefit-types/${id}`, {
    method: 'GET',
    requiresAuth: true,
    operationId: 'BenefitTypesController_findOne',
    schema: BenefitTypeResponseSchema,
  });
}

/**
 * BenefitTypesController_update
 * PATCH /benefit-types/{id}
 * Update an existing benefit type by its ID
 */
export async function updateBenefitType(id: string, data: unknown): Promise<BenefitTypeResponse> {
  return apiClient.request<BenefitTypeResponse>(`/benefit-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
    operationId: 'BenefitTypesController_update',
    schema: BenefitTypeResponseSchema,
  });
}

/**
 * BenefitTypesController_remove
 * DELETE /benefit-types/{id}
 * Delete a benefit type by its ID
 */
export async function deleteBenefitType(id: string): Promise<void> {
  return apiClient.request<void>(`/benefit-types/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
    operationId: 'BenefitTypesController_remove',
  });
}
