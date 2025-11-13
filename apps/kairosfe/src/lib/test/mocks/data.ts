/**
 * Mock data fixtures for testing
 */

import type { User, Timesheet, TimeEntry, LeaveRequest, Project, Task } from '@kairos/shared';

// Mock Users
export const mockUser: User = {
  id: '1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'employee',
  tenantId: 'tenant-1',
  jobTitle: 'Software Developer',
  department: 'Engineering',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockManager: User = {
  id: '2',
  email: 'manager@test.com',
  name: 'Manager User',
  role: 'manager',
  tenantId: 'tenant-1',
  jobTitle: 'Engineering Manager',
  department: 'Engineering',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockAdmin: User = {
  id: '3',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
  tenantId: 'tenant-1',
  jobTitle: 'System Administrator',
  department: 'IT',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// Mock Projects
export const mockProject: Project = {
  id: 'proj-1',
  tenantId: 'tenant-1',
  name: 'Kairos Project',
  code: 'KAIROS',
  description: 'Main Kairos project',
  clientName: 'Kairos Inc.',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockProjects: Project[] = [
  mockProject,
  {
    id: 'proj-2',
    tenantId: 'tenant-1',
    name: 'Internal Tools',
    code: 'TOOLS',
    description: 'Internal development tools',
    clientName: 'Internal',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

// Mock Tasks
export const mockTask: Task = {
  id: 'task-1',
  projectId: 'proj-1',
  tenantId: 'tenant-1',
  name: 'Development',
  code: 'DEV',
  description: 'Development work',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockTasks: Task[] = [
  mockTask,
  {
    id: 'task-2',
    projectId: 'proj-1',
    tenantId: 'tenant-1',
    name: 'Code Review',
    code: 'REVIEW',
    description: 'Code review activities',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    tenantId: 'tenant-1',
    name: 'Testing',
    code: 'TEST',
    description: 'Testing and QA',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

// Mock Timesheets
export const mockTimesheet: Timesheet = {
  id: '1',
  userId: '1',
  tenantId: 'tenant-1',
  weekStartDate: '2025-01-13',
  status: 'draft',
  totalHours: 40,
  submittedAt: null,
  reviewedAt: null,
  reviewedByUserId: null,
  reviewNote: null,
  createdAt: '2025-01-13T10:00:00.000Z',
  updatedAt: '2025-01-13T10:00:00.000Z',
};

export const mockTimesheets: Timesheet[] = [
  mockTimesheet,
  {
    id: '2',
    userId: '1',
    tenantId: 'tenant-1',
    weekStartDate: '2025-01-06',
    status: 'approved',
    totalHours: 40,
    submittedAt: '2025-01-12T10:00:00.000Z',
    reviewedAt: '2025-01-12T14:00:00.000Z',
    reviewedByUserId: '2',
    reviewNote: null,
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-12T14:00:00.000Z',
  },
];

// Mock Time Entries
export const mockTimeEntry: TimeEntry = {
  id: '1',
  timesheetId: '1',
  projectId: 'proj-1',
  taskId: 'task-1',
  tenantId: 'tenant-1',
  userId: '1',
  dayOfWeek: 1,
  hours: 8,
  notes: 'Development work',
  createdAt: '2025-01-13T10:00:00.000Z',
  updatedAt: '2025-01-13T10:00:00.000Z',
};

export const mockTimeEntries: TimeEntry[] = [
  mockTimeEntry,
  {
    id: '2',
    timesheetId: '1',
    projectId: 'proj-1',
    taskId: 'task-2',
    tenantId: 'tenant-1',
    userId: '1',
    dayOfWeek: 2,
    hours: 8,
    notes: 'Code review',
    createdAt: '2025-01-14T10:00:00.000Z',
    updatedAt: '2025-01-14T10:00:00.000Z',
  },
  {
    id: '3',
    timesheetId: '1',
    projectId: 'proj-1',
    taskId: 'task-1',
    tenantId: 'tenant-1',
    userId: '1',
    dayOfWeek: 3,
    hours: 8,
    notes: 'Development work',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
  },
];

// Mock Leave Requests
export const mockLeaveRequest: LeaveRequest = {
  id: '1',
  userId: '1',
  tenantId: 'tenant-1',
  benefitTypeId: 'vacation',
  startDate: '2025-02-01',
  endDate: '2025-02-05',
  totalDays: 5,
  status: 'pending',
  reason: 'Family vacation',
  submittedAt: '2025-01-11T10:00:00.000Z',
  reviewedAt: null,
  reviewedByUserId: null,
  reviewNote: null,
  createdAt: '2025-01-11T10:00:00.000Z',
  updatedAt: '2025-01-11T10:00:00.000Z',
};

export const mockLeaveRequests: LeaveRequest[] = [
  mockLeaveRequest,
  {
    id: '2',
    userId: '1',
    tenantId: 'tenant-1',
    benefitTypeId: 'sick',
    startDate: '2025-01-15',
    endDate: '2025-01-16',
    totalDays: 2,
    status: 'approved',
    reason: 'Medical appointment',
    submittedAt: '2025-01-10T10:00:00.000Z',
    reviewedAt: '2025-01-10T14:00:00.000Z',
    reviewedByUserId: '2',
    reviewNote: 'Approved',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T14:00:00.000Z',
  },
];

// Mock Auth Response
export const mockAuthResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  user: mockUser,
};

// Mock Benefit Types
export const mockBenefitTypes = [
  {
    id: 'vacation',
    tenantId: 'tenant-1',
    name: 'Vacation',
    description: 'Annual vacation leave',
    unit: 'days',
    requiresApproval: true,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sick',
    tenantId: 'tenant-1',
    name: 'Sick Leave',
    description: 'Sick leave',
    unit: 'days',
    requiresApproval: false,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

// Mock User Benefits
export const mockUserBenefits = [
  {
    id: 'ub-1',
    userId: '1',
    benefitTypeId: 'vacation',
    tenantId: 'tenant-1',
    totalDays: 20,
    usedDays: 5,
    availableDays: 15,
    year: 2025,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-11T00:00:00.000Z',
  },
  {
    id: 'ub-2',
    userId: '1',
    benefitTypeId: 'sick',
    tenantId: 'tenant-1',
    totalDays: 10,
    usedDays: 2,
    availableDays: 8,
    year: 2025,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-11T00:00:00.000Z',
  },
];

// Mock Holidays
export const mockHolidays = [
  {
    id: 'hol-1',
    tenantId: 'tenant-1',
    name: 'New Year',
    date: '2025-01-01',
    isRecurring: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'hol-2',
    tenantId: 'tenant-1',
    name: 'Independence Day',
    date: '2025-07-04',
    isRecurring: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

// Mock Weekly Stats
export const mockWeeklyStats = {
  weekStartDate: '2025-01-13',
  totalHours: 40,
  dailyHours: [
    { dayOfWeek: 1, hours: 8, date: '2025-01-13' },
    { dayOfWeek: 2, hours: 8, date: '2025-01-14' },
    { dayOfWeek: 3, hours: 8, date: '2025-01-15' },
    { dayOfWeek: 4, hours: 8, date: '2025-01-16' },
    { dayOfWeek: 5, hours: 8, date: '2025-01-17' },
    { dayOfWeek: 6, hours: 0, date: '2025-01-18' },
    { dayOfWeek: 0, hours: 0, date: '2025-01-19' },
  ],
};

// Mock Project Stats
export const mockProjectStats = [
  {
    projectId: 'proj-1',
    projectName: 'Kairos Project',
    totalHours: 32,
    percentage: 80,
  },
  {
    projectId: 'proj-2',
    projectName: 'Internal Tools',
    totalHours: 8,
    percentage: 20,
  },
];
