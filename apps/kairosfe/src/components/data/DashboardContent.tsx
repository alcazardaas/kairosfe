import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { trackPageView } from '@/lib/analytics/posthog';
import '@/lib/i18n';

export default function DashboardContent() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    trackPageView('dashboard');
  }, []);

  return (
    <div className="dashboard">
      <h1>{t('dashboard.welcome', { name: user?.name || 'User' })}</h1>

      <div className="dashboard-grid">
        <div className="card">
          <h2>{t('dashboard.quickActions')}</h2>
          <div className="quick-actions">
            <a href="/leave-requests" className="btn btn-primary">
              {t('leaveRequests.createRequest')}
            </a>
            <a href="/profile" className="btn btn-secondary">
              {t('profile.editProfile')}
            </a>
          </div>
        </div>

        <div className="card">
          <h2>{t('dashboard.recentActivity')}</h2>
          <p className="muted">{t('common.loading')}</p>
        </div>
      </div>
    </div>
  );
}
