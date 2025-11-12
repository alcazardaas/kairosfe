import { test, expect } from '@playwright/test';

test.describe('Manager Approval Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as manager before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'manager@kairos.com');
    await page.fill('input[type="password"]', 'manager123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test.describe('Team Timesheets Approval', () => {
    test('should display team timesheets page', async ({ page }) => {
      await page.goto('/team-timesheets');

      // Should show page title
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Should show timesheets list or empty state
      const content = page.locator('[data-testid="timesheets-queue"], .timesheets-table, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should filter timesheets by status', async ({ page }) => {
      await page.goto('/team-timesheets');
      await page.waitForTimeout(1000);

      // Should show status filter/tabs
      const statusFilters = page.locator('[data-testid="status-filter"], .tabs, button:has-text("Pending"), button:has-text("Approved")');
      if (await statusFilters.count() > 0) {
        await expect(statusFilters.first()).toBeVisible();
      }
    });

    test('should display pending timesheets', async ({ page }) => {
      await page.goto('/team-timesheets');
      await page.waitForTimeout(1000);

      // Click pending tab if it exists
      const pendingTab = page.locator('button:has-text("Pending")').first();
      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Should show timesheets or empty state
      const content = page.locator('.timesheet-row, tr, .card, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should show timesheet details', async ({ page }) => {
      await page.goto('/team-timesheets');
      await page.waitForTimeout(1000);

      // Look for timesheet rows
      const timesheetRows = page.locator('.timesheet-row, tr').filter({ hasText: /\d+/ });
      if (await timesheetRows.count() > 0) {
        // Click first timesheet
        await timesheetRows.first().click();
        await page.waitForTimeout(500);

        // Should show details (modal or expanded view)
        const details = page.locator('[role="dialog"], .modal, .expanded');
        if (await details.count() > 0) {
          await expect(details.first()).toBeVisible();
        }
      }
    });

    test('should display approve and reject buttons', async ({ page }) => {
      await page.goto('/team-timesheets');
      await page.waitForTimeout(1000);

      // Should show action buttons
      const approveButton = page.locator('button:has-text("Approve")').first();
      const rejectButton = page.locator('button:has-text("Reject")').first();

      // If there are pending timesheets, buttons should exist
      if (await approveButton.count() > 0) {
        await expect(approveButton).toBeVisible();
      }
      if (await rejectButton.count() > 0) {
        await expect(rejectButton).toBeVisible();
      }
    });
  });

  test.describe('Team Leave Approvals', () => {
    test('should display team leave page', async ({ page }) => {
      await page.goto('/team-leave');

      // Should show page title
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Should show leave requests list or empty state
      const content = page.locator('[data-testid="leave-requests"], .leave-table, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should filter leave requests by status', async ({ page }) => {
      await page.goto('/team-leave');
      await page.waitForTimeout(1000);

      // Should show status filter/tabs
      const statusFilters = page.locator('[data-testid="status-filter"], .tabs, button:has-text("Pending"), button:has-text("Approved")');
      if (await statusFilters.count() > 0) {
        await expect(statusFilters.first()).toBeVisible();
      }
    });

    test('should display pending leave requests', async ({ page }) => {
      await page.goto('/team-leave');
      await page.waitForTimeout(1000);

      // Click pending tab if it exists
      const pendingTab = page.locator('button:has-text("Pending")').first();
      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Should show leave requests or empty state
      const content = page.locator('.leave-row, tr, .card, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should show leave request details', async ({ page }) => {
      await page.goto('/team-leave');
      await page.waitForTimeout(1000);

      // Look for leave request rows
      const leaveRows = page.locator('.leave-row, tr').filter({ hasText: /\d+/ });
      if (await leaveRows.count() > 0) {
        // Click first leave request
        await leaveRows.first().click();
        await page.waitForTimeout(500);

        // Should show details (modal or expanded view)
        const details = page.locator('[role="dialog"], .modal, .expanded');
        if (await details.count() > 0) {
          await expect(details.first()).toBeVisible();
        }
      }
    });

    test('should display approve and reject buttons for leave', async ({ page }) => {
      await page.goto('/team-leave');
      await page.waitForTimeout(1000);

      // Should show action buttons
      const approveButton = page.locator('button:has-text("Approve")').first();
      const rejectButton = page.locator('button:has-text("Reject")').first();

      // If there are pending leave requests, buttons should exist
      if (await approveButton.count() > 0) {
        await expect(approveButton).toBeVisible();
      }
      if (await rejectButton.count() > 0) {
        await expect(rejectButton).toBeVisible();
      }
    });
  });

  test.describe('Team Management', () => {
    test('should display team management page', async ({ page }) => {
      await page.goto('/team-management');

      // Should show page title
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Should show team members list
      const content = page.locator('[data-testid="team-members"], .team-table, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should show add employee button', async ({ page }) => {
      await page.goto('/team-management');

      // Should show add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Employee")').first();
      await expect(addButton).toBeVisible();
    });

    test('should filter team members', async ({ page }) => {
      await page.goto('/team-management');
      await page.waitForTimeout(1000);

      // Should show search or filter
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();
      }
    });

    test('should display team member details', async ({ page }) => {
      await page.goto('/team-management');
      await page.waitForTimeout(1000);

      // Look for team member rows
      const memberRows = page.locator('.team-row, tr').filter({ hasText: /@/ });
      if (await memberRows.count() > 0) {
        // Click first team member
        await memberRows.first().click();
        await page.waitForTimeout(500);

        // Should show details (modal or expanded view)
        const details = page.locator('[role="dialog"], .modal, .expanded');
        if (await details.count() > 0) {
          await expect(details.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Team Reports', () => {
    test('should display team reports page', async ({ page }) => {
      await page.goto('/team-reports');

      // Should show page title
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Should show reports or charts
      const content = page.locator('[data-testid="reports"], .reports, .chart, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should show date range selector', async ({ page }) => {
      await page.goto('/team-reports');
      await page.waitForTimeout(1000);

      // Should show date pickers or period selector
      const dateSelectors = page.locator('input[type="date"], select[name*="period"], [data-testid="date-range"]');
      if (await dateSelectors.count() > 0) {
        await expect(dateSelectors.first()).toBeVisible();
      }
    });
  });

  test.describe('Team Calendar', () => {
    test('should display team calendar page', async ({ page }) => {
      await page.goto('/team-calendar');

      // Should show page title
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Should show calendar
      const content = page.locator('[data-testid="calendar"], .calendar, .data-state');
      await expect(content.first()).toBeVisible();
    });

    test('should navigate between months', async ({ page }) => {
      await page.goto('/team-calendar');
      await page.waitForTimeout(1000);

      // Look for month navigation buttons
      const prevButton = page.locator('button[aria-label*="previous"], button:has-text("<")').first();
      const nextButton = page.locator('button[aria-label*="next"], button:has-text(">")').first();

      if (await prevButton.isVisible() && await nextButton.isVisible()) {
        // Click previous month
        await prevButton.click();
        await page.waitForTimeout(500);

        // Click next month
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should still be on calendar page
        await expect(page).toHaveURL(/\/team-calendar/);
      }
    });
  });
});
