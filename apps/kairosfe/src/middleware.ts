import { defineMiddleware } from 'astro:middleware';

const PUBLIC_ROUTES = ['/login', '/'];
const PROTECTED_ROUTES = [
  '/dashboard',
  '/timesheet',
  '/profile',
  '/team-management',
  '/team-timesheets',
  '/team-calendar',
  '/team-reports',
  '/team-member-performance',
  '/leave-requests',
  '/team-leave',
  '/settings',
];

export const onRequest = defineMiddleware((context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return next();
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return next();
  }

  // Check for auth token in cookies
  // The cookie contains just the token, not the full auth state
  const authToken = cookies.get('kairos-auth-token');

  if (!authToken || !authToken.value) {
    // Check if this is a client-side navigation (has a referrer from same origin)
    // If so, let the client-side AuthGuard handle the redirect
    const referer = context.request.headers.get('referer');
    if (referer && new URL(referer).origin === url.origin) {
      return next();
    }

    // Server-side redirect for direct access without auth
    return redirect('/login');
  }

  return next();
});
