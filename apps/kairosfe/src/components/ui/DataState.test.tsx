/**
 * Tests for DataState Component
 * Comprehensive coverage of all state modes and configurations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataState from './DataState';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dataState.noData': 'No data available',
        'dataState.errorGeneric': 'An error occurred',
        'dataState.errorTitle': 'Error',
        'dataState.retry': 'Retry',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('DataState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success mode', () => {
    it('should render children when mode is success', () => {
      render(
        <DataState mode="success">
          <div>Success Content</div>
        </DataState>
      );

      expect(screen.getByText('Success Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <DataState mode="success">
          <div>First Child</div>
          <div>Second Child</div>
        </DataState>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });

    it('should not apply className in success mode', () => {
      const { container } = render(
        <DataState mode="success" className="custom-class">
          <div>Content</div>
        </DataState>
      );

      // Success mode renders a fragment, so className is not applied
      expect(container.querySelector('.custom-class')).not.toBeInTheDocument();
    });
  });

  describe('loading mode', () => {
    it('should render skeleton loader when mode is loading', () => {
      const { container } = render(<DataState mode="loading" />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render multiple skeleton bars', () => {
      const { container } = render(<DataState mode="loading" />);

      const bars = container.querySelectorAll('.bg-gray-200');
      expect(bars.length).toBeGreaterThan(3);
    });

    it('should apply custom className to loading skeleton', () => {
      const { container } = render(<DataState mode="loading" className="custom-loading" />);

      const skeleton = container.querySelector('.animate-pulse.custom-loading');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have dark mode classes', () => {
      const { container } = render(<DataState mode="loading" />);

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-700');
    });

    it('should not render children in loading mode', () => {
      render(
        <DataState mode="loading">
          <div>Should Not Render</div>
        </DataState>
      );

      expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument();
    });
  });

  describe('empty mode', () => {
    it('should render default empty state', () => {
      render(<DataState mode="empty" />);

      expect(screen.getByText('inbox')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      render(<DataState mode="empty" emptyMessage="No items found" />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render custom empty icon', () => {
      render(<DataState mode="empty" emptyIcon="folder_open" />);

      expect(screen.getByText('folder_open')).toBeInTheDocument();
    });

    it('should render empty action button', () => {
      const handleAction = vi.fn();

      render(
        <DataState
          mode="empty"
          emptyAction={{
            label: 'Create New',
            onClick: handleAction,
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    });

    it('should call action onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      render(
        <DataState
          mode="empty"
          emptyAction={{
            label: 'Create New',
            onClick: handleAction,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Create New' });
      await user.click(button);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when emptyAction is not provided', () => {
      render(<DataState mode="empty" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should apply custom className to empty container', () => {
      const { container } = render(<DataState mode="empty" className="custom-empty" />);

      const emptyDiv = container.querySelector('.custom-empty');
      expect(emptyDiv).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<DataState mode="empty" />);

      const emptyDiv = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(emptyDiv).toBeInTheDocument();
    });
  });

  describe('error mode', () => {
    it('should render default error state', () => {
      render(<DataState mode="error" />);

      expect(screen.getByText('error')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('should render error with string message', () => {
      render(<DataState mode="error" error="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should render error with Error object', () => {
      const error = new Error('Network request failed');
      render(<DataState mode="error" error={error} />);

      expect(screen.getByText('Network request failed')).toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const handleRetry = vi.fn();

      render(<DataState mode="error" onRetry={handleRetry} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(<DataState mode="error" onRetry={handleRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<DataState mode="error" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should apply custom className to error container', () => {
      const { container } = render(<DataState mode="error" className="custom-error" />);

      const errorDiv = container.querySelector('.custom-error');
      expect(errorDiv).toBeInTheDocument();
    });

    it('should render refresh icon in retry button', () => {
      render(<DataState mode="error" onRetry={vi.fn()} />);

      expect(screen.getByText('refresh')).toBeInTheDocument();
    });

    it('should have proper styling for error icon', () => {
      const { container } = render(<DataState mode="error" />);

      const errorIcon = container.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes in loading state', () => {
      const { container } = render(<DataState mode="loading" />);

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-700');
    });

    it('should have dark mode classes in empty state', () => {
      const { container } = render(<DataState mode="empty" />);

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:text-gray-500');
      expect(htmlContent).toContain('dark:text-gray-400');
    });

    it('should have dark mode classes in error state', () => {
      const { container } = render(<DataState mode="error" />);

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:text-gray-100');
      expect(htmlContent).toContain('dark:text-gray-400');
      expect(htmlContent).toContain('dark:text-red-400');
    });
  });

  describe('edge cases', () => {
    it('should handle Error object without message', () => {
      const error = new Error();
      render(<DataState mode="error" error={error} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('should render null for invalid mode', () => {
      const { container } = render(<DataState mode={'invalid' as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle empty children in success mode', () => {
      const { container } = render(<DataState mode="success" />);

      // Should render fragment with no children
      expect(container.textContent).toBe('');
    });

    it('should handle very long error messages', () => {
      const longError = 'A'.repeat(200);
      render(<DataState mode="error" error={longError} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle very long empty messages', () => {
      const longMessage = 'B'.repeat(150);
      render(<DataState mode="empty" emptyMessage={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible button for empty action', () => {
      render(
        <DataState
          mode="empty"
          emptyAction={{
            label: 'Add Item',
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible button for retry', () => {
      render(<DataState mode="error" onRetry={vi.fn()} />);

      const button = screen.getByRole('button', { name: /retry/i });
      expect(button).toBeInTheDocument();
    });

    it('should use semantic HTML for error state', () => {
      render(<DataState mode="error" error="Test error" />);

      // Error title should be in h3
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Error');
    });
  });

  describe('interaction states', () => {
    it('should show hover state on empty action button', () => {
      render(
        <DataState
          mode="empty"
          emptyAction={{
            label: 'Create',
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-blue-700');
    });

    it('should show hover state on retry button', () => {
      render(<DataState mode="error" onRetry={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-blue-700');
    });

    it('should maintain button functionality after multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <DataState
          mode="empty"
          emptyAction={{
            label: 'Click Me',
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});
