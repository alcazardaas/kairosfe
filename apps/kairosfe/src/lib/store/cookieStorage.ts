import type { StateStorage } from 'zustand/middleware';

/**
 * Custom Zustand storage that syncs to both localStorage and cookies
 * This ensures auth state works on both client-side and server-side (SSR)
 */
export const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    // First try localStorage (client-side)
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(name);
      return item;
    }
    return null;
  },

  setItem: (name: string, value: string): void => {
    // Set in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value);

      // Also set in cookies for SSR middleware
      // Cookie expires in 30 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
    }
  },

  removeItem: (name: string): void => {
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);

      // Also remove from cookies
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
    }
  },
};
