/**
 * Tests for AsyncCombobox Component
 * Comprehensive coverage of async autocomplete functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AsyncCombobox from './AsyncCombobox';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.noResults': 'No results found',
        'common.typeToSearch': 'Type to search',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock i18n module
vi.mock('@/lib/i18n', () => ({}));

describe('AsyncCombobox', () => {
  const mockOnChange = vi.fn();
  const mockOnSearch = vi.fn();

  const mockOptions = [
    { id: '1', name: 'Option 1', code: 'OPT1' },
    { id: '2', name: 'Option 2', code: 'OPT2' },
    { id: '3', name: 'Option 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSearch.mockResolvedValue(mockOptions);
  });

  describe('rendering', () => {
    it('should render with label', () => {
      render(
        <AsyncCombobox
          label="Select Country"
          value=""
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('Select Country')).toBeInTheDocument();
    });

    it('should render input with placeholder', () => {
      render(
        <AsyncCombobox
          label="Test"
          placeholder="Search countries..."
          value=""
          onChange={mockOnChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByPlaceholderText('Search countries...')).toBeInTheDocument();
    });

    it('should use default placeholder', () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should show expand icon when closed', () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} />
      );

      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasExpandMore = Array.from(icons).some((icon) => icon.textContent === 'expand_more');
      expect(hasExpandMore).toBe(true);
    });
  });

  describe('opening dropdown', () => {
    it('should show expand_less icon when open', async () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        const icons = document.querySelectorAll('.material-symbols-outlined');
        const hasExpandLess = Array.from(icons).some((icon) => icon.textContent === 'expand_less');
        expect(hasExpandLess).toBe(true);
      });
    });

    it('should load initial options when opened', async () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('');
      }, { timeout: 1000 });
    });
  });

  describe('searching', () => {
    it('should debounce search input', async () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test');
      }, { timeout: 1000 });
    });

    it('should display search results', async () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should display option codes', async () => {
      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('OPT1')).toBeInTheDocument();
        expect(screen.getByText('OPT2')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('loading state', () => {
    it('should show loading text when searching', async () => {
      let resolveSearch: any;
      mockOnSearch.mockImplementation(() => new Promise((resolve) => { resolveSearch = resolve; }));

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Resolve the promise
      resolveSearch(mockOptions);
    });
  });

  describe('empty states', () => {
    it('should show "No results found" when search returns empty', async () => {
      mockOnSearch.mockResolvedValue([]);

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('option selection', () => {
    it('should call onChange with selected option id', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      }, { timeout: 1000 });

      await user.click(screen.getByText('Option 1'));

      expect(mockOnChange).toHaveBeenCalledWith('1');
    });

    it('should display selected option name in input', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      }, { timeout: 1000 });

      await user.click(screen.getByText('Option 1'));

      expect(input.value).toBe('Option 1');
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      }, { timeout: 1000 });

      await user.click(screen.getByText('Option 1'));

      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('clear functionality', () => {
    it('should show clear button when option is selected', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      }, { timeout: 1000 });

      await user.click(screen.getByText('Option 1'));

      await waitFor(() => {
        const closeIcons = document.querySelectorAll('.material-symbols-outlined');
        const hasCloseIcon = Array.from(closeIcons).some((icon) => icon.textContent === 'close');
        expect(hasCloseIcon).toBe(true);
      }, { timeout: 1000 });
    });

    it('should clear selection when clear button is clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={10} />
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      }, { timeout: 1000 });

      await user.click(screen.getByText('Option 1'));

      expect(input.value).toBe('Option 1');

      const closeButtons = document.querySelectorAll('button[type="button"]');
      const closeButton = Array.from(closeButtons).find(btn =>
        btn.querySelector('.material-symbols-outlined')?.textContent === 'close'
      );

      if (closeButton) {
        await user.click(closeButton as HTMLElement);
        expect(input.value).toBe('');
        expect(mockOnChange).toHaveBeenCalledWith('');
      }
    });
  });

  describe('disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <AsyncCombobox
          label="Test"
          value=""
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe('error display', () => {
    it('should show error message', () => {
      render(
        <AsyncCombobox
          label="Test"
          value=""
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          error="This field is required"
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error border styling', () => {
      render(
        <AsyncCombobox
          label="Test"
          value=""
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          error="Invalid"
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input.classList.contains('border-red-500')).toBe(true);
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes', () => {
      const { container } = render(
        <AsyncCombobox label="Test" value="" onChange={mockOnChange} onSearch={mockOnSearch} />
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-900');
      expect(htmlContent).toContain('dark:text-gray-100');
      expect(htmlContent).toContain('dark:border-gray-600');
    });
  });
});
