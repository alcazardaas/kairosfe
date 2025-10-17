import type { User } from '@kairos/shared';

// Auth helper for Astro pages
export function requireAuth(cookies: {
  get: (key: string) => { value: string } | undefined;
}): { isAuthenticated: boolean; user: User | null } {
  const authCookie = cookies.get('kairos-auth');

  if (!authCookie) {
    return { isAuthenticated: false, user: null };
  }

  try {
    const authData = JSON.parse(authCookie.value);
    return {
      isAuthenticated: authData.state?.isAuthenticated || false,
      user: authData.state?.user || null,
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}
