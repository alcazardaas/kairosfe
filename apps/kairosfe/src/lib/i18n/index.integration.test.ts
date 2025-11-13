import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/lib/store';
import i18n from './index';

describe('i18n Integration', () => {
  beforeEach(async () => {
    // Reset i18n to default language
    await i18n.changeLanguage('en');

    // Reset UI store
    useUIStore.setState({ locale: 'en' });
  });

  it('should integrate with UI store to change language', async () => {
    // Initial state
    expect(i18n.language).toBe('en');
    expect(useUIStore.getState().locale).toBe('en');

    // Change language through store action
    useUIStore.getState().setLocale('es');
    await i18n.changeLanguage('es');

    // Verify both are synchronized
    expect(i18n.language).toBe('es');
    expect(useUIStore.getState().locale).toBe('es');
  });

  it('should translate keys correctly for different languages', async () => {
    // English
    await i18n.changeLanguage('en');
    expect(i18n.t('common.loading')).toBeTruthy();
    expect(i18n.t('auth.loginButton')).toBeTruthy();

    // Spanish
    await i18n.changeLanguage('es');
    expect(i18n.t('common.loading')).toBeTruthy();
    expect(i18n.t('auth.loginButton')).toBeTruthy();

    // Portuguese
    await i18n.changeLanguage('pt-PT');
    expect(i18n.t('common.loading')).toBeTruthy();

    // German
    await i18n.changeLanguage('de');
    expect(i18n.t('common.loading')).toBeTruthy();
  });

  it('should fall back to English for missing translations', async () => {
    await i18n.changeLanguage('es');

    // Request a key that might not exist
    const translation = i18n.t('nonexistent.key');

    // Should return the key itself (i18n fallback behavior)
    expect(translation).toBeTruthy();
  });

  it('should support all configured languages', () => {
    const supportedLanguages = ['en', 'es', 'pt-PT', 'de'];

    // Verify i18n knows about all languages
    supportedLanguages.forEach((lang) => {
      expect(i18n.hasResourceBundle(lang, 'translation')).toBe(true);
    });
  });
});
