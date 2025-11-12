/**
 * Tests for ToastProvider Component
 * Coverage of toast notification provider configuration
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ToastProvider from './ToastProvider';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  Toaster: vi.fn(({ position, reverseOrder, gutter, toastOptions }) => (
    <div
      data-testid="toaster"
      data-position={position}
      data-reverse-order={reverseOrder}
      data-gutter={gutter}
      data-toast-options={JSON.stringify(toastOptions)}
    />
  )),
}));

describe('ToastProvider', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ToastProvider />);
      expect(container).toBeInTheDocument();
    });

    it('should render Toaster component', () => {
      const { getByTestId } = render(<ToastProvider />);
      expect(getByTestId('toaster')).toBeInTheDocument();
    });
  });

  describe('configuration', () => {
    it('should configure position as top-right', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      expect(toaster.getAttribute('data-position')).toBe('top-right');
    });

    it('should configure reverseOrder as false', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      expect(toaster.getAttribute('data-reverse-order')).toBe('false');
    });

    it('should configure gutter as 8', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      expect(toaster.getAttribute('data-gutter')).toBe('8');
    });

    it('should configure default toast duration', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.duration).toBe(3000);
    });

    it('should configure success toast duration', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.success.duration).toBe(3000);
    });

    it('should configure error toast duration', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.error.duration).toBe(4000);
    });

    it('should configure loading toast duration as Infinity', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.loading.duration).toBe(null); // Infinity serializes to null in JSON
    });
  });

  describe('styling', () => {
    it('should configure toast background with CSS variable', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.style.background).toBe('var(--toast-bg, #363636)');
    });

    it('should configure toast color with CSS variable', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.style.color).toBe('var(--toast-color, #fff)');
    });

    it('should configure toast padding', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.style.padding).toBe('16px');
    });

    it('should configure toast border radius', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.style.borderRadius).toBe('8px');
    });

    it('should configure toast font size', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.style.fontSize).toBe('14px');
    });

    it('should configure toast max width', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.style.maxWidth).toBe('500px');
    });
  });

  describe('icon themes', () => {
    it('should configure success icon theme with green primary', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.success.iconTheme.primary).toBe('#10b981');
    });

    it('should configure success icon theme with white secondary', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.success.iconTheme.secondary).toBe('#ffffff');
    });

    it('should configure error icon theme with red primary', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.error.iconTheme.primary).toBe('#ef4444');
    });

    it('should configure error icon theme with white secondary', () => {
      const { getByTestId } = render(<ToastProvider />);
      const toaster = getByTestId('toaster');
      const options = JSON.parse(toaster.getAttribute('data-toast-options') || '{}');
      expect(options.error.iconTheme.secondary).toBe('#ffffff');
    });
  });

  describe('multiple instances', () => {
    it('should render multiple ToastProviders independently', () => {
      const { getAllByTestId } = render(
        <>
          <ToastProvider />
          <ToastProvider />
        </>
      );

      const toasters = getAllByTestId('toaster');
      expect(toasters).toHaveLength(2);
    });
  });
});
