import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { trackPageView } from '@/lib/analytics/posthog';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import '@/lib/i18n';

export default function ProfileContent() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    trackPageView('profile');
  }, []);

  return (
    <div className="profile">
      <h1>{t('profile.title')}</h1>

      <div className="card">
        <div className="profile-info">
          <div className="profile-field">
            <label>{t('profile.name')}</label>
            <p>{user?.name}</p>
          </div>

          <div className="profile-field">
            <label>{t('profile.email')}</label>
            <p>{user?.email}</p>
          </div>

          <div className="profile-field">
            <label>{t('profile.role')}</label>
            <p>{user?.role}</p>
          </div>

          <div className="profile-field">
            <label>{t('profile.language')}</label>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
