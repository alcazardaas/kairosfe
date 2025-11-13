/**
 * Comprehensive tests for Organization Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organizationService, type OrganizationData } from './organization';
import { apiClient } from '../client';

// Mock API client
vi.mock('../client', () => ({
  apiClient: {
    request: vi.fn(),
  },
}));

describe('organizationService', () => {
  const mockOrganization: OrganizationData = {
    id: 'org-1',
    name: 'Test Company Inc.',
    phone: '+1234567890',
    address: '123 Business St, City, State 12345',
    logoUrl: 'https://example.com/logos/test-company.png',
    timezone: 'America/New_York',
    country: 'US',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should fetch organization settings', async () => {
      const mockResponse = {
        data: mockOrganization,
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await organizationService.get();

      expect(apiClient.request).toHaveBeenCalledWith('/organization', {
        method: 'GET',
        requiresAuth: true,
        operationId: 'OrganizationController_get',
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.name).toBe('Test Company Inc.');
    });

    it('should fetch organization with minimal data', async () => {
      const minimalOrg: OrganizationData = {
        id: 'org-2',
        name: 'Minimal Org',
        phone: null,
        address: null,
        logoUrl: null,
        timezone: 'UTC',
        country: 'US',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const mockResponse = {
        data: minimalOrg,
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await organizationService.get();

      expect(result.data.phone).toBeNull();
      expect(result.data.address).toBeNull();
      expect(result.data.logoUrl).toBeNull();
    });

    it('should handle unauthorized error', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(new Error('Unauthorized'));

      await expect(organizationService.get()).rejects.toThrow('Unauthorized');
    });

    it('should handle forbidden error (non-admin)', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(
        new Error('Forbidden - Admin role required')
      );

      await expect(organizationService.get()).rejects.toThrow(
        'Forbidden - Admin role required'
      );
    });
  });

  describe('update', () => {
    it('should update organization name', async () => {
      const updateData = {
        name: 'Updated Company Name',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          name: 'Updated Company Name',
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith('/organization', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        requiresAuth: true,
        operationId: 'OrganizationController_update',
      });
      expect(result.data.name).toBe('Updated Company Name');
    });

    it('should update organization phone', async () => {
      const updateData = {
        phone: '+9876543210',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          phone: '+9876543210',
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith(
        '/organization',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should update organization address', async () => {
      const updateData = {
        address: '456 New Ave, New City, NC 54321',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          address: updateData.address,
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith(
        '/organization',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should update organization logo URL', async () => {
      const updateData = {
        logoUrl: 'https://example.com/new-logo.png',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          logoUrl: updateData.logoUrl,
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith(
        '/organization',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should update organization timezone', async () => {
      const updateData = {
        timezone: 'America/Los_Angeles',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          timezone: 'America/Los_Angeles',
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith(
        '/organization',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should update organization country', async () => {
      const updateData = {
        country: 'CA',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          country: 'CA',
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith(
        '/organization',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should clear optional fields with null', async () => {
      const updateData = {
        phone: null,
        address: null,
        logoUrl: null,
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          phone: null,
          address: null,
          logoUrl: null,
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await organizationService.update(updateData);

      expect(result.data.phone).toBeNull();
      expect(result.data.address).toBeNull();
      expect(result.data.logoUrl).toBeNull();
    });

    it('should update multiple fields simultaneously', async () => {
      const updateData = {
        name: 'New Company',
        phone: '+1111111111',
        address: '789 Third St',
        timezone: 'Europe/London',
        country: 'GB',
      };

      const mockResponse = {
        data: {
          ...mockOrganization,
          ...updateData,
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await organizationService.update(updateData);

      expect(apiClient.request).toHaveBeenCalledWith(
        '/organization',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
      expect(result.data.name).toBe('New Company');
      expect(result.data.timezone).toBe('Europe/London');
    });

    it('should handle unauthorized error', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(new Error('Unauthorized'));

      await expect(organizationService.update({ name: 'Test' })).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should handle forbidden error (non-admin)', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(
        new Error('Forbidden - Admin role required')
      );

      await expect(organizationService.update({ name: 'Test' })).rejects.toThrow(
        'Forbidden - Admin role required'
      );
    });

    it('should handle validation error', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(
        new Error('Validation failed: Invalid timezone')
      );

      await expect(
        organizationService.update({ timezone: 'Invalid/Timezone' })
      ).rejects.toThrow('Validation failed: Invalid timezone');
    });
  });
});
