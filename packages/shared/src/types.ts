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

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'parental' | 'other';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  reason?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBenefit {
  type: LeaveType;
  name: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
}

export interface UserBenefits {
  userId: string;
  year: number;
  benefits: LeaveBenefit[];
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

// Timesheet types
export type TimesheetStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Timesheet {
  id: string;
  userId: string;
  weekStart: string; // ISO date string (Monday)
  weekEnd: string; // ISO date string (Sunday)
  status: TimesheetStatus;
  totalHours: number;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  timesheetId: string;
  userId: string;
  projectId: string;
  projectName?: string;
  taskId: string;
  taskName?: string;
  date: string; // ISO date string
  hours: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  hoursPerDay: Record<string, number>; // date -> hours
  entriesCount: number;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  totalHours: number;
  percentage: number;
}
