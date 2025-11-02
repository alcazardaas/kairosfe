import { useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { menuItems } from '@/app.config';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function SidebarNav() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.role);
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  // Get current pathname for active state
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  // Handle responsive behavior - close sidebar on mobile after navigation
  useEffect(() => {
    const handleResize = () => {
      // Auto-close on mobile/tablet, auto-open on desktop
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Sidebar header with close button (mobile only) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-2xl">timelapse</span>
            <h2 className="text-lg font-bold">Kairos</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center rounded-full h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            aria-label={t('common.closeSidebar')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            {filteredMenuItems.map((item) => {
              const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);

              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-primary text-white font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-xl">
                      {item.icon}
                    </span>
                  )}
                  <span className="text-sm">{t(item.labelKey)}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
