/**
 * Comprehensive tests for Toast Utilities
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-hot-toast BEFORE importing anything that uses it
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'loading-toast-id'),
    dismiss: vi.fn(),
  }),
}));

import toast from 'react-hot-toast';
import { showToast } from './toast';

describe('toast utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showToast.success', () => {
    it('should call toast.success with message and default duration', () => {
      showToast.success('Operation successful');

      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 3000,
        position: 'top-right',
        style: expect.objectContaining({
          background: 'var(--toast-success-bg, #10b981)',
          color: 'var(--toast-success-color, #ffffff)',
          padding: '16px',
          borderRadius: '8px',
        }),
        iconTheme: {
          primary: '#ffffff',
          secondary: '#10b981',
        },
      });
    });

    it('should call toast.success with custom duration', () => {
      showToast.success('Saved!', 5000);

      expect(toast.success).toHaveBeenCalledWith(
        'Saved!',
        expect.objectContaining({
          duration: 5000,
        })
      );
    });

    it('should use consistent styling', () => {
      showToast.success('Test message');

      const callArgs = toast.success.mock.calls[0][1];
      expect(callArgs?.style).toMatchObject({
        padding: '16px',
        borderRadius: '8px',
      });
    });
  });

  describe('showToast.error', () => {
    it('should call toast.error with message and default duration', () => {
      showToast.error('Something went wrong');

      expect(toast.error).toHaveBeenCalledWith('Something went wrong', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: 'var(--toast-error-bg, #ef4444)',
          color: 'var(--toast-error-color, #ffffff)',
          padding: '16px',
          borderRadius: '8px',
        }),
        iconTheme: {
          primary: '#ffffff',
          secondary: '#ef4444',
        },
      });
    });

    it('should call toast.error with custom duration', () => {
      showToast.error('Error!', 6000);

      expect(toast.error).toHaveBeenCalledWith(
        'Error!',
        expect.objectContaining({
          duration: 6000,
        })
      );
    });

    it('should have longer default duration than success (4s vs 3s)', () => {
      showToast.error('Error');

      const errorCall = toast.error.mock.calls[0][1];
      expect(errorCall?.duration).toBe(4000);
    });
  });

  describe('showToast.info', () => {
    it('should call toast with info icon and default duration', () => {
      showToast.info('Information message');

      expect(toast).toHaveBeenCalledWith('Information message', {
        duration: 3000,
        position: 'top-right',
        icon: 'ℹ️',
        style: expect.objectContaining({
          background: 'var(--toast-info-bg, #3b82f6)',
          color: 'var(--toast-info-color, #ffffff)',
          padding: '16px',
          borderRadius: '8px',
        }),
      });
    });

    it('should call toast with custom duration', () => {
showToast.info('Info', 2000);

      expect(toast).toHaveBeenCalledWith(
        'Info',
        expect.objectContaining({
          duration: 2000,
        })
      );
    });

    it('should use info emoji icon', () => {
showToast.info('Test');

      const callArgs = toast.mock.calls[0][1];
      expect(callArgs.icon).toBe('ℹ️');
    });
  });

  describe('showToast.warning', () => {
    it('should call toast with warning icon and default duration', () => {
showToast.warning('Warning message');

      expect(toast).toHaveBeenCalledWith('Warning message', {
        duration: 3500,
        position: 'top-right',
        icon: '⚠️',
        style: expect.objectContaining({
          background: 'var(--toast-warning-bg, #f59e0b)',
          color: 'var(--toast-warning-color, #ffffff)',
          padding: '16px',
          borderRadius: '8px',
        }),
      });
    });

    it('should call toast with custom duration', () => {
showToast.warning('Caution', 4000);

      expect(toast).toHaveBeenCalledWith(
        'Caution',
        expect.objectContaining({
          duration: 4000,
        })
      );
    });

    it('should use warning emoji icon', () => {
showToast.warning('Test');

      const callArgs = toast.mock.calls[0][1];
      expect(callArgs.icon).toBe('⚠️');
    });
  });

  describe('showToast.loading', () => {
    it('should call toast.loading with message', () => {
      showToast.loading('Loading...');

      expect(toast.loading).toHaveBeenCalledWith('Loading...', {
        position: 'top-right',
        style: expect.objectContaining({
          background: 'var(--toast-loading-bg, #6b7280)',
          color: 'var(--toast-loading-color, #ffffff)',
          padding: '16px',
          borderRadius: '8px',
        }),
      });
    });

    it('should return toast ID for dismissal', () => {
      const result = showToast.loading('Processing...');

      expect(result).toBe('loading-toast-id');
    });

    it('should not have duration (loading toasts persist)', () => {
      showToast.loading('Loading');

      const callArgs = toast.loading.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('duration');
    });
  });

  describe('showToast.dismiss', () => {
    it('should call toast.dismiss without ID to dismiss all', () => {
      showToast.dismiss();

      expect(toast.dismiss).toHaveBeenCalledWith(undefined);
    });

    it('should call toast.dismiss with specific ID', () => {
      showToast.dismiss('toast-123');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });
  });

  describe('showToast.dismissAll', () => {
    it('should call toast.dismiss without arguments', () => {
      showToast.dismissAll();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('toast styling consistency', () => {
    it('all toast types should have consistent padding', () => {
showToast.success('Test');
      showToast.error('Test');
      showToast.info('Test');
      showToast.warning('Test');
      showToast.loading('Test');

      // Check success
      const successCall = toast.success.mock.calls[0][1];
      expect(successCall?.style?.padding).toBe('16px');

      // Check error
      const errorCall = toast.error.mock.calls[0][1];
      expect(errorCall?.style?.padding).toBe('16px');

      // Check info
      const infoCall = toast.mock.calls[0][1];
      expect(infoCall.style.padding).toBe('16px');

      // Check warning
      const warningCall = toast.mock.calls[1][1];
      expect(warningCall.style.padding).toBe('16px');

      // Check loading
      const loadingCall = toast.loading.mock.calls[0][1];
      expect(loadingCall?.style?.padding).toBe('16px');
    });

    it('all toast types should have consistent border radius', () => {
showToast.success('Test');
      showToast.error('Test');
      showToast.info('Test');
      showToast.warning('Test');
      showToast.loading('Test');

      const allCalls = [
        toast.success.mock.calls[0][1],
        toast.error.mock.calls[0][1],
        toast.mock.calls[0][1],
        toast.mock.calls[1][1],
        toast.loading.mock.calls[0][1],
      ];

      allCalls.forEach((call) => {
        expect(call?.style?.borderRadius).toBe('8px');
      });
    });

    it('all toast types should use top-right position', () => {
showToast.success('Test');
      showToast.error('Test');
      showToast.info('Test');
      showToast.warning('Test');
      showToast.loading('Test');

      const allCalls = [
        toast.success.mock.calls[0][1],
        toast.error.mock.calls[0][1],
        toast.mock.calls[0][1],
        toast.mock.calls[1][1],
        toast.loading.mock.calls[0][1],
      ];

      allCalls.forEach((call) => {
        expect(call?.position).toBe('top-right');
      });
    });
  });
});
