import type { StateStorage } from 'zustand/middleware';

/**
 * Custom Zustand storage that syncs to both localStorage and cookies
 * This ensures auth state works on both client-side and server-side (SSR)
 *
 * The full state is stored in localStorage.
 * A minimal version (just for token validation) is stored in cookies for SSR middleware.
 */
export const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    // Always read from localStorage (client-side)
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(name);
      return item;
    }
    return null;
  },

  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        // Always set in localStorage (full state)
        localStorage.setItem(name, value);

        // Parse the state to create a minimal cookie version
        // Cookies have 4KB limit, so we only store essential auth info
        const state = JSON.parse(value);
        const minimalState = {
          state: {
            token: state.state?.token || null,
            isAuthenticated: state.state?.isAuthenticated || false,
          }
        };

        // Set minimal state in cookies for SSR middleware
        const cookieValue = JSON.stringify(minimalState);
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);

        document.cookie = `${name}=${encodeURIComponent(cookieValue)}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
      } catch (error) {
        console.error('Failed to sync auth state to cookies:', error);
        // Still set localStorage even if cookie fails
        localStorage.setItem(name, value);
      }
    }
  },

  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      // Remove from localStorage
      localStorage.removeItem(name);

      // Remove from cookies
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
    }
  },
};
