/**
 * Debug utility to check authentication state
 * Call this in browser console to see current auth status
 */
export function debugAuth() {
  if (typeof window === 'undefined') {
    console.log('Not in browser');
    return;
  }

  console.log('=== AUTH DEBUG ===');

  // Check localStorage
  const localStorageAuth = localStorage.getItem('kairos-auth');
  console.log('localStorage auth:', localStorageAuth ? JSON.parse(localStorageAuth) : 'not found');

  // Check cookies
  console.log('All cookies:', document.cookie);
  const hasAuthCookie = document.cookie.includes('kairos-auth-token=');
  console.log('Has kairos-auth-token cookie:', hasAuthCookie);

  if (hasAuthCookie) {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('kairos-auth-token='));
    if (authCookie) {
      const tokenValue = authCookie.split('=')[1];
      console.log('Cookie token (first 20 chars):', tokenValue.substring(0, 20) + '...');
    }
  }

  console.log('==================');
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
