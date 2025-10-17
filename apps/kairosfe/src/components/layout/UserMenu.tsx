import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {user.name}
      </span>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
      >
        {t('auth.logout')}
      </button>
    </div>
  );
}
