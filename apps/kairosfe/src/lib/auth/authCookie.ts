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

  // Only use Secure flag in production (HTTPS)
  const isProduction = window.location.protocol === 'https:';
  const secureFlag = isProduction ? '; Secure' : '';

  const cookieString = `${COOKIE_NAME}=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict${secureFlag}`;
  document.cookie = cookieString;

  console.log('[AuthCookie] Set auth cookie:', {
    cookieName: COOKIE_NAME,
    tokenLength: token.length,
    expires: expires.toUTCString(),
    isProduction,
    cookieString: cookieString.substring(0, 100) + '...'
  });

  // Verify it was set
  setTimeout(() => {
    const wasSet = document.cookie.includes(`${COOKIE_NAME}=`);
    console.log('[AuthCookie] Cookie verification:', { wasSet, allCookies: document.cookie });
  }, 100);
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
