/**
 * Token Refresh Utility
 * Manages automatic background token refresh to prevent session expiry
 */

import { useAuthStore } from '../store';
import { apiClient } from '../api/client';

// Refresh token 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

class TokenRefreshManager {
  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private tokenExpiresAt: number | null = null;
  private isRefreshing = false;

  /**
   * Initialize the token refresh manager
   * Call this on app startup after user is hydrated
   */
  public initialize(expiresIn: number): void {
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    // Calculate expiry timestamp
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;

    // Schedule the refresh
    this.scheduleRefresh();

    console.log('[TokenRefresh] Initialized with expiry in', expiresIn, 'seconds');
  }

  /**
   * Schedule the next token refresh
   */
  private scheduleRefresh(): void {
    // Clear any existing timer
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    if (!this.tokenExpiresAt) {
      return;
    }

    // Calculate when to refresh (before expiry)
    const refreshAt = this.tokenExpiresAt - REFRESH_BUFFER_MS;
    const timeUntilRefresh = refreshAt - Date.now();

    // If token is already expired or about to expire, refresh immediately
    if (timeUntilRefresh <= 0) {
      console.log('[TokenRefresh] Token expired or about to expire, refreshing now');
      this.performRefresh();
      return;
    }

    console.log('[TokenRefresh] Next refresh scheduled in', Math.round(timeUntilRefresh / 1000), 'seconds');

    // Schedule the refresh
    this.refreshTimerId = setTimeout(() => {
      this.performRefresh();
    }, timeUntilRefresh);
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(): Promise<void> {
    if (this.isRefreshing) {
      console.log('[TokenRefresh] Refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        console.warn('[TokenRefresh] No refresh token available, cannot refresh');
        this.cleanup();
        useAuthStore.getState().logout();
        return;
      }

      console.log('[TokenRefresh] Refreshing access token...');

      const response = await fetch(`${apiClient['baseUrl']}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data: { token: string; expiresIn: number } = await response.json();

      // Update tokens in store
      useAuthStore.getState().setTokens(data.token, refreshToken);

      // Reinitialize with new expiry
      this.initialize(data.expiresIn);

      console.log('[TokenRefresh] Token refreshed successfully, expires in', data.expiresIn, 'seconds');
    } catch (error) {
      console.error('[TokenRefresh] Failed to refresh token:', error);

      // If refresh fails, log out the user
      this.cleanup();
      useAuthStore.getState().logout();

      // Optionally show a notification to the user
      if (typeof window !== 'undefined') {
        // You could dispatch a custom event or show a toast notification here
        console.error('Session expired. Please log in again.');
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually trigger a token refresh
   * Useful for testing or forcing a refresh
   */
  public async refresh(): Promise<void> {
    return this.performRefresh();
  }

  /**
   * Stop the refresh timer and cleanup
   */
  public cleanup(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.tokenExpiresAt = null;
    console.log('[TokenRefresh] Cleaned up');
  }

  /**
   * Get time until next refresh in seconds
   */
  public getTimeUntilRefresh(): number | null {
    if (!this.tokenExpiresAt) {
      return null;
    }

    const refreshAt = this.tokenExpiresAt - REFRESH_BUFFER_MS;
    const timeUntilRefresh = Math.max(0, refreshAt - Date.now());
    return Math.round(timeUntilRefresh / 1000);
  }

  /**
   * Check if token will expire soon
   */
  public isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiresAt) {
      return false;
    }

    const timeUntilExpiry = this.tokenExpiresAt - Date.now();
    return timeUntilExpiry <= REFRESH_BUFFER_MS;
  }
}

// Export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();

/**
 * Initialize token refresh on login
 * Call this after successful login
 */
export function initializeTokenRefresh(expiresIn: number): void {
  tokenRefreshManager.initialize(expiresIn);
}

/**
 * Cleanup token refresh on logout
 * Call this when user logs out
 */
export function cleanupTokenRefresh(): void {
  tokenRefreshManager.cleanup();
}

/**
 * Manually trigger token refresh
 */
export function refreshToken(): Promise<void> {
  return tokenRefreshManager.refresh();
}
