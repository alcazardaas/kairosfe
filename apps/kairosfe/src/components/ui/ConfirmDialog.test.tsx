/**
 * Tests for ConfirmDialog Component
 * Comprehensive coverage of dialog variants and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnInputChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={false}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('basic functionality', () => {
    it('should display title and message', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Item"
          message="Are you sure you want to delete this item?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('should render default button texts', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render custom button texts', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          confirmText="Yes, Delete"
          cancelText="No, Keep"
        />
      );

      expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('variants', () => {
    it('should render info variant by default', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Info"
          message="Info message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should render info variant when explicitly specified', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Info"
          message="Info message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          variant="info"
        />
      );

      expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should render warning variant', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Warning"
          message="Warning message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          variant="warning"
        />
      );

      expect(screen.getByText('warning')).toBeInTheDocument();
    });

    it('should render danger variant', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Danger"
          message="Danger message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          variant="danger"
        />
      );

      expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('should apply correct color classes for info variant', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Info"
          message="Info message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          variant="info"
        />
      );

      const iconElement = container.querySelector('.text-blue-600');
      expect(iconElement).toBeInTheDocument();
    });

    it('should apply correct color classes for warning variant', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Warning"
          message="Warning message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          variant="warning"
        />
      );

      const iconElement = container.querySelector('.text-yellow-600');
      expect(iconElement).toBeInTheDocument();
    });

    it('should apply correct color classes for danger variant', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Danger"
          message="Danger message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          variant="danger"
        />
      );

      const iconElement = container.querySelector('.text-red-600');
      expect(iconElement).toBeInTheDocument();
    });
  });

  describe('optional input', () => {
    it('should not render input by default', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should render input when showInput is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          onInputChange={mockOnInputChange}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render input label when provided', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          inputLabel="Reason"
          onInputChange={mockOnInputChange}
        />
      );

      expect(screen.getByText('Reason')).toBeInTheDocument();
    });

    it('should render input placeholder', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          inputPlaceholder="Enter reason..."
          onInputChange={mockOnInputChange}
        />
      );

      expect(screen.getByPlaceholderText('Enter reason...')).toBeInTheDocument();
    });

    it('should display input value', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          inputValue="Test value"
          onInputChange={mockOnInputChange}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('Test value');
    });

    it('should call onInputChange when typing in input', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          onInputChange={mockOnInputChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New text');

      expect(mockOnInputChange).toHaveBeenCalled();
    });

    it('should handle textarea with 3 rows', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          onInputChange={mockOnInputChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '3');
    });
  });

  describe('styling and layout', () => {
    it('should have modal overlay', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should have proper z-index', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should have header with border', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('should have footer with border', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
    });

    it('should center dialog content', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const overlay = container.querySelector('.flex.items-center.justify-center');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes for main container', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:bg-gray-800');
    });

    it('should have dark mode classes for text', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:text-gray-100');
    });

    it('should have dark mode classes for borders', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain('dark:border-gray-700');
    });

    it('should have dark mode classes for input when shown', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          onInputChange={mockOnInputChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('dark:bg-gray-700');
    });
  });

  describe('accessibility', () => {
    it('should have accessible buttons', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have accessible textarea when input is shown', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
          onInputChange={mockOnInputChange}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty title', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title=""
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading')).toHaveTextContent('');
    });

    it('should handle empty message', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message=""
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message=""
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle multiple button clicks', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });

    it('should handle input without onInputChange', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          showInput={true}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);

      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message={longMessage}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
