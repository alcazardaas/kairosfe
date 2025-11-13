import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form with all fields', async ({ page }) => {
    // Check page title and heading
    await expect(page).toHaveTitle(/Sign Up/i);
    await expect(page.getByRole('heading', { name: /Create your Kairos account/i })).toBeVisible();

    // Check all form fields are present
    await expect(page.getByPlaceholder('John')).toBeVisible();
    await expect(page.getByPlaceholder('Doe')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Corporation')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible();
    await expect(page.getByPlaceholder('Re-enter your password')).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Click submit without filling any fields
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Check for validation error messages
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Company name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder('you@example.com').fill('invalid-email');
    await page.getByRole('button', { name: /Create Account/i }).click();

    await expect(page.getByText('Invalid email format')).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.getByPlaceholder('At least 8 characters').fill('short');
    await page.getByRole('button', { name: /Create Account/i }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByPlaceholder('At least 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('different123');
    await page.getByRole('button', { name: /Create Account/i }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should show error when terms not accepted', async ({ page }) => {
    // Fill all fields except terms
    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Doe').fill('Doe');
    await page.getByPlaceholder('Acme Corporation').fill('Acme Corp');
    await page.getByPlaceholder('you@example.com').fill('john@acme.com');
    await page.getByPlaceholder('At least 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('password123');

    await page.getByRole('button', { name: /Create Account/i }).click();

    await expect(page.getByText('You must accept the terms and conditions')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('At least 8 characters');
    const confirmPasswordInput = page.getByPlaceholder('Re-enter your password');

    // Check initial type is password
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Click visibility toggle for password field
    const visibilityButtons = page.locator('button[type="button"]').filter({ has: page.locator('.material-symbols-outlined') });
    await visibilityButtons.first().click();

    // Check password is now visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await visibilityButtons.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to login page from footer link', async ({ page }) => {
    await page.getByRole('link', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should successfully signup with valid data', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: '2025-12-13T00:00:00.000Z',
            user: {
              id: 'user-123',
              email: 'john@newcompany.com',
              name: 'John Doe',
            },
            tenant: {
              id: 'tenant-123',
              name: 'New Company Inc',
              slug: 'new-company-inc',
            },
            membership: {
              role: 'admin',
              status: 'active',
            },
          },
        }),
      });
    });

    // Mock the /auth/me endpoint for hydration
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'user-123',
              email: 'john@newcompany.com',
              name: 'John Doe',
            },
            membership: {
              role: 'admin',
              status: 'active',
            },
            tenant: {
              id: 'tenant-123',
              name: 'New Company Inc',
              slug: 'new-company-inc',
            },
            timesheetPolicy: {
              hoursPerWeek: 40,
            },
          },
        }),
      });
    });

    // Fill out the form
    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Doe').fill('Doe');
    await page.getByPlaceholder('Acme Corporation').fill('New Company Inc');
    await page.getByPlaceholder('you@example.com').fill('john@newcompany.com');
    await page.getByPlaceholder('At least 8 characters').fill('SecurePass123!');
    await page.getByPlaceholder('Re-enter your password').fill('SecurePass123!');
    await page.getByRole('checkbox').check();

    // Submit the form
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('should handle duplicate email error (409)', async ({ page }) => {
    // Mock 409 Conflict response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Conflict',
          message: 'Email address is already registered',
          statusCode: 409,
        }),
      });
    });

    // Fill out the form
    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Doe').fill('Doe');
    await page.getByPlaceholder('Acme Corporation').fill('Existing Company');
    await page.getByPlaceholder('you@example.com').fill('existing@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('password123');
    await page.getByRole('checkbox').check();

    // Submit the form
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Should show error message
    await expect(page.getByText(/already registered/i)).toBeVisible();
  });

  test('should handle rate limit error (429)', async ({ page }) => {
    // Mock 429 Rate Limit response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too Many Requests',
          message: 'Too many signup attempts. Maximum 4 signups per hour per IP address.',
          statusCode: 429,
        }),
      });
    });

    // Fill out the form
    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Doe').fill('Doe');
    await page.getByPlaceholder('Acme Corporation').fill('Test Company');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('password123');
    await page.getByRole('checkbox').check();

    // Submit the form
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Should show rate limit error
    await expect(page.getByText(/Too many signup attempts/i)).toBeVisible();
  });

  test('should handle validation error (400)', async ({ page }) => {
    // Mock 400 Bad Request response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Validation failed: password must be at least 8 characters',
          statusCode: 400,
        }),
      });
    });

    // Fill out the form with invalid data
    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Doe').fill('Doe');
    await page.getByPlaceholder('Acme Corporation').fill('Test Company');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('short');
    await page.getByPlaceholder('Re-enter your password').fill('short');
    await page.getByRole('checkbox').check();

    // Submit the form
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Should show validation error
    await expect(page.getByText(/Validation failed/i)).toBeVisible();
  });

  test('should disable submit button while loading', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: '2025-12-13T00:00:00.000Z',
            user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
            tenant: { id: 'tenant-123', name: 'Test Company', slug: 'test-company' },
            membership: { role: 'admin', status: 'active' },
          },
        }),
      });
    });

    // Fill out the form
    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Doe').fill('Doe');
    await page.getByPlaceholder('Acme Corporation').fill('Test Company');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('password123');
    await page.getByRole('checkbox').check();

    const submitButton = page.getByRole('button', { name: /Create Account/i });

    // Submit the form
    await submitButton.click();

    // Button should be disabled while loading
    await expect(submitButton).toBeDisabled();
  });

  test('should trim whitespace from inputs', async ({ page }) => {
    let capturedRequestBody: any;

    await page.route('**/api/v1/auth/signup', async (route) => {
      const request = route.request();
      capturedRequestBody = JSON.parse(request.postData() || '{}');

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: '2025-12-13T00:00:00.000Z',
            user: { id: 'user-123', email: 'john@example.com', name: 'John Doe' },
            tenant: { id: 'tenant-123', name: 'Test Company', slug: 'test-company' },
            membership: { role: 'admin', status: 'active' },
          },
        }),
      });
    });

    // Fill form with extra whitespace
    await page.getByPlaceholder('John').fill('  John  ');
    await page.getByPlaceholder('Doe').fill('  Doe  ');
    await page.getByPlaceholder('Acme Corporation').fill('  Test Company  ');
    await page.getByPlaceholder('you@example.com').fill('  JOHN@EXAMPLE.COM  ');
    await page.getByPlaceholder('At least 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('password123');
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: /Create Account/i }).click();

    // Wait a bit for the request to complete
    await page.waitForTimeout(1000);

    // Verify trimmed and normalized values were sent
    expect(capturedRequestBody.email).toBe('john@example.com'); // Trimmed and lowercased
    expect(capturedRequestBody.firstName).toBe('John'); // Trimmed
    expect(capturedRequestBody.lastName).toBe('Doe'); // Trimmed
    expect(capturedRequestBody.companyName).toBe('Test Company'); // Trimmed
  });

  test('should navigate from login to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/.*\/signup/);
    await expect(page.getByRole('heading', { name: /Create your Kairos account/i })).toBeVisible();
  });
});
