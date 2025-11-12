/**
 * Comprehensive tests for Permission Utilities
 * Target: 95%+ coverage
 */

import { describe, it, expect } from 'vitest';
import {
  canAddEmployee,
  canEditEmployee,
  canDeactivateEmployee,
  canResendInvite,
  hasEmployeeManagementPermissions,
} from './permissions';
import type { UserRole } from '@kairos/shared';

describe('permission utilities', () => {
  describe('canAddEmployee', () => {
    it('should return true for admin role', () => {
      expect(canAddEmployee('admin')).toBe(true);
    });

    it('should return true for manager role', () => {
      expect(canAddEmployee('manager')).toBe(true);
    });

    it('should return false for employee role', () => {
      expect(canAddEmployee('employee')).toBe(false);
    });

    it('should return false for null role', () => {
      expect(canAddEmployee(null)).toBe(false);
    });
  });

  describe('canEditEmployee', () => {
    it('should return true for admin role', () => {
      expect(canEditEmployee('admin')).toBe(true);
    });

    it('should return true for manager role', () => {
      expect(canEditEmployee('manager')).toBe(true);
    });

    it('should return false for employee role', () => {
      expect(canEditEmployee('employee')).toBe(false);
    });

    it('should return false for null role', () => {
      expect(canEditEmployee(null)).toBe(false);
    });
  });

  describe('canDeactivateEmployee', () => {
    it('should return true for admin role', () => {
      expect(canDeactivateEmployee('admin')).toBe(true);
    });

    it('should return false for manager role', () => {
      expect(canDeactivateEmployee('manager')).toBe(false);
    });

    it('should return false for employee role', () => {
      expect(canDeactivateEmployee('employee')).toBe(false);
    });

    it('should return false for null role', () => {
      expect(canDeactivateEmployee(null)).toBe(false);
    });
  });

  describe('canResendInvite', () => {
    it('should return true for admin role', () => {
      expect(canResendInvite('admin')).toBe(true);
    });

    it('should return true for manager role', () => {
      expect(canResendInvite('manager')).toBe(true);
    });

    it('should return false for employee role', () => {
      expect(canResendInvite('employee')).toBe(false);
    });

    it('should return false for null role', () => {
      expect(canResendInvite(null)).toBe(false);
    });
  });

  describe('hasEmployeeManagementPermissions', () => {
    it('should return true for admin role (has all permissions)', () => {
      expect(hasEmployeeManagementPermissions('admin')).toBe(true);
    });

    it('should return true for manager role (has add and edit permissions)', () => {
      expect(hasEmployeeManagementPermissions('manager')).toBe(true);
    });

    it('should return false for employee role (has no permissions)', () => {
      expect(hasEmployeeManagementPermissions('employee')).toBe(false);
    });

    it('should return false for null role', () => {
      expect(hasEmployeeManagementPermissions(null)).toBe(false);
    });
  });

  describe('permission combinations', () => {
    it('admin should have all permissions', () => {
      const role: UserRole = 'admin';

      expect(canAddEmployee(role)).toBe(true);
      expect(canEditEmployee(role)).toBe(true);
      expect(canDeactivateEmployee(role)).toBe(true);
      expect(canResendInvite(role)).toBe(true);
      expect(hasEmployeeManagementPermissions(role)).toBe(true);
    });

    it('manager should have add, edit, and resend permissions but not deactivate', () => {
      const role: UserRole = 'manager';

      expect(canAddEmployee(role)).toBe(true);
      expect(canEditEmployee(role)).toBe(true);
      expect(canDeactivateEmployee(role)).toBe(false);
      expect(canResendInvite(role)).toBe(true);
      expect(hasEmployeeManagementPermissions(role)).toBe(true);
    });

    it('employee should have no permissions', () => {
      const role: UserRole = 'employee';

      expect(canAddEmployee(role)).toBe(false);
      expect(canEditEmployee(role)).toBe(false);
      expect(canDeactivateEmployee(role)).toBe(false);
      expect(canResendInvite(role)).toBe(false);
      expect(hasEmployeeManagementPermissions(role)).toBe(false);
    });

    it('null role should have no permissions', () => {
      const role = null;

      expect(canAddEmployee(role)).toBe(false);
      expect(canEditEmployee(role)).toBe(false);
      expect(canDeactivateEmployee(role)).toBe(false);
      expect(canResendInvite(role)).toBe(false);
      expect(hasEmployeeManagementPermissions(role)).toBe(false);
    });
  });
});
