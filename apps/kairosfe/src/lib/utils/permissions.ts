import type { UserRole } from '@kairos/shared';

/**
 * Permission helper utilities
 * Determine what actions users can perform based on their role
 */

/**
 * Check if user can add employees
 * Only admins and managers can add employees
 */
export function canAddEmployee(role: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if user can edit employees
 * Only admins and managers can edit employees
 */
export function canEditEmployee(role: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if user can deactivate employees
 * Only admins can deactivate employees
 */
export function canDeactivateEmployee(role: UserRole | null): boolean {
  return role === 'admin';
}

/**
 * Check if user can resend invitations
 * Only admins and managers can resend invites
 */
export function canResendInvite(role: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if user has any employee management permissions
 */
export function hasEmployeeManagementPermissions(role: UserRole | null): boolean {
  return canAddEmployee(role) || canEditEmployee(role) || canDeactivateEmployee(role);
}
