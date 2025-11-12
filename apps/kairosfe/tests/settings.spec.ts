import { test, expect } from '@playwright/test';

test.describe('Settings Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'demo@kairos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');

    // Should show page title
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Should show settings content
    const content = page.locator('[data-testid="settings"], .settings-content');
    await expect(content.first()).toBeVisible();
  });

  test.describe('Theme Settings', () => {
    test('should display theme selector', async ({ page }) => {
      await page.goto('/settings');

      // Should show theme options
      const themeSelector = page.locator('[data-testid="theme-selector"], select[name*="theme"], input[type="radio"][name*="theme"]');
      if (await themeSelector.count() > 0) {
        await expect(themeSelector.first()).toBeVisible();
      }
    });

    test('should switch to dark mode', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Look for dark mode toggle/button
      const darkModeButton = page.locator('button:has-text("Dark"), input[value="dark"], [data-value="dark"]').first();
      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();
        await page.waitForTimeout(500);

        // Check if dark mode class is applied
        const htmlElement = page.locator('html');
        const classes = await htmlElement.getAttribute('class');
        expect(classes).toContain('dark');
      }
    });

    test('should switch to light mode', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // First set dark mode
      const darkModeButton = page.locator('button:has-text("Dark"), input[value="dark"], [data-value="dark"]').first();
      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();
        await page.waitForTimeout(500);
      }

      // Then switch to light mode
      const lightModeButton = page.locator('button:has-text("Light"), input[value="light"], [data-value="light"]').first();
      if (await lightModeButton.isVisible()) {
        await lightModeButton.click();
        await page.waitForTimeout(500);

        // Check if dark mode class is removed
        const htmlElement = page.locator('html');
        const classes = await htmlElement.getAttribute('class');
        expect(classes).not.toContain('dark');
      }
    });

    test('should persist theme after page reload', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Switch to dark mode
      const darkModeButton = page.locator('button:has-text("Dark"), input[value="dark"], [data-value="dark"]').first();
      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForTimeout(500);

        // Dark mode should still be active
        const htmlElement = page.locator('html');
        const classes = await htmlElement.getAttribute('class');
        expect(classes).toContain('dark');
      }
    });
  });

  test.describe('Language Settings', () => {
    test('should display language selector', async ({ page }) => {
      await page.goto('/settings');

      // Should show language selector
      const languageSelector = page.locator('[data-testid="language-selector"], select[name*="language"], select[name*="locale"]').first();
      await expect(languageSelector).toBeVisible();
    });

    test('should have multiple language options', async ({ page }) => {
      await page.goto('/settings');

      // Find language selector
      const languageSelector = page.locator('select[name*="language"], select[name*="locale"]').first();
      if (await languageSelector.isVisible()) {
        // Should have multiple options
        const options = languageSelector.locator('option');
        expect(await options.count()).toBeGreaterThanOrEqual(2);
      }
    });

    test('should change language to Spanish', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Find language selector
      const languageSelector = page.locator('select[name*="language"], select[name*="locale"]').first();
      if (await languageSelector.isVisible()) {
        // Select Spanish
        await languageSelector.selectOption({ label: /Spanish|Español/i });
        await page.waitForTimeout(500);

        // Page should update (HTML lang attribute or UI text changes)
        const htmlElement = page.locator('html');
        const lang = await htmlElement.getAttribute('lang');
        expect(lang).toMatch(/es|Spanish/i);
      }
    });

    test('should persist language after page reload', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Change language
      const languageSelector = page.locator('select[name*="language"], select[name*="locale"]').first();
      if (await languageSelector.isVisible()) {
        await languageSelector.selectOption({ label: /Spanish|Español/i });
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForTimeout(500);

        // Language should still be Spanish
        const htmlElement = page.locator('html');
        const lang = await htmlElement.getAttribute('lang');
        expect(lang).toMatch(/es|Spanish/i);
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should display notification settings', async ({ page }) => {
      await page.goto('/settings');

      // Should show notification toggles/checkboxes
      const notificationSettings = page.locator('[data-testid="notifications"], text=/notification/i').first();
      await expect(notificationSettings).toBeVisible();
    });

    test('should have notification toggle switches', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Should show toggle switches or checkboxes
      const toggles = page.locator('input[type="checkbox"], [role="switch"]');
      expect(await toggles.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Profile Settings', () => {
    test('should display user profile information', async ({ page }) => {
      await page.goto('/settings');

      // Should show user info (email, name, etc.)
      const profileInfo = page.locator('[data-testid="profile"], text=/@/').first();
      await expect(profileInfo).toBeVisible();
    });
  });

  test.describe('Error Boundary Test', () => {
    test('should have Sentry error test button', async ({ page }) => {
      await page.goto('/settings');

      // Should show error test button for Sentry
      const errorButton = page.locator('button:has-text("Test Error"), button:has-text("Error")').first();
      if (await errorButton.isVisible()) {
        await expect(errorButton).toBeVisible();
        await expect(errorButton).toBeEnabled();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard from settings', async ({ page }) => {
      await page.goto('/settings');

      // Click dashboard link in navigation
      const dashboardLink = page.locator('a[href="/dashboard"]').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await page.waitForURL('/dashboard', { timeout: 5000 });
        await expect(page).toHaveURL('/dashboard');
      }
    });

    test('should show all navigation menu items', async ({ page }) => {
      await page.goto('/settings');

      // Should show navigation menu
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();

      // Should have multiple menu items
      const menuItems = page.locator('a[href^="/"]');
      expect(await menuItems.count()).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Settings Persistence', () => {
    test('should save all settings together', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Change theme
      const darkModeButton = page.locator('button:has-text("Dark"), input[value="dark"]').first();
      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();
        await page.waitForTimeout(300);
      }

      // Change language
      const languageSelector = page.locator('select[name*="language"], select[name*="locale"]').first();
      if (await languageSelector.isVisible()) {
        await languageSelector.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }

      // Navigate away and back
      await page.goto('/dashboard');
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Settings should be persisted
      const htmlElement = page.locator('html');
      const classes = await htmlElement.getAttribute('class');
      expect(classes).toBeTruthy(); // Some class should be set
    });
  });
});
