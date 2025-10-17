import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import ptPT from './locales/pt-PT.json';
import de from './locales/de.json';

const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'en';

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    'pt-PT': { translation: ptPT },
    de: { translation: de },
  },
  lng: defaultLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
