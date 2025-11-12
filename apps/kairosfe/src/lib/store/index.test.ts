/**
 * Comprehensive tests for Zustand stores
 * Target: 100% coverage for all stores
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useAuthStore,
  useUIStore,
  useLeaveRequestsStore,
  useTimesheetStore,
} from './index';
import type { User, LeaveRequest, Timesheet, TimeEntry } from '@kairos/shared';

// ============================================================================
// AUTH STORE TESTS
// ============================================================================

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresIn: null,
      isAuthenticated: false,
      role: null,
      permissions: [],
      policy: null,
      isHydrating: false,
    });
  });

  describe('initialization', () => {
    it('should initialize with null values', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tokenExpiresIn).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.role).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.policy).toBeNull();
      expect(state.isHydrating).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user and authentication state', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'employee',
        permissions: ['view_dashboard', 'view_profile'],
        tenantId: 'tenant-1',
        jobTitle: 'Developer',
        department: 'Engineering',
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      const mockToken = 'test-token';
      const mockRefreshToken = 'test-refresh-token';
      const mockExpiresIn = 3600;

      useAuthStore.getState().login(mockUser, mockToken, mockRefreshToken, mockExpiresIn);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.refreshToken).toBe(mockRefreshToken);
      expect(state.tokenExpiresIn).toBe(mockExpiresIn);
      expect(state.isAuthenticated).toBe(true);
      expect(state.role).toBe('employee');
      expect(state.permissions).toEqual(['view_dashboard', 'view_profile']);
    });

    it('should set user with policy', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'employee',
        tenantId: 'tenant-1',
        jobTitle: 'Developer',
        department: 'Engineering',
        isActive: true,
        policy: {
          maxHoursPerDay: 24,
          maxHoursPerWeek: 40,
          canApproveTimesheets: false,
          canApproveLeaveRequests: false,
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      useAuthStore.getState().login(mockUser, 'token', 'refresh-token', 3600);

      const state = useAuthStore.getState();
      expect(state.policy).toEqual(mockUser.policy);
    });

    it('should handle user without permissions', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'employee',
        tenantId: 'tenant-1',
        jobTitle: 'Developer',
        department: 'Engineering',
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      useAuthStore.getState().login(mockUser, 'token', 'refresh-token', 3600);

      const state = useAuthStore.getState();
      expect(state.permissions).toEqual([]);
      expect(state.policy).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear all authentication state', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'manager',
        permissions: ['view_dashboard', 'approve_timesheets'],
        tenantId: 'tenant-1',
        jobTitle: 'Manager',
        department: 'Engineering',
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      useAuthStore.getState().login(mockUser, 'token', 'refresh-token', 3600);
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tokenExpiresIn).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.role).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.policy).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should update tokens and set authenticated', () => {
      const newToken = 'new-token';
      const newRefreshToken = 'new-refresh-token';
      const newExpiresIn = 7200;

      useAuthStore.getState().setTokens(newToken, newRefreshToken, newExpiresIn);

      const state = useAuthStore.getState();
      expect(state.token).toBe(newToken);
      expect(state.refreshToken).toBe(newRefreshToken);
      expect(state.tokenExpiresIn).toBe(newExpiresIn);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should update tokens without expiresIn', () => {
      const newToken = 'new-token';
      const newRefreshToken = 'new-refresh-token';

      useAuthStore.getState().setTokens(newToken, newRefreshToken);

      const state = useAuthStore.getState();
      expect(state.token).toBe(newToken);
      expect(state.refreshToken).toBe(newRefreshToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when token is empty', () => {
      useAuthStore.getState().setTokens('', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should update user and related fields', () => {
      const mockUser: User = {
        id: '1',
        email: 'updated@test.com',
        name: 'Updated User',
        role: 'admin',
        permissions: ['manage_team', 'approve_timesheets'],
        tenantId: 'tenant-1',
        jobTitle: 'Admin',
        department: 'Management',
        isActive: true,
        policy: {
          maxHoursPerDay: 24,
          maxHoursPerWeek: 40,
          canApproveTimesheets: true,
          canApproveLeaveRequests: true,
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.role).toBe('admin');
      expect(state.permissions).toEqual(['manage_team', 'approve_timesheets']);
      expect(state.policy).toEqual(mockUser.policy);
    });

    it('should handle user without permissions and policy', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'employee',
        tenantId: 'tenant-1',
        jobTitle: 'Developer',
        department: 'Engineering',
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.permissions).toEqual([]);
      expect(state.policy).toBeNull();
    });
  });
});

// ============================================================================
// UI STORE TESTS
// ============================================================================

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset UI store before each test
    useUIStore.setState({
      theme: 'auto',
      locale: 'en',
      isSidebarOpen: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const state = useUIStore.getState();

      expect(state.theme).toBe('auto');
      expect(state.locale).toBe('en');
      expect(state.isSidebarOpen).toBe(true);
    });
  });

  describe('theme management', () => {
    it('should set theme to dark', () => {
      useUIStore.getState().setTheme('dark');

      const state = useUIStore.getState();
      expect(state.theme).toBe('dark');
    });

    it('should set theme to light', () => {
      useUIStore.getState().setTheme('light');

      const state = useUIStore.getState();
      expect(state.theme).toBe('light');
    });

    it('should set theme to auto', () => {
      useUIStore.getState().setTheme('auto');

      const state = useUIStore.getState();
      expect(state.theme).toBe('auto');
    });
  });

  describe('locale management', () => {
    it('should change locale to Spanish', () => {
      useUIStore.getState().setLocale('es');

      const state = useUIStore.getState();
      expect(state.locale).toBe('es');
    });

    it('should change locale to Portuguese', () => {
      useUIStore.getState().setLocale('pt-PT');

      const state = useUIStore.getState();
      expect(state.locale).toBe('pt-PT');
    });

    it('should change locale to German', () => {
      useUIStore.getState().setLocale('de');

      const state = useUIStore.getState();
      expect(state.locale).toBe('de');
    });

    it('should change locale back to English', () => {
      useUIStore.getState().setLocale('es');
      useUIStore.getState().setLocale('en');

      const state = useUIStore.getState();
      expect(state.locale).toBe('en');
    });
  });

  describe('sidebar management', () => {
    it('should open sidebar', () => {
      useUIStore.setState({ isSidebarOpen: false });
      useUIStore.getState().setSidebarOpen(true);

      const state = useUIStore.getState();
      expect(state.isSidebarOpen).toBe(true);
    });

    it('should close sidebar', () => {
      useUIStore.setState({ isSidebarOpen: true });
      useUIStore.getState().setSidebarOpen(false);

      const state = useUIStore.getState();
      expect(state.isSidebarOpen).toBe(false);
    });

    it('should toggle sidebar from open to closed', () => {
      useUIStore.setState({ isSidebarOpen: true });
      useUIStore.getState().toggleSidebar();

      const state = useUIStore.getState();
      expect(state.isSidebarOpen).toBe(false);
    });

    it('should toggle sidebar from closed to open', () => {
      useUIStore.setState({ isSidebarOpen: false });
      useUIStore.getState().toggleSidebar();

      const state = useUIStore.getState();
      expect(state.isSidebarOpen).toBe(true);
    });

    it('should toggle sidebar multiple times', () => {
      useUIStore.setState({ isSidebarOpen: true });
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });
  });
});

// ============================================================================
// LEAVE REQUESTS STORE TESTS
// ============================================================================

describe('useLeaveRequestsStore', () => {
  beforeEach(() => {
    // Reset leave requests store before each test
    useLeaveRequestsStore.setState({ requests: [] });
  });

  describe('initialization', () => {
    it('should initialize with empty requests', () => {
      const state = useLeaveRequestsStore.getState();
      expect(state.requests).toEqual([]);
    });
  });

  describe('setRequests', () => {
    it('should set requests array', () => {
      const mockRequests: LeaveRequest[] = [
        {
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
        },
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

      useLeaveRequestsStore.getState().setRequests(mockRequests);

      const state = useLeaveRequestsStore.getState();
      expect(state.requests).toEqual(mockRequests);
      expect(state.requests).toHaveLength(2);
    });

    it('should replace existing requests', () => {
      const initialRequests: LeaveRequest[] = [
        {
          id: '1',
          userId: '1',
          tenantId: 'tenant-1',
          benefitTypeId: 'vacation',
          startDate: '2025-02-01',
          endDate: '2025-02-05',
          totalDays: 5,
          status: 'pending',
          reason: 'Old request',
          submittedAt: '2025-01-11T10:00:00.000Z',
          reviewedAt: null,
          reviewedByUserId: null,
          reviewNote: null,
          createdAt: '2025-01-11T10:00:00.000Z',
          updatedAt: '2025-01-11T10:00:00.000Z',
        },
      ];

      const newRequests: LeaveRequest[] = [
        {
          id: '2',
          userId: '1',
          tenantId: 'tenant-1',
          benefitTypeId: 'sick',
          startDate: '2025-01-15',
          endDate: '2025-01-16',
          totalDays: 2,
          status: 'approved',
          reason: 'New request',
          submittedAt: '2025-01-10T10:00:00.000Z',
          reviewedAt: '2025-01-10T14:00:00.000Z',
          reviewedByUserId: '2',
          reviewNote: null,
          createdAt: '2025-01-10T10:00:00.000Z',
          updatedAt: '2025-01-10T14:00:00.000Z',
        },
      ];

      useLeaveRequestsStore.getState().setRequests(initialRequests);
      useLeaveRequestsStore.getState().setRequests(newRequests);

      const state = useLeaveRequestsStore.getState();
      expect(state.requests).toEqual(newRequests);
      expect(state.requests).toHaveLength(1);
    });
  });

  describe('addRequest', () => {
    it('should add a request to empty list', () => {
      const newRequest: LeaveRequest = {
        id: '1',
        userId: '1',
        tenantId: 'tenant-1',
        benefitTypeId: 'vacation',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalDays: 5,
        status: 'pending',
        reason: 'Vacation',
        submittedAt: '2025-01-11T10:00:00.000Z',
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
        createdAt: '2025-01-11T10:00:00.000Z',
        updatedAt: '2025-01-11T10:00:00.000Z',
      };

      useLeaveRequestsStore.getState().addRequest(newRequest);

      const state = useLeaveRequestsStore.getState();
      expect(state.requests).toHaveLength(1);
      expect(state.requests[0]).toEqual(newRequest);
    });

    it('should add a request to existing list', () => {
      const existingRequest: LeaveRequest = {
        id: '1',
        userId: '1',
        tenantId: 'tenant-1',
        benefitTypeId: 'vacation',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalDays: 5,
        status: 'pending',
        reason: 'First request',
        submittedAt: '2025-01-11T10:00:00.000Z',
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
        createdAt: '2025-01-11T10:00:00.000Z',
        updatedAt: '2025-01-11T10:00:00.000Z',
      };

      const newRequest: LeaveRequest = {
        id: '2',
        userId: '1',
        tenantId: 'tenant-1',
        benefitTypeId: 'sick',
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        totalDays: 2,
        status: 'pending',
        reason: 'Second request',
        submittedAt: '2025-01-12T10:00:00.000Z',
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
        createdAt: '2025-01-12T10:00:00.000Z',
        updatedAt: '2025-01-12T10:00:00.000Z',
      };

      useLeaveRequestsStore.setState({ requests: [existingRequest] });
      useLeaveRequestsStore.getState().addRequest(newRequest);

      const state = useLeaveRequestsStore.getState();
      expect(state.requests).toHaveLength(2);
      expect(state.requests[0]).toEqual(existingRequest);
      expect(state.requests[1]).toEqual(newRequest);
    });

    it('should add multiple requests', () => {
      const request1: LeaveRequest = {
        id: '1',
        userId: '1',
        tenantId: 'tenant-1',
        benefitTypeId: 'vacation',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalDays: 5,
        status: 'pending',
        reason: 'Request 1',
        submittedAt: '2025-01-11T10:00:00.000Z',
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
        createdAt: '2025-01-11T10:00:00.000Z',
        updatedAt: '2025-01-11T10:00:00.000Z',
      };

      const request2: LeaveRequest = {
        ...request1,
        id: '2',
        reason: 'Request 2',
      };

      const request3: LeaveRequest = {
        ...request1,
        id: '3',
        reason: 'Request 3',
      };

      useLeaveRequestsStore.getState().addRequest(request1);
      useLeaveRequestsStore.getState().addRequest(request2);
      useLeaveRequestsStore.getState().addRequest(request3);

      const state = useLeaveRequestsStore.getState();
      expect(state.requests).toHaveLength(3);
    });
  });
});

// ============================================================================
// TIMESHEET STORE TESTS
// ============================================================================

describe('useTimesheetStore', () => {
  beforeEach(() => {
    // Reset timesheet store before each test
    useTimesheetStore.setState({
      currentTimesheet: null,
      timeEntries: [],
      dailyTotals: [],
      weeklyTotal: 0,
      projectBreakdown: [],
      validationResult: null,
      selectedWeekStart: new Date('2025-01-13'),
      isLoading: false,
      activeTab: 'week',
    });
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const state = useTimesheetStore.getState();

      expect(state.currentTimesheet).toBeNull();
      expect(state.timeEntries).toEqual([]);
      expect(state.dailyTotals).toEqual([]);
      expect(state.weeklyTotal).toBe(0);
      expect(state.projectBreakdown).toEqual([]);
      expect(state.validationResult).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.activeTab).toBe('week');
    });
  });

  describe('setCurrentTimesheet', () => {
    it('should set current timesheet', () => {
      const mockTimesheet: Timesheet = {
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

      useTimesheetStore.getState().setCurrentTimesheet(mockTimesheet);

      const state = useTimesheetStore.getState();
      expect(state.currentTimesheet).toEqual(mockTimesheet);
    });

    it('should clear current timesheet', () => {
      const mockTimesheet: Timesheet = {
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

      useTimesheetStore.getState().setCurrentTimesheet(mockTimesheet);
      useTimesheetStore.getState().setCurrentTimesheet(null);

      const state = useTimesheetStore.getState();
      expect(state.currentTimesheet).toBeNull();
    });
  });

  describe('timeEntry management', () => {
    const mockEntry: TimeEntry = {
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

    it('should set time entries', () => {
      const entries: TimeEntry[] = [
        mockEntry,
        {
          ...mockEntry,
          id: '2',
          dayOfWeek: 2,
          notes: 'Code review',
        },
      ];

      useTimesheetStore.getState().setTimeEntries(entries);

      const state = useTimesheetStore.getState();
      expect(state.timeEntries).toEqual(entries);
      expect(state.timeEntries).toHaveLength(2);
    });

    it('should add time entry', () => {
      useTimesheetStore.getState().addTimeEntry(mockEntry);

      const state = useTimesheetStore.getState();
      expect(state.timeEntries).toHaveLength(1);
      expect(state.timeEntries[0]).toEqual(mockEntry);
    });

    it('should add multiple time entries', () => {
      const entry1 = { ...mockEntry, id: '1' };
      const entry2 = { ...mockEntry, id: '2', dayOfWeek: 2 };
      const entry3 = { ...mockEntry, id: '3', dayOfWeek: 3 };

      useTimesheetStore.getState().addTimeEntry(entry1);
      useTimesheetStore.getState().addTimeEntry(entry2);
      useTimesheetStore.getState().addTimeEntry(entry3);

      const state = useTimesheetStore.getState();
      expect(state.timeEntries).toHaveLength(3);
    });

    it('should update time entry', () => {
      useTimesheetStore.setState({ timeEntries: [mockEntry] });

      useTimesheetStore.getState().updateTimeEntry('1', {
        hours: 10,
        notes: 'Updated notes',
      });

      const state = useTimesheetStore.getState();
      expect(state.timeEntries[0].hours).toBe(10);
      expect(state.timeEntries[0].notes).toBe('Updated notes');
    });

    it('should not update non-existent entry', () => {
      useTimesheetStore.setState({ timeEntries: [mockEntry] });

      useTimesheetStore.getState().updateTimeEntry('non-existent', {
        hours: 10,
      });

      const state = useTimesheetStore.getState();
      expect(state.timeEntries[0]).toEqual(mockEntry);
    });

    it('should remove time entry', () => {
      const entry1 = { ...mockEntry, id: '1' };
      const entry2 = { ...mockEntry, id: '2', dayOfWeek: 2 };

      useTimesheetStore.setState({ timeEntries: [entry1, entry2] });
      useTimesheetStore.getState().removeTimeEntry('1');

      const state = useTimesheetStore.getState();
      expect(state.timeEntries).toHaveLength(1);
      expect(state.timeEntries[0].id).toBe('2');
    });

    it('should not error when removing non-existent entry', () => {
      useTimesheetStore.setState({ timeEntries: [mockEntry] });

      useTimesheetStore.getState().removeTimeEntry('non-existent');

      const state = useTimesheetStore.getState();
      expect(state.timeEntries).toHaveLength(1);
    });
  });

  describe('totals management', () => {
    it('should set daily totals', () => {
      const dailyTotals = [8, 8, 8, 8, 8, 0, 0];

      useTimesheetStore.getState().setDailyTotals(dailyTotals);

      const state = useTimesheetStore.getState();
      expect(state.dailyTotals).toEqual(dailyTotals);
    });

    it('should set weekly total', () => {
      useTimesheetStore.getState().setWeeklyTotal(40);

      const state = useTimesheetStore.getState();
      expect(state.weeklyTotal).toBe(40);
    });
  });

  describe('project breakdown', () => {
    it('should set project breakdown', () => {
      const breakdown = [
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

      useTimesheetStore.getState().setProjectBreakdown(breakdown);

      const state = useTimesheetStore.getState();
      expect(state.projectBreakdown).toEqual(breakdown);
    });
  });

  describe('validation', () => {
    it('should set validation result', () => {
      const validationResult = {
        isValid: false,
        errors: ['Maximum hours per day exceeded'],
      };

      useTimesheetStore.getState().setValidationResult(validationResult);

      const state = useTimesheetStore.getState();
      expect(state.validationResult).toEqual(validationResult);
    });

    it('should clear validation result', () => {
      const validationResult = {
        isValid: false,
        errors: ['Error'],
      };

      useTimesheetStore.getState().setValidationResult(validationResult);
      useTimesheetStore.getState().setValidationResult(null);

      const state = useTimesheetStore.getState();
      expect(state.validationResult).toBeNull();
    });
  });

  describe('UI state management', () => {
    it('should set selected week start', () => {
      const newDate = new Date('2025-01-20');

      useTimesheetStore.getState().setSelectedWeekStart(newDate);

      const state = useTimesheetStore.getState();
      expect(state.selectedWeekStart).toEqual(newDate);
    });

    it('should set loading state', () => {
      useTimesheetStore.getState().setIsLoading(true);
      expect(useTimesheetStore.getState().isLoading).toBe(true);

      useTimesheetStore.getState().setIsLoading(false);
      expect(useTimesheetStore.getState().isLoading).toBe(false);
    });

    it('should set active tab', () => {
      useTimesheetStore.getState().setActiveTab('history');
      expect(useTimesheetStore.getState().activeTab).toBe('history');

      useTimesheetStore.getState().setActiveTab('reports');
      expect(useTimesheetStore.getState().activeTab).toBe('reports');

      useTimesheetStore.getState().setActiveTab('week');
      expect(useTimesheetStore.getState().activeTab).toBe('week');
    });
  });

  describe('clearTimesheet', () => {
    it('should clear all timesheet data', () => {
      // Set up some data
      const mockTimesheet: Timesheet = {
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

      const mockEntry: TimeEntry = {
        id: '1',
        timesheetId: '1',
        projectId: 'proj-1',
        taskId: 'task-1',
        tenantId: 'tenant-1',
        userId: '1',
        dayOfWeek: 1,
        hours: 8,
        notes: 'Work',
        createdAt: '2025-01-13T10:00:00.000Z',
        updatedAt: '2025-01-13T10:00:00.000Z',
      };

      useTimesheetStore.setState({
        currentTimesheet: mockTimesheet,
        timeEntries: [mockEntry],
        dailyTotals: [8, 8, 8, 8, 8, 0, 0],
        weeklyTotal: 40,
        projectBreakdown: [{ projectId: 'proj-1', projectName: 'Project', totalHours: 40, percentage: 100 }],
        validationResult: { isValid: true, errors: [] },
        isLoading: true,
      });

      useTimesheetStore.getState().clearTimesheet();

      const state = useTimesheetStore.getState();
      expect(state.currentTimesheet).toBeNull();
      expect(state.timeEntries).toEqual([]);
      expect(state.dailyTotals).toEqual([]);
      expect(state.weeklyTotal).toBe(0);
      expect(state.projectBreakdown).toEqual([]);
      expect(state.validationResult).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });
});
