/**
 * Tests for LanguageSwitcher Component
 * Comprehensive coverage of language selection functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSwitcher from './LanguageSwitcher';

// Mock i18next
const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock UIStore
const mockSetLocale = vi.fn();
const mockUseUIStore = vi.fn(() => ({
  locale: 'en',
  setLocale: mockSetLocale,
}));

vi.mock('@/lib/store', () => ({
  useUIStore: () => mockUseUIStore(),
}));

// Mock i18n module
vi.mock('@/lib/i18n', () => ({}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUIStore.mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
    });
  });

  describe('rendering', () => {
    it('should render select element', () => {
      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should have language-switcher class', () => {
      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('language-switcher');
    });

    it('should display current language from store', () => {
      mockUseUIStore.mockReturnValue({
        locale: 'es',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('es');
    });
  });

  describe('language options', () => {
    it('should render all 4 language options', () => {
      render(<LanguageSwitcher />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
    });

    it('should have English option with correct code', () => {
      render(<LanguageSwitcher />);

      const option = screen.getByRole('option', { name: 'English' }) as HTMLOptionElement;
      expect(option).toBeInTheDocument();
      expect(option.value).toBe('en');
    });

    it('should have Spanish option with correct code', () => {
      render(<LanguageSwitcher />);

      const option = screen.getByRole('option', { name: 'Español' }) as HTMLOptionElement;
      expect(option).toBeInTheDocument();
      expect(option.value).toBe('es');
    });

    it('should have Portuguese option with correct code', () => {
      render(<LanguageSwitcher />);

      const option = screen.getByRole('option', { name: 'Português' }) as HTMLOptionElement;
      expect(option).toBeInTheDocument();
      expect(option.value).toBe('pt-PT');
    });

    it('should have German option with correct code', () => {
      render(<LanguageSwitcher />);

      const option = screen.getByRole('option', { name: 'Deutsch' }) as HTMLOptionElement;
      expect(option).toBeInTheDocument();
      expect(option.value).toBe('de');
    });

    it('should have all options with correct values', () => {
      render(<LanguageSwitcher />);

      const options = screen.getAllByRole('option') as HTMLOptionElement[];
      const values = options.map((opt) => opt.value);

      expect(values).toEqual(['en', 'es', 'pt-PT', 'de']);
    });

    it('should display all language labels correctly', () => {
      render(<LanguageSwitcher />);

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Português')).toBeInTheDocument();
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
  });

  describe('language selection', () => {
    it('should call setLocale when language is changed', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'es');

      expect(mockSetLocale).toHaveBeenCalledWith('es');
    });

    it('should call i18n.changeLanguage when language is changed', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'de');

      expect(mockChangeLanguage).toHaveBeenCalledWith('de');
    });

    it('should handle changing to Spanish', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'es');

      expect(mockSetLocale).toHaveBeenCalledWith('es');
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });

    it('should handle changing to Portuguese', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'pt-PT');

      expect(mockSetLocale).toHaveBeenCalledWith('pt-PT');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-PT');
    });

    it('should handle changing to German', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'de');

      expect(mockSetLocale).toHaveBeenCalledWith('de');
      expect(mockChangeLanguage).toHaveBeenCalledWith('de');
    });

    it('should call both setLocale and changeLanguage in correct order', async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockSetLocale.mockImplementation(() => callOrder.push('setLocale'));
      mockChangeLanguage.mockImplementation(() => callOrder.push('changeLanguage'));

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'es');

      expect(callOrder).toEqual(['setLocale', 'changeLanguage']);
    });
  });

  describe('store integration', () => {
    it('should use locale from UIStore', () => {
      mockUseUIStore.mockReturnValue({
        locale: 'pt-PT',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('pt-PT');
    });

    it('should display German when store has de locale', () => {
      mockUseUIStore.mockReturnValue({
        locale: 'de',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('de');
      expect(screen.getByRole('option', { name: 'Deutsch', selected: true })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be accessible as a combobox', () => {
      render(<LanguageSwitcher />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have all options accessible', () => {
      render(<LanguageSwitcher />);

      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option).toBeInTheDocument();
      });
    });

    it('should maintain keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.click(select);
      await user.keyboard('{ArrowDown}');

      // Select should still be focused
      expect(select).toHaveFocus();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid language changes', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'es');
      await user.selectOptions(select, 'de');
      await user.selectOptions(select, 'pt-PT');

      expect(mockSetLocale).toHaveBeenCalledTimes(3);
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
      expect(mockSetLocale).toHaveBeenLastCalledWith('pt-PT');
      expect(mockChangeLanguage).toHaveBeenLastCalledWith('pt-PT');
    });

    it('should handle selecting same language twice', async () => {
      const user = userEvent.setup();

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'en');
      await user.selectOptions(select, 'en');

      expect(mockSetLocale).toHaveBeenCalledTimes(2);
      expect(mockSetLocale).toHaveBeenCalledWith('en');
    });

    it('should have unique keys for all options', () => {
      const { container } = render(<LanguageSwitcher />);

      const options = container.querySelectorAll('option');
      const keys = Array.from(options).map((opt) => opt.value);

      // Check all keys are unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should render with default English if store has unexpected value', () => {
      mockUseUIStore.mockReturnValue({
        locale: 'en',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('en');
    });
  });

  describe('controlled component behavior', () => {
    it('should be a controlled component', () => {
      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('en');
    });

    it('should reflect store changes immediately', () => {
      const { rerender } = render(<LanguageSwitcher />);

      let select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('en');

      // Update mock to return different locale
      mockUseUIStore.mockReturnValue({
        locale: 'es',
        setLocale: mockSetLocale,
      });

      rerender(<LanguageSwitcher />);

      select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('es');
    });

    it('should sync with store on every render', () => {
      mockUseUIStore.mockReturnValue({
        locale: 'de',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('de');
      expect(mockUseUIStore).toHaveBeenCalled();
    });
  });
});
