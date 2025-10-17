import { useAuthStore } from '@/lib/store';
import { menuItems } from '@/app.config';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function SidebarNav() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.role);

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  // Get current pathname for active state
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <nav className="sidebar__nav">
      {filteredMenuItems.map((item) => {
        const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);

        return (
          <a
            key={item.path}
            href={item.path}
            className={`sidebar__link ${isActive ? 'active' : ''}`}
          >
            {item.icon && (
              <span className="material-symbols-outlined sidebar__icon">
                {item.icon}
              </span>
            )}
            <span className="sidebar__label">{t(item.labelKey)}</span>
          </a>
        );
      })}
    </nav>
  );
}
