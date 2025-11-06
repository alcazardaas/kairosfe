/**
 * Simple utility for managing the auth cookie
 * This cookie is ONLY used by the middleware for SSR authentication checks
 * The full auth state is stored in localStorage via Zustand
 */

const COOKIE_NAME = 'kairos-auth-token';

/**
 * Set the auth cookie with just the token
 * This is much simpler than trying to sync entire Zustand state
 */
export function setAuthCookie(token: string): void {
  if (typeof window === 'undefined') return;

  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days

  document.cookie = `${COOKIE_NAME}=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict; Secure`;
}

/**
 * Remove the auth cookie
 */
export function removeAuthCookie(): void {
  if (typeof window === 'undefined') return;

  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

/**
 * Check if auth cookie exists (for client-side verification)
 */
export function hasAuthCookie(): boolean {
  if (typeof window === 'undefined') return false;

  return document.cookie.includes(`${COOKIE_NAME}=`);
}
