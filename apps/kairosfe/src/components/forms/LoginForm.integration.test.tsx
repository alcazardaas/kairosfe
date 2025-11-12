import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/lib/test/mocks/server';
import { useAuthStore } from '@/lib/store';
import { trackLogin } from '@/lib/analytics/posthog';
import LoginForm from './LoginForm';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock analytics
vi.mock('@/lib/analytics/posthog', () => ({
  trackLogin: vi.fn(),
}));

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

describe('LoginForm Integration', () => {
  beforeEach(() => {
    // Reset store
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });

    // Reset window.location
    window.location.href = '';

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should complete full login workflow: form → API → analytics → redirect', async () => {
    const user = userEvent.setup();

    // Mock successful login and hydrate
    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', async ({ request }) => {
        const body = (await request.json()) as any;

        if (body.email === 'test@test.com' && body.password === 'password123') {
          return HttpResponse.json({
            token: 'test-token',
            refreshToken: 'test-refresh',
            expiresIn: 3600,
            user: {
              id: '1',
              email: 'test@test.com',
              name: 'Test User',
              role: 'employee',
            },
          });
        }
        return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }),
      http.get('http://localhost:8080/api/v1/auth/me', () => {
        return HttpResponse.json({
          data: {
            user: { id: '1', email: 'test@test.com', name: 'Test User' },
            membership: { role: 'employee' },
            tenant: { id: 'tenant-1', name: 'Test Company' },
          },
        });
      })
    );

    render(<LoginForm />);

    // User interaction: fill and submit form
    await user.type(screen.getByPlaceholderText('demo@kairos.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('demo123'), 'password123');
    await user.click(screen.getByRole('button'));

    // Verify integration: API called → analytics tracked → redirect happens
    await waitFor(
      () => {
        expect(trackLogin).toHaveBeenCalledWith(true);
      },
      { timeout: 3000 }
    );

    expect(window.location.href).toBe('/dashboard');
  });

  it('should handle error workflow: form → API error → display error → track failure', async () => {
    const user = userEvent.setup();

    // Mock 401 error
    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', () => {
        return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      })
    );

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('demo@kairos.com'), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText('demo123'), 'wrongpass');
    await user.click(screen.getByRole('button'));

    // Verify integration: error displayed and tracked, no redirect
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });

    expect(trackLogin).toHaveBeenCalledWith(false);
    expect(window.location.href).toBe('');
  });
});
