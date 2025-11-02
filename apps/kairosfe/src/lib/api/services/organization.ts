/**
 * Organization Service
 * Handles organization settings and configuration
 */

import { apiClient } from '../client';

export interface OrganizationData {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  timezone: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  timezone?: string;
  country?: string;
}

export interface OrganizationResponse {
  data: OrganizationData;
}

export const organizationService = {
  /**
   * Get current organization settings
   * Requires: Admin role
   */
  async get(): Promise<OrganizationResponse> {
    return apiClient.request<OrganizationResponse>('/organization', {
      method: 'GET',
      requiresAuth: true,
      operationId: 'OrganizationController_get',
    });
  },

  /**
   * Update organization settings
   * Requires: Admin role
   * @param data - Partial organization data to update
   */
  async update(data: UpdateOrganizationRequest): Promise<OrganizationResponse> {
    return apiClient.request<OrganizationResponse>('/organization', {
      method: 'PATCH',
      body: JSON.stringify(data),
      requiresAuth: true,
      operationId: 'OrganizationController_update',
    });
  },
};
