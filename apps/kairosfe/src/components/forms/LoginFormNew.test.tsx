/**
 * Comprehensive tests for LoginFormNew Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginFormNew from './LoginFormNew';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import * as authCookie from '@/lib/auth/authCookie';

// Mock dependencies
vi.mock('@/lib/store');
vi.mock('@/lib/api/client');
vi.mock('@/lib/auth/authCookie');

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

describe('LoginFormNew', () => {
  let mockSetTokens: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetTokens = vi.fn();
    vi.mocked(useAuthStore).mockReturnValue(mockSetTokens as any);
    vi.mocked(authCookie.setAuthCookie).mockReturnValue(undefined);
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render login form with email and password fields', () => {
      render(<LoginFormNew />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render email label', () => {
      render(<LoginFormNew />);

      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should render password label', () => {
      render(<LoginFormNew />);

      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should render remember me checkbox', () => {
      render(<LoginFormNew />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText('Remember me')).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginFormNew />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '#');
    });

    it('should not display error message initially', () => {
      render(<LoginFormNew />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('password visibility toggle', () => {
    it('should render password as hidden by default', () => {
      render(<LoginFormNew />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility when eye icon clicked', async () => {
      const user = userEvent.setup();
      render(<LoginFormNew />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const buttons = screen.getAllByRole('button');
      // First button is the password toggle, second is submit
      const toggleButton = buttons.find((btn) => btn.getAttribute('type') === 'button');

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton!);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton!);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should show visibility_off icon when password is hidden', () => {
      render(<LoginFormNew />);

      expect(screen.getByText('visibility_off')).toBeInTheDocument();
    });

    it('should show visibility icon when password is visible', async () => {
      const user = userEvent.setup();
      render(<LoginFormNew />);

      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((btn) => btn.getAttribute('type') === 'button');
      await user.click(toggleButton!);

      expect(screen.getByText('visibility')).toBeInTheDocument();
    });
  });

  describe('remember me functionality', () => {
    it('should be unchecked by default', () => {
      render(<LoginFormNew />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle when clicked', async () => {
      const user = userEvent.setup();
      render(<LoginFormNew />);

      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('form submission', () => {
    it('should call apiClient.login with email and password', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      };

      vi.mocked(apiClient.login).mockResolvedValue(mockResponse as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(apiClient.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should set tokens in auth store on successful login', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      };

      vi.mocked(apiClient.login).mockResolvedValue(mockResponse as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSetTokens).toHaveBeenCalledWith('test-token', 'test-refresh');
      });
    });

    it('should set auth cookie on successful login', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      };

      vi.mocked(apiClient.login).mockResolvedValue(mockResponse as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authCookie.setAuthCookie).toHaveBeenCalledWith('test-token');
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      };

      vi.mocked(apiClient.login).mockResolvedValue(mockResponse as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });

    it('should disable form fields while submitting', async () => {
      const user = userEvent.setup();
      let resolveLogin: any;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      vi.mocked(apiClient.login).mockReturnValue(loginPromise as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check that fields are disabled during submission
      await waitFor(() => {
        expect(screen.getByPlaceholderText('you@example.com')).toBeDisabled();
        expect(screen.getByPlaceholderText('Enter your password')).toBeDisabled();
      });

      // Resolve the promise
      resolveLogin({
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      });
    });

    it('should show loading state on submit button while submitting', async () => {
      const user = userEvent.setup();
      let resolveLogin: any;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      vi.mocked(apiClient.login).mockReturnValue(loginPromise as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check that button shows loading text
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveLogin({
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      });
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      let resolveLogin: any;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      vi.mocked(apiClient.login).mockReturnValue(loginPromise as any);

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check that button is disabled
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveLogin({
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      });
    });
  });

  describe('error handling', () => {
    it('should display error message on login failure', async () => {
      const user = userEvent.setup();

      vi.mocked(apiClient.login).mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should display generic error message for non-Error failures', async () => {
      const user = userEvent.setup();

      vi.mocked(apiClient.login).mockRejectedValue('Unknown error');

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Login failed. Please check your credentials.')
        ).toBeInTheDocument();
      });
    });

    it('should clear previous error on new submission', async () => {
      const user = userEvent.setup();

      // First submission fails
      vi.mocked(apiClient.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Second submission should clear error initially
      vi.mocked(apiClient.login).mockResolvedValueOnce({
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' },
          tenant: { id: 'tenant-1' },
        },
      } as any);

      await user.clear(screen.getByPlaceholderText('you@example.com'));
      await user.clear(screen.getByPlaceholderText('Enter your password'));
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should be cleared before new submission completes
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();

      vi.mocked(apiClient.login).mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginFormNew />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Fields should be enabled again
      expect(screen.getByPlaceholderText('you@example.com')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('Enter your password')).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    });
  });

  describe('required fields validation', () => {
    it('should have required attribute on email field', () => {
      render(<LoginFormNew />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeRequired();
    });

    it('should have required attribute on password field', () => {
      render(<LoginFormNew />);

      expect(screen.getByPlaceholderText('Enter your password')).toBeRequired();
    });

    it('should have email type on email field', () => {
      render(<LoginFormNew />);

      expect(screen.getByPlaceholderText('you@example.com')).toHaveAttribute('type', 'email');
    });
  });
});
