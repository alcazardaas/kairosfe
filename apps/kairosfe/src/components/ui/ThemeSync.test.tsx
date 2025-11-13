/**
 * Tests for ThemeSync Component
 * Comprehensive coverage of theme and locale synchronization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ThemeSync from './ThemeSync';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));

// Mock UIStore
const mockUseUIStore = vi.fn();

vi.mock('@/lib/store', () => ({
  useUIStore: () => mockUseUIStore(),
}));

describe('ThemeSync', () => {
  let matchMediaMock: vi.Mock;
  let i18n: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked i18n module
    i18n = (await import('@/lib/i18n')).default;
    i18n.language = 'en';

    // Reset document classes and lang
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = '';

    // Default store values
    mockUseUIStore.mockReturnValue({
      theme: 'light',
      locale: 'en',
    });

    // Mock window.matchMedia
    matchMediaMock = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = '';
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ThemeSync />);
      expect(container).toBeInTheDocument();
    });

    it('should not render any visible content', () => {
      const { container } = render(<ThemeSync />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('theme sync - light mode', () => {
    it('should remove dark class in light mode', () => {
      document.documentElement.classList.add('dark');

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should not add dark class in light mode', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('theme sync - dark mode', () => {
    it('should add dark class in dark mode', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should keep dark class if already present', () => {
      document.documentElement.classList.add('dark');

      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('theme sync - auto mode', () => {
    it('should add dark class when system prefers dark', () => {
      matchMediaMock.mockReturnValue({ matches: true });

      mockUseUIStore.mockReturnValue({
        theme: 'auto',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when system prefers light', () => {
      document.documentElement.classList.add('dark');
      matchMediaMock.mockReturnValue({ matches: false });

      mockUseUIStore.mockReturnValue({
        theme: 'auto',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should check system preference with correct media query', () => {
      matchMediaMock.mockReturnValue({ matches: false });

      mockUseUIStore.mockReturnValue({
        theme: 'auto',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });

  describe('theme changes', () => {
    it('should update when theme changes from light to dark', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);

      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });

      rerender(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should update when theme changes from dark to light', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      rerender(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should update when theme changes from light to auto', () => {
      matchMediaMock.mockReturnValue({ matches: true });

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);

      mockUseUIStore.mockReturnValue({
        theme: 'auto',
        locale: 'en',
      });

      rerender(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('locale sync', () => {
    it('should call i18n.changeLanguage with locale', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'es',
      });

      render(<ThemeSync />);

      expect(i18n.changeLanguage).toHaveBeenCalledWith('es');
    });

    it('should set document.documentElement.lang', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'de',
      });

      render(<ThemeSync />);

      expect(document.documentElement.lang).toBe('de');
    });

    it('should not change language if already set to same locale', () => {
      i18n.language = 'pt-PT';

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'pt-PT',
      });

      render(<ThemeSync />);

      expect(i18n.changeLanguage).not.toHaveBeenCalled();
    });

    it('should change language if different from current', () => {
      i18n.language = 'en';

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'es',
      });

      render(<ThemeSync />);

      expect(i18n.changeLanguage).toHaveBeenCalledWith('es');
    });

    it('should not update if locale is falsy', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: '',
      });

      render(<ThemeSync />);

      expect(i18n.changeLanguage).not.toHaveBeenCalled();
      expect(document.documentElement.lang).toBe('');
    });
  });

  describe('locale changes', () => {
    it('should update when locale changes', () => {
      i18n.language = 'en';

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      vi.clearAllMocks();

      i18n.language = 'en'; // Still en, so new locale will trigger change

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'es',
      });

      rerender(<ThemeSync />);

      expect(i18n.changeLanguage).toHaveBeenCalledWith('es');
      expect(document.documentElement.lang).toBe('es');
    });

    it('should update lang attribute when locale changes', () => {
      i18n.language = 'es'; // Start with different language

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      expect(document.documentElement.lang).toBe('en');

      i18n.language = 'en';

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'de',
      });

      rerender(<ThemeSync />);

      expect(document.documentElement.lang).toBe('de');
    });
  });

  describe('combined theme and locale', () => {
    it('should sync both theme and locale on mount', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'es',
      });

      render(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(i18n.changeLanguage).toHaveBeenCalledWith('es');
      expect(document.documentElement.lang).toBe('es');
    });

    it('should handle theme and locale changes independently', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      // Change only theme
      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });

      rerender(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Change only locale
      i18n.language = 'en';

      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'es',
      });

      rerender(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(i18n.changeLanguage).toHaveBeenCalledWith('es');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid theme changes', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });
      rerender(<ThemeSync />);

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });
      rerender(<ThemeSync />);

      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        locale: 'en',
      });
      rerender(<ThemeSync />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should handle rapid locale changes', () => {
      i18n.language = 'en';

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'en',
      });

      const { rerender } = render(<ThemeSync />);

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'es',
      });
      rerender(<ThemeSync />);

      mockUseUIStore.mockReturnValue({
        theme: 'light',
        locale: 'de',
      });
      rerender(<ThemeSync />);

      expect(document.documentElement.lang).toBe('de');
    });

    it('should handle all supported locales', () => {
      const locales = ['en', 'es', 'pt-PT', 'de'];

      locales.forEach((locale) => {
        // Set i18n.language to something different to ensure the effect runs
        i18n.language = locale === 'en' ? 'es' : 'en';

        mockUseUIStore.mockReturnValue({
          theme: 'light',
          locale,
        });

        render(<ThemeSync />);

        expect(document.documentElement.lang).toBe(locale);

        // Cleanup
        document.documentElement.lang = '';
        vi.clearAllMocks();
      });
    });

    it('should not crash with undefined theme', () => {
      mockUseUIStore.mockReturnValue({
        theme: undefined as any,
        locale: 'en',
      });

      expect(() => render(<ThemeSync />)).not.toThrow();
    });
  });

  describe('system preference integration', () => {
    it('should respect system dark preference in auto mode', () => {
      matchMediaMock.mockReturnValue({ matches: true });

      mockUseUIStore.mockReturnValue({
        theme: 'auto',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should respect system light preference in auto mode', () => {
      matchMediaMock.mockReturnValue({ matches: false });

      mockUseUIStore.mockReturnValue({
        theme: 'auto',
        locale: 'en',
      });

      render(<ThemeSync />);

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
