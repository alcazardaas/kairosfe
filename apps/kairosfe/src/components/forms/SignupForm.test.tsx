import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupForm from './SignupForm';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';

// Mock dependencies
vi.mock('@/lib/store', () => ({
  useAuthStore: vi.fn(() => ({
    setTokens: vi.fn(),
  })),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    signup: vi.fn(),
  },
}));

vi.mock('@/lib/auth/authCookie', () => ({
  setAuthCookie: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock window.location.href
const mockLocationHref = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('SignupForm', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders all form fields', () => {
    render(<SignupForm />);

    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auth.signupButton/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('shows error for password less than 8 characters', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    await user.type(passwordInput, 'short');

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter your password');

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows error when terms are not accepted', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    // Fill all fields except terms
    await user.type(screen.getByPlaceholderText('John'), 'John');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    await user.type(screen.getByPlaceholderText('Acme Corporation'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@acme.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // Find and click the visibility toggle button
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    const passwordToggle = toggleButtons[0]; // First toggle is for password
    await user.click(passwordToggle);

    expect(passwordInput.type).toBe('text');
  });

  it('successfully submits valid form', async () => {
    const user = userEvent.setup();
    const mockSetTokens = vi.fn();
    const mockSignupResponse = {
      data: {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: '2025-12-13T00:00:00.000Z',
        user: {
          id: 'user-123',
          email: 'john@acme.com',
          name: 'John Doe',
        },
        tenant: {
          id: 'tenant-123',
          name: 'Acme Corp',
          slug: 'acme-corp',
        },
        membership: {
          role: 'admin' as const,
          status: 'active' as const,
        },
      },
    };

    (useAuthStore as any).mockReturnValue({
      setTokens: mockSetTokens,
    });

    (apiClient.signup as any).mockResolvedValue(mockSignupResponse);

    render(<SignupForm />);

    // Fill all fields
    await user.type(screen.getByPlaceholderText('John'), 'John');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    await user.type(screen.getByPlaceholderText('Acme Corporation'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@acme.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.signup).toHaveBeenCalledWith({
        email: 'john@acme.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Acme Corp',
        timezone: expect.any(String),
        acceptedTerms: true,
      });
      expect(mockSetTokens).toHaveBeenCalledWith('test-token', 'test-refresh-token');
    });
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    const mockError = {
      statusCode: 400,
      message: 'Validation failed',
    };

    (apiClient.signup as any).mockRejectedValue(mockError);

    render(<SignupForm />);

    // Fill all fields
    await user.type(screen.getByPlaceholderText('John'), 'John');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    await user.type(screen.getByPlaceholderText('Acme Corporation'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@acme.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });
  });

  it('displays specific error message for duplicate email (409)', async () => {
    const user = userEvent.setup();
    const mockError = {
      statusCode: 409,
      message: 'Email already exists',
    };

    (apiClient.signup as any).mockRejectedValue(mockError);

    render(<SignupForm />);

    // Fill all fields
    await user.type(screen.getByPlaceholderText('John'), 'John');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    await user.type(screen.getByPlaceholderText('Acme Corporation'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'existing@acme.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/auth.emailTaken/i)).toBeInTheDocument();
    });
  });

  it('handles rate limit error (429)', async () => {
    const user = userEvent.setup();
    const mockError = {
      statusCode: 429,
      message: 'Rate limit exceeded',
    };

    (apiClient.signup as any).mockRejectedValue(mockError);

    render(<SignupForm />);

    // Fill all fields
    await user.type(screen.getByPlaceholderText('John'), 'John');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    await user.type(screen.getByPlaceholderText('Acme Corporation'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@acme.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/auth.rateLimitExceeded/i)).toBeInTheDocument();
    });
  });

  it('trims whitespace from text inputs', async () => {
    const user = userEvent.setup();
    const mockSetTokens = vi.fn();
    const mockSignupResponse = {
      data: {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: '2025-12-13T00:00:00.000Z',
        user: {
          id: 'user-123',
          email: 'john@acme.com',
          name: 'John Doe',
        },
        tenant: {
          id: 'tenant-123',
          name: 'Acme Corp',
          slug: 'acme-corp',
        },
        membership: {
          role: 'admin' as const,
          status: 'active' as const,
        },
      },
    };

    (useAuthStore as any).mockReturnValue({
      setTokens: mockSetTokens,
    });

    (apiClient.signup as any).mockResolvedValue(mockSignupResponse);

    render(<SignupForm />);

    // Fill fields with extra whitespace
    await user.type(screen.getByPlaceholderText('John'), '  John  ');
    await user.type(screen.getByPlaceholderText('Doe'), '  Doe  ');
    await user.type(screen.getByPlaceholderText('Acme Corporation'), '  Acme Corp  ');
    await user.type(screen.getByPlaceholderText('you@example.com'), '  JOHN@ACME.COM  ');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.signup).toHaveBeenCalledWith({
        email: 'john@acme.com', // Should be trimmed and lowercased
        password: 'password123',
        firstName: 'John', // Should be trimmed
        lastName: 'Doe', // Should be trimmed
        companyName: 'Acme Corp', // Should be trimmed
        timezone: expect.any(String),
        acceptedTerms: true,
      });
    });
  });

  it('validates maximum field lengths', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const longString101 = 'a'.repeat(101);
    const longString201 = 'a'.repeat(201);

    await user.type(screen.getByPlaceholderText('John'), longString101);
    await user.type(screen.getByPlaceholderText('Doe'), longString101);
    await user.type(screen.getByPlaceholderText('Acme Corporation'), longString201);

    const submitButton = screen.getByRole('button', { name: /auth.signupButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is too long')).toBeInTheDocument();
      expect(screen.getByText('Last name is too long')).toBeInTheDocument();
      expect(screen.getByText('Company name is too long')).toBeInTheDocument();
    });
  });
});
