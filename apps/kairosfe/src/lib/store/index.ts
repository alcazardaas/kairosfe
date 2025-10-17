import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LeaveRequest, Permission, UserPolicy, UserRole } from '@kairos/shared';

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
          const user = await apiClient.get<User>('/me', true);

          set({
            user,
            isAuthenticated: true,
            role: user.role,
            permissions: user.permissions || [],
            policy: user.policy || null,
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
