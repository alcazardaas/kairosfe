import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  LeaveRequest,
  Permission,
  UserPolicy,
  UserRole,
  Timesheet,
  TimeEntry
} from '@kairos/shared';
import type {
  ProjectBreakdownDto,
  ValidationResult,
} from '../api/schemas';
import { cookieStorage } from './cookieStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresIn: number | null; // Token expiry in seconds
  isAuthenticated: boolean;
  role: UserRole | null;
  permissions: Permission[];
  policy: UserPolicy | null;
  isHydrating: boolean;

  // Actions
  login: (user: User, token: string, refreshToken: string, expiresIn: number) => void;
  logout: () => void;
  setTokens: (token: string, refreshToken: string, expiresIn?: number) => void;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

interface UIState {
  theme: 'auto' | 'light' | 'dark';
  locale: string;
  isSidebarOpen: boolean;
  setTheme: (theme: 'auto' | 'light' | 'dark') => void;
  setLocale: (locale: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

interface LeaveRequestsState {
  requests: LeaveRequest[];
  setRequests: (requests: LeaveRequest[]) => void;
  addRequest: (request: LeaveRequest) => void;
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresIn: null,
      isAuthenticated: false,
      role: null,
      permissions: [],
      policy: null,
      isHydrating: false,

      login: (user, token, refreshToken, expiresIn) => {
        set({
          user,
          token,
          refreshToken,
          tokenExpiresIn: expiresIn,
          isAuthenticated: true,
          role: user.role,
          permissions: user.permissions || [],
          policy: user.policy || null,
        });

        // Initialize token refresh manager
        if (typeof window !== 'undefined') {
          import('../auth/tokenRefresh').then(({ initializeTokenRefresh }) => {
            initializeTokenRefresh(expiresIn);
          });
        }
      },

      logout: () => {
        // Cleanup token refresh manager
        if (typeof window !== 'undefined') {
          import('../auth/tokenRefresh').then(({ cleanupTokenRefresh }) => {
            cleanupTokenRefresh();
          });
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpiresIn: null,
          isAuthenticated: false,
          role: null,
          permissions: [],
          policy: null,
        });
      },

      setTokens: (token, refreshToken, expiresIn) => {
        set({
          token,
          refreshToken,
          isAuthenticated: !!token, // Set isAuthenticated based on token presence
          ...(expiresIn !== undefined && { tokenExpiresIn: expiresIn })
        });

        // Reinitialize token refresh if expiresIn is provided
        if (expiresIn !== undefined && typeof window !== 'undefined') {
          import('../auth/tokenRefresh').then(({ initializeTokenRefresh }) => {
            initializeTokenRefresh(expiresIn);
          });
        }
      },

      setUser: (user) =>
        set({
          user,
          role: user.role,
          permissions: user.permissions || [],
          policy: user.policy || null,
        }),

      hydrate: async () => {
        const { token, tokenExpiresIn } = get();

        if (!token) {
          set({ isAuthenticated: false, isHydrating: false });
          return;
        }

        set({ isHydrating: true });

        try {
          // Import dynamically to avoid circular dependencies
          const { apiClient } = await import('../api/client');

          // Call /auth/me to get full user context
          const response = await apiClient.get<any>('/auth/me', true);
          const { data } = response;

          // Build full user object from the /auth/me response
          const fullUser: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.membership.role,
            permissions: [], // Will be populated based on role
            policy: data.timesheetPolicy ? {
              maxHoursPerDay: 24,
              maxHoursPerWeek: data.timesheetPolicy.hoursPerWeek,
              canApproveTimesheets: data.membership.role === 'manager' || data.membership.role === 'admin',
              canApproveLeaveRequests: data.membership.role === 'manager' || data.membership.role === 'admin',
            } : undefined,
          };

          // Set permissions based on role
          if (data.membership.role === 'admin') {
            fullUser.permissions = [
              'view_dashboard' as const,
              'view_profile' as const,
              'edit_profile' as const,
              'view_team' as const,
              'manage_team' as const,
              'view_leave_requests' as const,
              'create_leave_request' as const,
              'approve_leave_requests' as const,
              'view_timesheets' as const,
              'create_timesheet' as const,
              'approve_timesheets' as const,
            ];
          } else if (data.membership.role === 'manager') {
            fullUser.permissions = [
              'view_dashboard' as const,
              'view_profile' as const,
              'edit_profile' as const,
              'view_team' as const,
              'manage_team' as const,
              'view_leave_requests' as const,
              'create_leave_request' as const,
              'approve_leave_requests' as const,
              'view_timesheets' as const,
              'create_timesheet' as const,
              'approve_timesheets' as const,
            ];
          } else {
            fullUser.permissions = [
              'view_dashboard' as const,
              'view_profile' as const,
              'edit_profile' as const,
              'view_leave_requests' as const,
              'create_leave_request' as const,
              'view_timesheets' as const,
              'create_timesheet' as const,
            ];
          }

          set({
            user: fullUser,
            isAuthenticated: true,
            role: fullUser.role,
            permissions: fullUser.permissions,
            policy: fullUser.policy,
            isHydrating: false,
          });

          // Initialize token refresh if we have tokenExpiresIn
          if (tokenExpiresIn && typeof window !== 'undefined') {
            const { initializeTokenRefresh } = await import('../auth/tokenRefresh');
            initializeTokenRefresh(tokenExpiresIn);
          }
        } catch (error) {
          console.error('Failed to hydrate user session:', error);
          // Clear invalid session
          set({
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
        }
      },
    }),
    {
      name: 'kairos-auth',
      storage: cookieStorage,
    }
  )
);

