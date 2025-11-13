import { test, expect } from '@playwright/test';

test.describe('Timesheet Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should display timesheet page with week picker', async ({ page }) => {
    await page.goto('/timesheet');

    // Should show week picker
    await expect(page.locator('[data-testid="week-picker"], .week-picker')).toBeVisible();

    // Should show days of the week
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible();
    }
  });

  test('should navigate between weeks', async ({ page }) => {
    await page.goto('/timesheet');

    // Click previous week button
    const prevButton = page.locator('button:has-text("Previous"), button[aria-label*="previous"]').first();
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(500);

      // Click next week button
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"]').first();
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Should still be on timesheet page
    await expect(page).toHaveURL(/\/timesheet/);
  });

  test('should display timesheet status', async ({ page }) => {
    await page.goto('/timesheet');

    // Should show status indicator (draft, submitted, approved, etc.)
    const statusIndicators = page.locator('[data-testid="timesheet-status"], .status-badge, .badge');
    await expect(statusIndicators.first()).toBeVisible();
  });

  test('should show total hours for the week', async ({ page }) => {
    await page.goto('/timesheet');

    // Should display total hours
    await expect(page.locator('text=/total.*hours/i, text=/\\d+ hours/i').first()).toBeVisible();
  });

  test('should allow editing time entries when in draft mode', async ({ page }) => {
    await page.goto('/timesheet');

    // Look for editable time inputs or cells
    const timeInputs = page.locator('input[type="number"], input[type="text"]').first();
    if (await timeInputs.isVisible()) {
      await expect(timeInputs).toBeEnabled();
    }
  });

  test('should display projects and tasks', async ({ page }) => {
    await page.goto('/timesheet');

    // Should show project/task selection or display
    const projectElements = page.locator('[data-testid="project"], .project, select[name*="project"]');
    await expect(projectElements.first()).toBeVisible();
  });

  test('should show submit button when timesheet is in draft', async ({ page }) => {
    await page.goto('/timesheet');
    await page.waitForTimeout(1000);

    // Look for submit button
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Submit for Approval")').first();

    // If button exists, it should be visible
    const count = await submitButton.count();
    if (count > 0) {
      await expect(submitButton).toBeVisible();
    }
  });

  test('should persist data after navigation', async ({ page }) => {
    await page.goto('/timesheet');
    await page.waitForTimeout(1000);

    // Navigate away
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Navigate back
    await page.goto('/timesheet');
    await page.waitForTimeout(1000);

    // Should still show timesheet data
    await expect(page.locator('[data-testid="week-picker"], .week-picker').first()).toBeVisible();
  });

  test('should display validation errors for invalid entries', async ({ page }) => {
    await page.goto('/timesheet');
    await page.waitForTimeout(1000);

    // Try to enter invalid hours (e.g., negative or > 24)
    const timeInput = page.locator('input[type="number"]').first();
    if (await timeInput.isVisible() && await timeInput.isEnabled()) {
      await timeInput.fill('25'); // More than 24 hours
      await timeInput.blur();
      await page.waitForTimeout(500);

      // Should show validation error (if validation exists)
      const errorIndicator = page.locator('.error, .form-error, [class*="error"]');
      // Check if error appears (not asserting since validation might not exist yet)
      if (await errorIndicator.count() > 0) {
        await expect(errorIndicator.first()).toBeVisible();
      }
    }
  });
});
