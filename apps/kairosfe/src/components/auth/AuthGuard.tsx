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
      const { isAuthenticated: currentAuth, hydrate } = useAuthStore.getState();

      // Only hydrate if not already authenticated
      if (!currentAuth) {
        await hydrate();
      }
      setIsReady(true);
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
