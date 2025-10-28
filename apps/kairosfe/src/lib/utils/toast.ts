import toast from 'react-hot-toast';

/**
 * Toast notification utility
 * Wrapper around react-hot-toast for consistent styling and behavior
 */

export const showToast = {
  /**
   * Show success toast
   */
  success: (message: string, duration = 3000) => {
    toast.success(message, {
      duration,
      position: 'top-right',
      style: {
        background: 'var(--toast-success-bg, #10b981)',
        color: 'var(--toast-success-color, #ffffff)',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10b981',
      },
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, duration = 4000) => {
    toast.error(message, {
      duration,
      position: 'top-right',
      style: {
        background: 'var(--toast-error-bg, #ef4444)',
        color: 'var(--toast-error-color, #ffffff)',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#ef4444',
      },
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, duration = 3000) => {
    toast(message, {
      duration,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: 'var(--toast-info-bg, #3b82f6)',
        color: 'var(--toast-info-color, #ffffff)',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, duration = 3500) => {
    toast(message, {
      duration,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: 'var(--toast-warning-bg, #f59e0b)',
        color: 'var(--toast-warning-color, #ffffff)',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: 'var(--toast-loading-bg, #6b7280)',
        color: 'var(--toast-loading-color, #ffffff)',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// Re-export the Toaster component for use in layouts
export { Toaster } from 'react-hot-toast';
