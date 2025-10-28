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

// Calendar Types
export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'public' | 'company' | 'regional';
  isRecurring: boolean;
}

export interface CalendarEvent {
  id: string;
  type: 'holiday' | 'leave';
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  userId?: string;
  userName?: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  holidays: Holiday[];
  leaves: LeaveRequest[];
}

export interface CalendarParams {
  userId?: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  include?: ('holidays' | 'leave')[];
}

// Employee/Users API Types
export type EmployeeStatus = 'active' | 'invited' | 'disabled';

export interface EmployeeMembership {
  role: UserRole;
  status: EmployeeStatus;
  createdAt: string; // ISO 8601
}

export interface EmployeeProfile {
  jobTitle: string | null;
  startDate: string | null; // YYYY-MM-DD
  managerUserId: string | null; // UUID
  location: string | null;
  phone: string | null;
}

export interface Employee {
  id: string;
  email: string;
  name: string | null;
  locale: string | null;
  createdAt: string; // ISO 8601
  lastLoginAt: string | null; // ISO 8601
  membership: EmployeeMembership;
  profile: EmployeeProfile | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  data: Employee[];
  meta: PaginationMeta;
}

export type SortDirection = 'asc' | 'desc';
export type UserSortField = 'name' | 'email' | 'created_at' | 'role' | 'status';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  sort?: `${UserSortField}:${SortDirection}`;
  q?: string; // search by name or email
  role?: UserRole;
  status?: EmployeeStatus;
  manager_id?: string; // UUID - filter by manager's direct reports
}

// Create User/Employee Types
export interface CreateUserProfile {
  jobTitle?: string | null;
  startDate?: string | null; // YYYY-MM-DD
  managerUserId?: string | null; // UUID
  location?: string | null;
  phone?: string | null;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  profile?: CreateUserProfile;
  sendInvite?: boolean; // default: true
}

export interface CreateUserResponseData {
  user: {
    id: string;
    email: string;
    name: string;
    locale: string | null;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  };
  membership: {
    tenantId: string;
    role: UserRole;
    status: EmployeeStatus;
  };
  profile: EmployeeProfile | null;
}

export interface CreateUserResponse {
  data: CreateUserResponseData;
}

// Update User/Employee Types
export interface UpdateUserProfile {
  jobTitle?: string | null;
  startDate?: string | null;
  managerUserId?: string | null;
  location?: string | null;
  phone?: string | null;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  profile?: UpdateUserProfile;
}

export interface UpdateUserResponse {
  data: CreateUserResponseData; // Same structure as create
}

// Service Layer Types (mapped from API types)
export interface CreateEmployeeParams {
  email: string;
  name: string;
  role: UserRole;
  jobTitle?: string;
  startDate?: string; // YYYY-MM-DD
  managerId?: string; // Maps to managerUserId
  location?: string;
  phone?: string;
  sendInvite?: boolean;
}

export interface UpdateEmployeeParams {
  name?: string;
  role?: UserRole;
  jobTitle?: string;
  startDate?: string;
  managerId?: string; // Maps to managerUserId
  location?: string;
  phone?: string;
}
