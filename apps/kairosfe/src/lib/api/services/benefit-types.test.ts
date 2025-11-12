/**
 * Comprehensive tests for Benefit Types Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { benefitTypesService } from './benefit-types';
import * as benefitTypesEndpoints from '../endpoints/benefit-types';
import type { BenefitTypeDto } from '../schemas';

// Mock all endpoint functions
vi.mock('../endpoints/benefit-types');

describe('benefitTypesService', () => {
  const mockBenefitType: BenefitTypeDto = {
    id: 'benefit-1',
    tenantId: 'tenant-1',
    key: 'VACATION',
    name: 'Vacation Days',
    unit: 'days',
    requiresApproval: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockBenefitType2: BenefitTypeDto = {
    id: 'benefit-2',
    tenantId: 'tenant-1',
    key: 'SICK_LEAVE',
    name: 'Sick Leave',
    unit: 'days',
    requiresApproval: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockHoursBenefit: BenefitTypeDto = {
    id: 'benefit-3',
    tenantId: 'tenant-1',
    key: 'FLEX_HOURS',
    name: 'Flexible Hours',
    unit: 'hours',
    requiresApproval: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all benefit types', async () => {
      const mockResponse = {
        data: [mockBenefitType, mockBenefitType2, mockHoursBenefit],
        total: 3,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(benefitTypesEndpoints.findAllBenefitTypes).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.getAll();

      expect(benefitTypesEndpoints.findAllBenefitTypes).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(3);
    });

    it('should handle empty benefit types list', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      vi.mocked(benefitTypesEndpoints.findAllBenefitTypes).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.getAll();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle getAll error', async () => {
      vi.mocked(benefitTypesEndpoints.findAllBenefitTypes).mockRejectedValue(
        new Error('Failed to fetch benefit types')
      );

      await expect(benefitTypesService.getAll()).rejects.toThrow(
        'Failed to fetch benefit types'
      );
    });
  });

  describe('getById', () => {
    it('should fetch benefit type by ID', async () => {
      const mockResponse = {
        data: mockBenefitType,
      };

      vi.mocked(benefitTypesEndpoints.findBenefitTypeById).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.getById('benefit-1');

      expect(benefitTypesEndpoints.findBenefitTypeById).toHaveBeenCalledWith('benefit-1');
      expect(result).toEqual(mockResponse);
      expect(result.data.key).toBe('VACATION');
    });

    it('should fetch benefit type with hours unit', async () => {
      const mockResponse = {
        data: mockHoursBenefit,
      };

      vi.mocked(benefitTypesEndpoints.findBenefitTypeById).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.getById('benefit-3');

      expect(result.data.unit).toBe('hours');
    });

    it('should handle benefit type not found error', async () => {
      vi.mocked(benefitTypesEndpoints.findBenefitTypeById).mockRejectedValue(
        new Error('Benefit type not found')
      );

      await expect(benefitTypesService.getById('non-existent')).rejects.toThrow(
        'Benefit type not found'
      );
    });
  });

  describe('create', () => {
    it('should create benefit type with days unit and approval required', async () => {
      const createData = {
        key: 'PERSONAL_DAYS',
        name: 'Personal Days',
        unit: 'days' as const,
        requires_approval: true,
      };

      const mockResponse = {
        data: {
          ...mockBenefitType,
          ...createData,
          id: 'benefit-new',
          requiresApproval: true,
        },
      };

      vi.mocked(benefitTypesEndpoints.createBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.create(createData);

      expect(benefitTypesEndpoints.createBenefitType).toHaveBeenCalledWith(createData);
      expect(result.data.key).toBe('PERSONAL_DAYS');
      expect(result.data.requiresApproval).toBe(true);
    });

    it('should create benefit type with hours unit', async () => {
      const createData = {
        key: 'TRAINING_HOURS',
        name: 'Training Hours',
        unit: 'hours' as const,
        requires_approval: false,
      };

      const mockResponse = {
        data: {
          ...mockHoursBenefit,
          ...createData,
          id: 'benefit-training',
          requiresApproval: false,
        },
      };

      vi.mocked(benefitTypesEndpoints.createBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.create(createData);

      expect(result.data.unit).toBe('hours');
      expect(result.data.requiresApproval).toBe(false);
    });

    it('should create benefit type without approval requirement', async () => {
      const createData = {
        key: 'BEREAVEMENT',
        name: 'Bereavement Leave',
        unit: 'days' as const,
        requires_approval: false,
      };

      const mockResponse = {
        data: {
          ...mockBenefitType2,
          ...createData,
          id: 'benefit-bereavement',
          requiresApproval: false,
        },
      };

      vi.mocked(benefitTypesEndpoints.createBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.create(createData);

      expect(result.data.requiresApproval).toBe(false);
    });

    it('should handle creation error - duplicate key', async () => {
      const createData = {
        key: 'VACATION',
        name: 'Vacation',
        unit: 'days' as const,
        requires_approval: true,
      };

      vi.mocked(benefitTypesEndpoints.createBenefitType).mockRejectedValue(
        new Error('Benefit type key already exists')
      );

      await expect(benefitTypesService.create(createData)).rejects.toThrow(
        'Benefit type key already exists'
      );
    });

    it('should handle creation error - invalid unit', async () => {
      const createData = {
        key: 'INVALID',
        name: 'Invalid Benefit',
        unit: 'invalid' as any,
        requires_approval: true,
      };

      vi.mocked(benefitTypesEndpoints.createBenefitType).mockRejectedValue(
        new Error('Invalid unit type')
      );

      await expect(benefitTypesService.create(createData)).rejects.toThrow('Invalid unit type');
    });
  });

  describe('update', () => {
    it('should update benefit type name', async () => {
      const updateData = {
        name: 'Annual Vacation',
      };

      const mockResponse = {
        data: {
          ...mockBenefitType,
          name: 'Annual Vacation',
        },
      };

      vi.mocked(benefitTypesEndpoints.updateBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.update('benefit-1', updateData);

      expect(benefitTypesEndpoints.updateBenefitType).toHaveBeenCalledWith(
        'benefit-1',
        updateData
      );
      expect(result.data.name).toBe('Annual Vacation');
    });

    it('should update benefit type key', async () => {
      const updateData = {
        key: 'ANNUAL_LEAVE',
      };

      const mockResponse = {
        data: {
          ...mockBenefitType,
          key: 'ANNUAL_LEAVE',
        },
      };

      vi.mocked(benefitTypesEndpoints.updateBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.update('benefit-1', updateData);

      expect(result.data.key).toBe('ANNUAL_LEAVE');
    });

    it('should update benefit type unit', async () => {
      const updateData = {
        unit: 'hours' as const,
      };

      const mockResponse = {
        data: {
          ...mockBenefitType,
          unit: 'hours' as const,
        },
      };

      vi.mocked(benefitTypesEndpoints.updateBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.update('benefit-1', updateData);

      expect(result.data.unit).toBe('hours');
    });

    it('should update requires approval flag', async () => {
      const updateData = {
        requires_approval: false,
      };

      const mockResponse = {
        data: {
          ...mockBenefitType,
          requiresApproval: false,
        },
      };

      vi.mocked(benefitTypesEndpoints.updateBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.update('benefit-1', updateData);

      expect(result.data.requiresApproval).toBe(false);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        key: 'PTO',
        name: 'Paid Time Off',
        unit: 'hours' as const,
        requires_approval: true,
      };

      const mockResponse = {
        data: {
          ...mockBenefitType,
          key: 'PTO',
          name: 'Paid Time Off',
          unit: 'hours' as const,
          requiresApproval: true,
        },
      };

      vi.mocked(benefitTypesEndpoints.updateBenefitType).mockResolvedValue(mockResponse);

      const result = await benefitTypesService.update('benefit-1', updateData);

      expect(benefitTypesEndpoints.updateBenefitType).toHaveBeenCalledWith(
        'benefit-1',
        updateData
      );
      expect(result.data.key).toBe('PTO');
      expect(result.data.name).toBe('Paid Time Off');
      expect(result.data.unit).toBe('hours');
    });

    it('should handle update error', async () => {
      vi.mocked(benefitTypesEndpoints.updateBenefitType).mockRejectedValue(
        new Error('Benefit type not found')
      );

      await expect(
        benefitTypesService.update('non-existent', { name: 'Test' })
      ).rejects.toThrow('Benefit type not found');
    });
  });

  describe('delete', () => {
    it('should delete benefit type', async () => {
      vi.mocked(benefitTypesEndpoints.deleteBenefitType).mockResolvedValue(undefined);

      await benefitTypesService.delete('benefit-1');

      expect(benefitTypesEndpoints.deleteBenefitType).toHaveBeenCalledWith('benefit-1');
    });

    it('should handle deletion error', async () => {
      vi.mocked(benefitTypesEndpoints.deleteBenefitType).mockRejectedValue(
        new Error('Benefit type not found')
      );

      await expect(benefitTypesService.delete('non-existent')).rejects.toThrow(
        'Benefit type not found'
      );
    });

    it('should handle protected benefit type deletion error', async () => {
      vi.mocked(benefitTypesEndpoints.deleteBenefitType).mockRejectedValue(
        new Error('Cannot delete benefit type with active assignments')
      );

      await expect(benefitTypesService.delete('benefit-1')).rejects.toThrow(
        'Cannot delete benefit type with active assignments'
      );
    });
  });
});
