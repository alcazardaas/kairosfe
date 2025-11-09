import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import ptPT from './locales/pt-PT.json';
import de from './locales/de.json';

const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'en';

/**
 * Get persisted locale from localStorage
 * This ensures i18n initializes with the user's saved language preference
 */
const getPersistedLocale = (): string => {
  // Only run in browser
  if (typeof window === 'undefined') return defaultLocale;

  try {
    const stored = localStorage.getItem('kairos-ui');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.locale || defaultLocale;
    }
  } catch (e) {
    console.error('Failed to read persisted locale:', e);
  }

  return defaultLocale;
};

// Initialize with persisted locale instead of just env default
const initialLocale = getPersistedLocale();

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    'pt-PT': { translation: ptPT },
    de: { translation: de },
  },
  lng: initialLocale, // Use persisted locale
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
