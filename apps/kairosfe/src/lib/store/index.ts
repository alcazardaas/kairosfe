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

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  permissions: Permission[];
  policy: UserPolicy | null;
  isHydrating: boolean;

  // Actions
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (token: string, refreshToken: string) => void;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

interface UIState {
  theme: 'auto' | 'light' | 'dark';
  locale: string;
  setTheme: (theme: 'auto' | 'light' | 'dark') => void;
  setLocale: (locale: string) => void;
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
      isAuthenticated: false,
      role: null,
      permissions: [],
      policy: null,
      isHydrating: false,

      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          role: user.role,
          permissions: user.permissions || [],
          policy: user.policy || null,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          permissions: [],
          policy: null,
        }),

      setTokens: (token, refreshToken) =>
        set({ token, refreshToken }),

      setUser: (user) =>
        set({
          user,
          role: user.role,
          permissions: user.permissions || [],
          policy: user.policy || null,
        }),

      hydrate: async () => {
        const { token } = get();

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
        } catch (error) {
          console.error('Failed to hydrate user session:', error);
          // Clear invalid session
          set({
            user: null,
            token: null,
            refreshToken: null,
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
    }
  )
);

// UI Store
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'auto',
      locale: 'en',
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
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
  currentTimesheet: Timesheet | null;
  timeEntries: TimeEntry[];
  selectedWeekStart: Date;
  isLoading: boolean;

  // Actions
  setCurrentTimesheet: (timesheet: Timesheet | null) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => void;
  removeTimeEntry: (id: string) => void;
  setSelectedWeekStart: (date: Date) => void;
  setIsLoading: (loading: boolean) => void;
  clearTimesheet: () => void;
}

export const useTimesheetStore = create<TimesheetState>((set) => ({
  currentTimesheet: null,
  timeEntries: [],
  selectedWeekStart: new Date(),
  isLoading: false,

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

  setSelectedWeekStart: (date) => set({ selectedWeekStart: date }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  clearTimesheet: () =>
    set({
      currentTimesheet: null,
      timeEntries: [],
      isLoading: false,
    }),
}));
