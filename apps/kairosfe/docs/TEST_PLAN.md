# Kairos Frontend - Comprehensive Test Plan

**Version**: 1.0
**Last Updated**: 2025-01-11
**Target Coverage**: 95-100%
**Status**: 📋 Planning Phase

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Strategy](#testing-strategy)
3. [Test Types & Scope](#test-types--scope)
4. [Coverage Targets](#coverage-targets)
5. [Testing Tools & Configuration](#testing-tools--configuration)
6. [File Organization](#file-organization)
7. [Testing Patterns](#testing-patterns)
8. [Mocking Strategies](#mocking-strategies)
9. [CI/CD Integration](#cicd-integration)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Best Practices](#best-practices)

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring

2. **Test User Interactions**
   - Test from the user's perspective
   - Use Testing Library's guiding principle: "The more your tests resemble the way your software is used, the more confidence they can give you"

3. **Write Tests That Give Confidence**
   - Prioritize tests that catch real bugs
   - Avoid tests that only test implementation details

4. **Maintainable Tests**
   - Tests should be easy to read and understand
   - Avoid test duplication
   - Use helper functions and fixtures

5. **Fast Feedback Loop**
   - Unit tests should run in milliseconds
   - Integration tests in seconds
   - E2E tests in minutes

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /    \     - Critical user journeys
     /------\    - Cross-page workflows
    /        \
   /  INTE-   \  Integration Tests (25%)
  /   GRATION  \ - Component + API interactions
 /     TESTS    \- Store + Component integration
/--------------\
|              | Unit Tests (70%)
|     UNIT     | - Pure functions
|    TESTS     | - Components in isolation
|              | - Services & utilities
|______________|
```

### Coverage Distribution

- **70% Unit Tests**: Fast, isolated, testing individual units
- **25% Integration Tests**: Component interactions, store integration, API flows
- **5% E2E Tests**: Critical paths, complete user workflows

---

## Test Types & Scope

### 1. Unit Tests (Target: 95%+ coverage)

**What to Test:**
- ✅ React components (isolated)
- ✅ Custom hooks
- ✅ Utility functions
- ✅ Store actions and selectors
- ✅ Validation schemas (Zod)
- ✅ API service functions
- ✅ Type guards and transformers
- ✅ Helper functions

**What NOT to Test:**
- ❌ Third-party libraries
- ❌ Type definitions (TypeScript handles this)
- ❌ Simple pass-through components
- ❌ Configuration files

### 2. Integration Tests (Target: 90%+ coverage of integration points)

**What to Test:**
- ✅ Components + API interactions
- ✅ Store + Components integration
- ✅ Form submission workflows
- ✅ Authentication flows
- ✅ Multi-component interactions
- ✅ Route navigation
- ✅ i18n integration

### 3. E2E Tests (Target: 100% of critical paths)

**Critical Paths:**
- ✅ Login and authentication
- ✅ Timesheet submission workflow
- ✅ Leave request creation and approval
- ✅ Manager approval queues
- ✅ Admin operations (users, projects, etc.)

---

## Coverage Targets

### Overall Project Target: 95-100%

| Category | Target | Priority |
|----------|--------|----------|
| **Statements** | 95% | HIGH |
| **Branches** | 90% | HIGH |
| **Functions** | 95% | HIGH |
| **Lines** | 95% | HIGH |

### Per-Module Targets

| Module | Target | Current | Priority |
|--------|--------|---------|----------|
| `src/lib/store/` | 100% | ~40% | 🔴 CRITICAL |
| `src/lib/api/` | 95% | 0% | 🔴 CRITICAL |
| `src/lib/utils/` | 100% | 0% | 🔴 CRITICAL |
| `src/lib/auth/` | 100% | 0% | 🔴 CRITICAL |
| `src/components/forms/` | 95% | 0% | 🟠 HIGH |
| `src/components/data/` | 90% | 0% | 🟠 HIGH |
| `src/components/ui/` | 85% | 0% | 🟡 MEDIUM |
| `src/components/layout/` | 80% | 0% | 🟡 MEDIUM |
| `src/lib/i18n/` | 90% | 0% | 🟡 MEDIUM |
| `src/lib/analytics/` | 85% | 0% | 🟢 LOW |

### Minimum Thresholds (Enforce in CI)

```json
{
  "branches": 85,
  "functions": 90,
  "lines": 90,
  "statements": 90
}
```

---

## Testing Tools & Configuration

### Core Stack

1. **Vitest** (v2.1.3)
   - Fast, modern test runner
   - Native ESM support
   - Compatible with Vite configuration
   - Watch mode for development

2. **Testing Library** (React)
   - `@testing-library/react` (v16.0.1)
   - `@testing-library/jest-dom` (v6.6.3)
   - User-centric testing utilities

3. **Playwright** (v1.48.2)
   - Cross-browser E2E testing
   - Visual regression testing capability
   - Network interception

4. **Additional Tools**
   - `@vitest/ui` - Visual test runner
   - `@vitest/coverage-v8` - Coverage reporting (needs to be added)
   - `msw` (Mock Service Worker) - API mocking (needs to be added)

### Configuration Updates Needed

#### 1. Add Coverage Dependencies

```bash
pnpm add -D @vitest/coverage-v8
```

#### 2. Update vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/lib/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/lib/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@kairos/ui': resolve(__dirname, '../../packages/ui/src'),
      '@kairos/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
```

#### 3. Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test:coverage && pnpm test:e2e"
  }
}
```

---

## File Organization

### Directory Structure

```
apps/kairosfe/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LoginForm.test.tsx          ← Co-located test
│   │   ├── data/
│   │   │   ├── DashboardContent.tsx
│   │   │   └── DashboardContent.test.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Button.test.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── services/
│   │   │   │   ├── auth.ts
│   │   │   │   └── auth.test.ts            ← Co-located test
│   │   │   ├── client.ts
│   │   │   └── client.test.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── authStore.test.ts
│   │   │   ├── index.ts
│   │   │   └── index.test.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   └── date.test.ts
│   │   └── test/
│   │       ├── setup.ts                     ← Global setup
│   │       ├── helpers.tsx                  ← Test utilities
│   │       ├── mocks/                       ← Mock data
│   │       │   ├── handlers.ts              ← MSW handlers
│   │       │   ├── data.ts                  ← Mock fixtures
│   │       │   └── server.ts                ← MSW server
│   │       └── store.test.ts                ← Existing test
│   └── pages/
│       └── (tests in components that pages use)
├── tests/
│   ├── e2e/
│   │   ├── login.spec.ts                    ← Existing E2E test
│   │   ├── timesheet-workflow.spec.ts
│   │   ├── leave-request-workflow.spec.ts
│   │   └── admin-workflow.spec.ts
│   └── fixtures/
│       └── users.json                        ← Playwright fixtures
└── vitest.config.ts
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Unit Test | `*.test.{ts,tsx}` | `LoginForm.test.tsx` |
| Integration Test | `*.integration.test.{ts,tsx}` | `auth.integration.test.ts` |
| E2E Test | `*.spec.ts` | `login.spec.ts` |
| Test Helpers | `helpers.{ts,tsx}` | `test/helpers.tsx` |
| Mock Data | `*.mock.ts` | `users.mock.ts` |
| Fixtures | `*.fixture.ts` | `user.fixture.ts` |

---

## Testing Patterns

### 1. Testing React Components

#### Basic Component Test

```typescript
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
```

#### Component with Store

```typescript
// src/components/auth/AuthGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/lib/store';
import AuthGuard from './AuthGuard';

describe('AuthGuard', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' },
      token: 'token',
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders login message when not authenticated', () => {
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
});
```

#### Form Component with React Hook Form

```typescript
// src/components/forms/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
```

### 2. Testing Zustand Stores

```typescript
// src/lib/store/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  describe('login', () => {
    it('sets user and authentication state', () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' as const };
      const mockToken = 'test-token';

      useAuthStore.getState().login(mockUser, mockToken, 'refresh-token', 3600);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
    });
  });

  describe('logout', () => {
    it('clears user and authentication state', () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' as const };

      useAuthStore.getState().login(mockUser, 'token', 'refresh', 3600);
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('updates user information', () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' as const };

      useAuthStore.getState().login(mockUser, 'token', 'refresh', 3600);
      useAuthStore.getState().updateUser({ ...mockUser, name: 'Updated Name' });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated Name');
    });
  });
});
```

### 3. Testing API Services

```typescript
// src/lib/api/services/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, refreshToken } from './auth';
import { apiClient } from '../client';

vi.mock('../client');

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('sends credentials and returns user data', async () => {
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
        user: { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await login('test@test.com', 'password');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on invalid credentials', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Invalid credentials'));

      await expect(login('wrong@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('sends refresh token and returns new access token', async () => {
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await refreshToken('old-refresh-token');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
```

### 4. Testing Utility Functions

```typescript
// src/lib/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, parseDate, addDays, getWeekStart, getWeekDates } from './date';

describe('date utils', () => {
  describe('formatDate', () => {
    it('formats date to ISO string', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('2025-01-15');
    });

    it('handles different date formats', () => {
      expect(formatDate('2025-01-15')).toBe('2025-01-15');
      expect(formatDate(new Date('2025-01-15T10:30:00Z'))).toBe('2025-01-15');
    });
  });

  describe('getWeekStart', () => {
    it('returns Monday of the week', () => {
      const wednesday = new Date('2025-01-15'); // Wednesday
      const monday = getWeekStart(wednesday);
      expect(formatDate(monday)).toBe('2025-01-13'); // Monday
    });

    it('handles Sunday correctly', () => {
      const sunday = new Date('2025-01-19');
      const monday = getWeekStart(sunday);
      expect(formatDate(monday)).toBe('2025-01-13');
    });
  });

  describe('getWeekDates', () => {
    it('returns array of 7 dates starting from Monday', () => {
      const monday = new Date('2025-01-13');
      const dates = getWeekDates(monday);

      expect(dates).toHaveLength(7);
      expect(formatDate(dates[0])).toBe('2025-01-13'); // Monday
      expect(formatDate(dates[6])).toBe('2025-01-19'); // Sunday
    });
  });

  describe('addDays', () => {
    it('adds days to date', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, 5);
      expect(formatDate(result)).toBe('2025-01-20');
    });

    it('subtracts days with negative number', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, -5);
      expect(formatDate(result)).toBe('2025-01-10');
    });
  });
});
```

### 5. Testing Custom Hooks

```typescript
// src/lib/hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store';

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('returns authentication state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('updates when auth state changes', async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      useAuthStore.getState().login(
        { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' },
        'token',
        'refresh',
        3600
      );
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeTruthy();
    });
  });
});
```

### 6. Testing with i18n

```typescript
// src/lib/test/helpers.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

```typescript
// Usage in tests
import { render, screen } from '@/lib/test/helpers';
import DashboardContent from './DashboardContent';

describe('DashboardContent', () => {
  it('renders translated welcome message', () => {
    render(<DashboardContent />);
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

### 7. Integration Tests

```typescript
// src/components/forms/LoginForm.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/lib/test/mocks/server';
import { rest } from 'msw';
import LoginForm from './LoginForm';
import { useAuthStore } from '@/lib/store';

describe('LoginForm Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('successfully logs in user and updates store', async () => {
    const user = userEvent.setup();

    server.use(
      rest.post('/api/v1/auth/login', (req, res, ctx) => {
        return res(
          ctx.json({
            accessToken: 'test-token',
            refreshToken: 'test-refresh',
            expiresIn: 3600,
            user: {
              id: '1',
              email: 'test@test.com',
              name: 'Test User',
              role: 'employee',
            },
          })
        );
      })
    );

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@test.com');
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();

    server.use(
      rest.post('/api/v1/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({ message: 'Invalid credentials' })
        );
      })
    );

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

### 8. E2E Tests

```typescript
// tests/e2e/timesheet-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Timesheet Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create and submit timesheet', async ({ page }) => {
    // Navigate to timesheet page
    await page.click('a[href="/timesheet"]');
    await page.waitForURL('/timesheet');

    // Create new timesheet if needed
    const createButton = page.locator('button:has-text("Create timesheet")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
    }

    // Add time entry
    await page.click('button:has-text("Add entry")');
    await page.selectOption('select[name="project"]', { index: 1 });
    await page.selectOption('select[name="task"]', { index: 1 });
    await page.fill('input[name="hours"]', '8');
    await page.fill('textarea[name="notes"]', 'Development work');
    await page.click('button[type="submit"]');

    // Verify entry appears
    await expect(page.locator('text=Development work')).toBeVisible();
    await expect(page.locator('text=8')).toBeVisible();

    // Submit timesheet
    await page.click('button:has-text("Submit for approval")');
    await page.waitForSelector('text=Timesheet submitted successfully');

    // Verify status changed
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should validate maximum hours per day', async ({ page }) => {
    await page.goto('/timesheet');

    // Try to add more than 24 hours
    await page.click('button:has-text("Add entry")');
    await page.selectOption('select[name="project"]', { index: 1 });
    await page.selectOption('select[name="task"]', { index: 1 });
    await page.fill('input[name="hours"]', '25');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/maximum.*hours/i')).toBeVisible();
  });
});
```

---

## Mocking Strategies

### 1. Mock Service Worker (MSW) Setup

```typescript
// src/lib/test/mocks/handlers.ts
import { rest } from 'msw';

const baseURL = 'http://localhost:3000/api/v1';

export const handlers = [
  // Auth endpoints
  rest.post(`${baseURL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body as { email: string; password: string };

    if (email === 'test@test.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          expiresIn: 3600,
          user: {
            id: '1',
            email: 'test@test.com',
            name: 'Test User',
            role: 'employee',
          },
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid credentials' })
    );
  }),

  // Timesheet endpoints
  rest.get(`${baseURL}/timesheets`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          userId: '1',
          weekStartDate: '2025-01-13',
          status: 'draft',
          totalHours: 40,
          createdAt: '2025-01-11T10:00:00Z',
        },
      ])
    );
  }),

  // Add more handlers as needed...
];
```

```typescript
// src/lib/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/lib/test/setup.ts
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Cleanup after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Stop MSW server
afterAll(() => server.close());

// Mock environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000/api/v1');
vi.stubEnv('VITE_DEFAULT_LOCALE', 'en');
vi.stubEnv('VITE_SUPPORTED_LOCALES', 'en,es,pt-PT,de');
```

### 2. Mocking External Services

```typescript
// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
  },
}));

// Mock Sentry
vi.mock('@sentry/browser', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
```

### 3. Mock Data Fixtures

```typescript
// src/lib/test/mocks/data.ts
export const mockUser = {
  id: '1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'employee' as const,
  tenantId: 'tenant-1',
};

export const mockManager = {
  id: '2',
  email: 'manager@test.com',
  name: 'Manager User',
  role: 'manager' as const,
  tenantId: 'tenant-1',
};

export const mockTimesheet = {
  id: '1',
  userId: '1',
  weekStartDate: '2025-01-13',
  status: 'draft' as const,
  totalHours: 40,
  createdAt: '2025-01-11T10:00:00.000Z',
  updatedAt: '2025-01-11T10:00:00.000Z',
};

export const mockTimeEntry = {
  id: '1',
  timesheetId: '1',
  projectId: 'proj-1',
  taskId: 'task-1',
  dayOfWeek: 1,
  hours: 8,
  notes: 'Development work',
  createdAt: '2025-01-13T10:00:00.000Z',
};

export const mockLeaveRequest = {
  id: '1',
  userId: '1',
  benefitTypeId: 'vacation',
  startDate: '2025-02-01',
  endDate: '2025-02-05',
  totalDays: 5,
  status: 'pending' as const,
  reason: 'Family vacation',
  createdAt: '2025-01-11T10:00:00.000Z',
};
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop, 'claude/**']
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [22.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm exec astro check

      - name: Run unit tests with coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/kairosfe/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Check coverage thresholds
        run: |
          if [ -f coverage/coverage-summary.json ]; then
            node scripts/check-coverage.js
          fi

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Build application
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/kairosfe/playwright-report/
          retention-days: 30
```

### Coverage Threshold Check Script

```javascript
// scripts/check-coverage.js
const fs = require('fs');
const path = require('path');

const coverageSummaryPath = path.join(
  __dirname,
  '../apps/kairosfe/coverage/coverage-summary.json'
);

const thresholds = {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90,
};

const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
const total = summary.total;

let failed = false;

Object.keys(thresholds).forEach((key) => {
  const actual = total[key].pct;
  const expected = thresholds[key];

  if (actual < expected) {
    console.error(
      `❌ Coverage threshold for ${key} not met: ${actual}% < ${expected}%`
    );
    failed = true;
  } else {
    console.log(
      `✅ Coverage threshold for ${key} met: ${actual}% >= ${expected}%`
    );
  }
});

if (failed) {
  process.exit(1);
}

console.log('✅ All coverage thresholds met!');
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1) - HIGH PRIORITY

**Goal**: Set up infrastructure and test critical paths

#### Tasks:
1. ✅ Add coverage dependencies
   ```bash
   pnpm add -D @vitest/coverage-v8 msw
   ```

2. ✅ Update vitest.config.ts with coverage settings

3. ✅ Create MSW setup (handlers, server, mock data)

4. ✅ Create test helper utilities

5. ✅ Update CI/CD workflow

6. ✅ Test critical modules:
   - `src/lib/store/authStore.ts` (100% coverage)
   - `src/lib/store/uiStore.ts` (100% coverage)
   - `src/lib/api/client.ts` (95% coverage)
   - `src/lib/api/services/auth.ts` (100% coverage)

**Success Criteria**:
- [ ] Infrastructure setup complete
- [ ] CI running tests on every PR
- [ ] Critical modules at 95%+ coverage
- [ ] Coverage report generated and uploaded

---

### Phase 2: API Services (Week 2) - HIGH PRIORITY

**Goal**: Achieve 95% coverage for all API services

#### Modules to Test:
- `src/lib/api/services/timesheets.ts`
- `src/lib/api/services/timeEntries.ts`
- `src/lib/api/services/leaveRequests.ts`
- `src/lib/api/services/users.ts`
- `src/lib/api/services/projects.ts`
- `src/lib/api/services/tasks.ts`
- `src/lib/api/services/holidays.ts`
- `src/lib/api/services/benefits.ts`
- `src/lib/api/services/calendar.ts`
- `src/lib/api/services/reports.ts`

**Success Criteria**:
- [ ] All API services have comprehensive unit tests
- [ ] MSW handlers created for all endpoints
- [ ] 95%+ coverage for all service files
- [ ] Error handling tested

---

### Phase 3: Utilities & Helpers (Week 3) - HIGH PRIORITY

**Goal**: 100% coverage for utility functions

#### Modules to Test:
- `src/lib/utils/date.ts`
- `src/lib/utils/format.ts`
- `src/lib/utils/validation.ts`
- `src/lib/utils/calculations.ts`
- `src/lib/auth/tokens.ts`
- `src/lib/auth/permissions.ts`

**Success Criteria**:
- [ ] 100% coverage for all utility functions
- [ ] Edge cases tested
- [ ] Type guards tested

---

### Phase 4: Form Components (Week 4) - HIGH PRIORITY

**Goal**: 95% coverage for all form components

#### Components to Test:
- `src/components/forms/LoginForm.tsx`
- `src/components/forms/LoginFormNew.tsx`
- `src/components/forms/TimeEntryForm.tsx`
- `src/components/forms/LeaveRequestForm.tsx`
- `src/components/forms/AddEmployeeModal.tsx`
- `src/components/forms/EditEmployeeModal.tsx`
- `src/components/forms/BulkImportModal.tsx`
- `src/components/forms/BulkFillModal.tsx`
- `src/components/forms/FormInput.tsx`

**Test Scenarios**:
- [ ] Form validation (required fields, formats)
- [ ] Submit handlers
- [ ] Loading/disabled states
- [ ] Error display
- [ ] Integration with React Hook Form

**Success Criteria**:
- [ ] All form components tested
- [ ] Validation logic covered
- [ ] 95%+ coverage

---

### Phase 5: Data Components (Week 5) - MEDIUM PRIORITY

**Goal**: 90% coverage for data display components

#### Components to Test:
- `src/components/data/DashboardContent.tsx`
- `src/components/data/ProfileContent.tsx`
- `src/components/data/TeamManagementContent.tsx`
- `src/components/data/LeaveRequestsContent.tsx`
- `src/components/data/TimesheetContent.tsx`
- `src/components/data/TimesheetQueueTable.tsx`
- `src/components/data/TeamCalendarContent.tsx`
- `src/components/data/TeamReportsContent.tsx`

**Test Scenarios**:
- [ ] Data fetching and display
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] User interactions (sorting, filtering)

**Success Criteria**:
- [ ] All data components tested
- [ ] All states tested (loading/empty/error/success)
- [ ] 90%+ coverage

---

### Phase 6: UI Components (Week 6) - MEDIUM PRIORITY

**Goal**: 85% coverage for UI components

#### Components to Test:
- `src/components/ui/Button.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/DataState.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Dropdown.tsx`
- etc.

**Success Criteria**:
- [ ] All UI components tested
- [ ] Props variants tested
- [ ] 85%+ coverage

---

### Phase 7: Integration Tests (Week 7) - MEDIUM PRIORITY

**Goal**: Test critical integration points

#### Integration Scenarios:
- [ ] Login flow (form + API + store)
- [ ] Timesheet CRUD (components + API + store)
- [ ] Leave request workflow
- [ ] Manager approval workflows
- [ ] Navigation and routing
- [ ] i18n integration

**Success Criteria**:
- [ ] All critical workflows tested end-to-end
- [ ] Integration points covered
- [ ] 90%+ coverage of integration logic

---

### Phase 8: E2E Tests (Week 8) - LOW PRIORITY

**Goal**: Cover all critical user journeys

#### E2E Test Suites:
- [x] Login and authentication (existing)
- [ ] Timesheet workflow (create, edit, submit)
- [ ] Leave request workflow
- [ ] Manager approval queues
- [ ] Admin operations (users, projects, etc.)
- [ ] Settings and preferences
- [ ] Multi-language support

**Success Criteria**:
- [ ] All critical paths have E2E tests
- [ ] Tests run in CI
- [ ] Visual regression tests (optional)

---

### Phase 9: Polish & Maintenance (Ongoing)

#### Tasks:
- [ ] Review coverage reports
- [ ] Add tests for edge cases
- [ ] Improve flaky tests
- [ ] Update documentation
- [ ] Add visual regression tests
- [ ] Performance testing

**Success Criteria**:
- [ ] 95%+ overall coverage maintained
- [ ] No flaky tests
- [ ] All new features have tests
- [ ] Tests run fast (<5min for unit, <10min for E2E)

---

## Best Practices

### 1. General Testing Principles

✅ **DO:**
- Write tests that test behavior, not implementation
- Use descriptive test names that explain what is being tested
- Keep tests simple and focused (one assertion per test when possible)
- Use arrange-act-assert (AAA) pattern
- Mock external dependencies
- Test edge cases and error conditions
- Write tests before fixing bugs (TDD for bug fixes)

❌ **DON'T:**
- Test third-party libraries
- Test implementation details
- Write tests that depend on other tests
- Use production data in tests
- Ignore test failures
- Skip tests (fix or remove them)

### 2. Component Testing

✅ **DO:**
- Query by accessibility attributes (role, label, text)
- Use userEvent for simulating user interactions
- Wait for async changes with waitFor
- Test from the user's perspective
- Test all states (loading, error, empty, success)

❌ **DON'T:**
- Query by class names or IDs
- Use fireEvent (use userEvent instead)
- Test CSS or styles
- Snapshot test everything (use sparingly)

### 3. Writing Maintainable Tests

✅ **DO:**
- Use test helpers and utilities
- Create reusable mock data
- Extract common setup to beforeEach
- Use meaningful variable names
- Keep tests DRY (Don't Repeat Yourself)

❌ **DON'T:**
- Copy-paste test code
- Hard-code values
- Create complex test logic
- Test multiple things in one test

### 4. Performance

✅ **DO:**
- Run unit tests in parallel
- Use test.concurrent for independent tests
- Mock slow dependencies
- Keep test data small
- Use beforeAll for expensive setup

❌ **DON'T:**
- Make real API calls in unit tests
- Use setTimeout (use waitFor instead)
- Create large test datasets
- Run E2E tests for everything

### 5. Coverage Goals

- **95%+ overall coverage**: Aim high but be pragmatic
- **100% critical paths**: Auth, payments, data loss prevention
- **90%+ business logic**: Core features and workflows
- **85%+ UI components**: Focus on behavior, not styling

### 6. Code Review Checklist

Before merging:
- [ ] All new code has tests
- [ ] Coverage thresholds met
- [ ] All tests pass
- [ ] No skipped or disabled tests
- [ ] Tests follow naming conventions
- [ ] Mock data is realistic
- [ ] Edge cases covered

---

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

### Articles
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## Appendix

### Test Naming Conventions

```typescript
// ✅ Good test names
describe('LoginForm', () => {
  it('shows validation error when email is invalid', () => {});
  it('disables submit button while submitting', () => {});
  it('calls onSubmit with form data when form is valid', () => {});
});

// ❌ Bad test names
describe('LoginForm', () => {
  it('test 1', () => {});
  it('works', () => {});
  it('email validation', () => {});
});
```

### AAA Pattern Example

```typescript
it('adds item to cart', () => {
  // Arrange: Set up test data and preconditions
  const product = { id: '1', name: 'Test Product', price: 10 };
  render(<ProductCard product={product} />);

  // Act: Perform the action being tested
  const addButton = screen.getByRole('button', { name: /add to cart/i });
  userEvent.click(addButton);

  // Assert: Verify the expected outcome
  expect(screen.getByText('Added to cart')).toBeInTheDocument();
});
```

### Query Priority

Use queries in this order:

1. **Accessible to everyone** (preferred):
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Semantic queries**:
   - `getByAltText`
   - `getByTitle`

3. **Test IDs** (last resort):
   - `getByTestId`

### Coverage Report Commands

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open apps/kairosfe/coverage/index.html

# View coverage for specific file
pnpm test src/lib/store/authStore.test.ts --coverage

# Watch mode with coverage
pnpm test --watch --coverage
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-11 | Initial test plan created |

---

## Approval

**Document Status**: 📋 Draft - Awaiting Review

**Reviewed By**: _Pending_
**Approved By**: _Pending_
**Date**: _Pending_

---

**End of Test Plan**
