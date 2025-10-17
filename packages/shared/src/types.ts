// Shared types for Kairos

export type UserRole = 'admin' | 'manager' | 'employee';

export type Permission =
  | 'view_dashboard'
  | 'view_profile'
  | 'edit_profile'
  | 'view_team'
  | 'manage_team'
  | 'view_leave_requests'
  | 'create_leave_request'
  | 'approve_leave_requests'
  | 'view_timesheets'
  | 'create_timesheet'
  | 'approve_timesheets';

export interface UserPolicy {
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  canApproveTimesheets: boolean;
  canApproveLeaveRequests: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  permissions?: Permission[];
  policy?: UserPolicy;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface MenuItem {
  path: string;
  labelKey: string;
  icon?: string;
  roles: UserRole[];
}
