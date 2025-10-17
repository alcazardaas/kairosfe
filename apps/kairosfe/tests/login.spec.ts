import { test, expect } from '@playwright/test';

test.describe('Login & Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Kairos');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Wait for validation errors
    await page.waitForTimeout(500);

    const errors = await page.locator('.form-error, [class*="error"]');
    expect(await errors.count()).toBeGreaterThan(0);
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector('.error, [class*="error"]', { timeout: 5000 });

    const errorText = await page.textContent('.error, [class*="error"]');
    expect(errorText).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in correct credentials
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');

    // Should show user name
    await expect(page.locator('text=Demo User')).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Demo User')).toBeVisible();
  });

  test('should show role-based menu items', async ({ page }) => {
    // Login as employee
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Employee should NOT see team management
    const teamLink = page.locator('a[href="/team-management"]');
    await expect(teamLink).not.toBeVisible();

    // Logout
    await page.click('text=Logout');
    await page.waitForURL('/login');

    // Login as manager
    await page.fill('input[type="email"]', 'manager@kairos.com');
    await page.fill('input[type="password"]', 'manager123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Manager SHOULD see team management
    const managerTeamLink = page.locator('a[href="/team-management"]');
    await expect(managerTeamLink).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click logout
    await page.click('text=Logout');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');

    // Try to access dashboard again
    await page.goto('/dashboard');

    // Should redirect back to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