// UI Store
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      locale: 'en',
      // Sidebar is open by default on desktop (≥1024px), closed on smaller screens
      isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
    }),
    {
      name: 'kairos-ui',
    }
  )
);

// Leave Requests Store
export const useLeaveRequestsStore = create<LeaveRequestsState>((set) => ({
  requests: [],
  setRequests: (requests) => set({ requests }),
  addRequest: (request) =>
    set((state) => ({ requests: [...state.requests, request] })),
}));

// Timesheet Store
interface TimesheetState {
  // Data
  currentTimesheet: Timesheet | null;
  timeEntries: TimeEntry[];
  dailyTotals: number[]; // Array of 7 numbers (one per day, Sun-Sat)
  weeklyTotal: number;
  projectBreakdown: ProjectBreakdownDto[];
  validationResult: ValidationResult | null;

  // UI State
  selectedWeekStart: Date;
  isLoading: boolean;
  activeTab: 'week' | 'history' | 'reports';

  // Actions
  setCurrentTimesheet: (timesheet: Timesheet | null) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => void;
  removeTimeEntry: (id: string) => void;
  setDailyTotals: (totals: number[]) => void;
  setWeeklyTotal: (total: number) => void;
  setProjectBreakdown: (breakdown: ProjectBreakdownDto[]) => void;
  setValidationResult: (result: ValidationResult | null) => void;
  setSelectedWeekStart: (date: Date) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveTab: (tab: 'week' | 'history' | 'reports') => void;
  clearTimesheet: () => void;
}

export const useTimesheetStore = create<TimesheetState>((set) => ({
  // Data
  currentTimesheet: null,
  timeEntries: [],
  dailyTotals: [],
  weeklyTotal: 0,
  projectBreakdown: [],
  validationResult: null,

  // UI State
  selectedWeekStart: new Date(),
  isLoading: false,
  activeTab: 'week',

  // Actions
  setCurrentTimesheet: (timesheet) => set({ currentTimesheet: timesheet }),

  setTimeEntries: (entries) => set({ timeEntries: entries }),

  addTimeEntry: (entry) =>
    set((state) => ({ timeEntries: [...state.timeEntries, entry] })),

  updateTimeEntry: (id, updates) =>
    set((state) => ({
      timeEntries: state.timeEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    })),

  removeTimeEntry: (id) =>
    set((state) => ({
      timeEntries: state.timeEntries.filter((entry) => entry.id !== id),
    })),

  setDailyTotals: (totals) => set({ dailyTotals: totals }),

  setWeeklyTotal: (total) => set({ weeklyTotal: total }),

  setProjectBreakdown: (breakdown) => set({ projectBreakdown: breakdown }),

  setValidationResult: (result) => set({ validationResult: result }),

  setSelectedWeekStart: (date) => set({ selectedWeekStart: date }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearTimesheet: () =>
    set({
      currentTimesheet: null,
      timeEntries: [],
      dailyTotals: [],
      weeklyTotal: 0,
      projectBreakdown: [],
      validationResult: null,
      isLoading: false,
    }),
}));
