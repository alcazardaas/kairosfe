import { useEffect } from 'react';
import { useUIStore } from '@/lib/store';
import i18n from '@/lib/i18n';

/**
 * ThemeSync component
 * Synchronizes theme and locale from Zustand store to DOM and i18n
 * This component should be included once at the root level of the app
 */
export default function ThemeSync() {
  const { theme, locale } = useUIStore();

  // Sync theme to DOM whenever it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'auto') {
      // Handle auto theme based on system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Sync locale to i18n and HTML lang attribute whenever it changes
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // This component doesn't render anything
  return null;
}
