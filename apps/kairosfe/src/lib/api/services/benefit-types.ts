/**
 * Benefit Types Service
 * Service layer for benefit type operations
 */

import {
  findAllBenefitTypes,
  findBenefitTypeById,
  createBenefitType,
  updateBenefitType,
  deleteBenefitType,
} from '../endpoints/benefit-types';
import type { BenefitTypeListResponse, BenefitTypeResponse } from '../schemas/benefits';
import type { Unit } from '../schemas/common';

export interface CreateBenefitTypeDto {
  key: string;
  name: string;
  unit: Unit;
  requires_approval: boolean;
}

export interface UpdateBenefitTypeDto {
  key?: string;
  name?: string;
  unit?: Unit;
  requires_approval?: boolean;
}

export const benefitTypesService = {
  /**
   * Get all benefit types
   */
  async getAll(): Promise<BenefitTypeListResponse> {
    return findAllBenefitTypes();
  },

  /**
   * Get a single benefit type by ID
   */
  async getById(id: string): Promise<BenefitTypeResponse> {
    return findBenefitTypeById(id);
  },

  /**
   * Create a new benefit type
   */
  async create(data: CreateBenefitTypeDto): Promise<BenefitTypeResponse> {
    return createBenefitType(data);
  },

  /**
   * Update an existing benefit type
   */
  async update(id: string, data: UpdateBenefitTypeDto): Promise<BenefitTypeResponse> {
    return updateBenefitType(id, data);
  },

  /**
   * Delete a benefit type
   */
  async delete(id: string): Promise<void> {
    return deleteBenefitType(id);
  },
};
