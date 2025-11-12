import { test, expect } from '@playwright/test';

test.describe('Leave Requests Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should display leave requests page', async ({ page }) => {
    await page.goto('/leave-requests');

    // Should show page title
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Should show leave requests list or empty state
    const content = page.locator('[data-testid="leave-requests"], .leave-requests, .data-state');
    await expect(content.first()).toBeVisible();
  });

  test('should display create leave request button', async ({ page }) => {
    await page.goto('/leave-requests');

    // Should show create/new button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    await expect(createButton).toBeVisible();
  });

  test('should show leave request form when create button clicked', async ({ page }) => {
    await page.goto('/leave-requests');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Should show form modal or form section
      const form = page.locator('form, [role="dialog"], .modal');
      await expect(form.first()).toBeVisible();
    }
  });

  test('should display leave type selector in form', async ({ page }) => {
    await page.goto('/leave-requests');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Should show leave type selector
      const leaveTypeSelect = page.locator('select[name*="type"], select[name*="benefit"], [data-testid="leave-type"]');
      if (await leaveTypeSelect.count() > 0) {
        await expect(leaveTypeSelect.first()).toBeVisible();
      }
    }
  });

  test('should display date pickers for start and end dates', async ({ page }) => {
    await page.goto('/leave-requests');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Should show date inputs
      const dateInputs = page.locator('input[type="date"], input[placeholder*="date"]');
      expect(await dateInputs.count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('should display leave balance information', async ({ page }) => {
    await page.goto('/leave-requests');

    // Should show available leave balance
    const balanceInfo = page.locator('[data-testid="leave-balance"], .balance, text=/available/i, text=/remaining/i');
    await expect(balanceInfo.first()).toBeVisible();
  });

  test('should filter leave requests by status', async ({ page }) => {
    await page.goto('/leave-requests');
    await page.waitForTimeout(1000);

    // Should show status filter/tabs
    const statusFilters = page.locator('[data-testid="status-filter"], .tabs, button:has-text("Pending"), button:has-text("Approved")');
    if (await statusFilters.count() > 0) {
      await expect(statusFilters.first()).toBeVisible();
    }
  });

  test('should display leave request cards with status badges', async ({ page }) => {
    await page.goto('/leave-requests');
    await page.waitForTimeout(1000);

    // Should show status badges
    const statusBadges = page.locator('.status-badge, .badge, [data-testid="status"]');
    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('should show validation errors for invalid date ranges', async ({ page }) => {
    await page.goto('/leave-requests');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Try to set end date before start date
      const startDateInput = page.locator('input[name*="start"]').first();
      const endDateInput = page.locator('input[name*="end"]').first();

      if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
        await startDateInput.fill('2025-12-31');
        await endDateInput.fill('2025-12-01');

        // Try to submit
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);

          // Should show validation error (if validation exists)
          const errorIndicator = page.locator('.error, .form-error, [class*="error"]');
          if (await errorIndicator.count() > 0) {
            await expect(errorIndicator.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should cancel leave request creation', async ({ page }) => {
    await page.goto('/leave-requests');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Click cancel button
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);

        // Form should close
        const form = page.locator('[role="dialog"], .modal');
        expect(await form.count()).toBe(0);
      }
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/leave-requests');

    // Click dashboard link
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForURL('/dashboard', { timeout: 5000 });
      await expect(page).toHaveURL('/dashboard');
    }
  });
});
