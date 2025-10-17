import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/lib/store';
import '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-PT', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { locale, setLocale } = useUIStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };

  return (
    <select value={locale} onChange={handleChange} className="language-switcher">
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
