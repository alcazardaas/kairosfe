import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/lib/store';
import { trackPageView } from '@/lib/analytics/posthog';
import { captureError } from '@/lib/analytics/sentry';
import '@/lib/i18n';

export default function SettingsContent() {
  const { t } = useTranslation();
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    trackPageView('settings');
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as 'auto' | 'light' | 'dark');
  };

  const testErrorReporting = () => {
    try {
      throw new Error('Test error for Sentry');
    } catch (error) {
      captureError(error as Error, { context: 'settings_page' });
    }
  };

  return (
    <div className="settings">
      <h1>{t('settings.title')}</h1>

      <div className="card">
        <div className="settings-section">
          <label>{t('settings.theme')}</label>
          <select value={theme} onChange={handleThemeChange}>
            <option value="auto">{t('settings.themeAuto')}</option>
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
          </select>
        </div>

        <div className="settings-section">
          <label>{t('settings.apiBaseUrl')}</label>
          <input
            type="text"
            value={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}
            readOnly
            disabled
          />
        </div>

        <div className="settings-section">
          <button className="btn btn-secondary" onClick={testErrorReporting}>
            {t('settings.testError')}
          </button>
        </div>
      </div>
    </div>
  );
}
