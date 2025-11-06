import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isReady, setIsReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[AuthGuard] Starting auth check...');
        const { isAuthenticated: currentAuth, token, hydrate } = useAuthStore.getState();
        console.log('[AuthGuard] Current state:', { isAuthenticated: currentAuth, hasToken: !!token });

        // Only hydrate if we have a token but not authenticated yet
        if (token && !currentAuth) {
          console.log('[AuthGuard] Calling hydrate...');
          await hydrate();
          console.log('[AuthGuard] Hydrate completed');
        } else if (!token) {
          console.log('[AuthGuard] No token found');
        } else {
          console.log('[AuthGuard] Already authenticated, skipping hydrate');
        }
      } catch (error) {
        console.error('[AuthGuard] Error during auth check:', error);
      } finally {
        // ALWAYS set isReady, even if there's an error
        console.log('[AuthGuard] Setting isReady to true');
        setIsReady(true);
      }
    };

    initAuth();
  }, []); // Run only once on mount

  useEffect(() => {
    // Redirect to login if not authenticated after hydration
    if (isReady && !isAuthenticated && !isHydrating) {
      window.location.href = '/login';
    }
  }, [isReady, isAuthenticated, isHydrating]);

  // Show loading state while checking authentication
  if (!isReady || isHydrating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
