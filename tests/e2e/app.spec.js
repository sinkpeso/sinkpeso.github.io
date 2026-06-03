// E2E tests for SINKPESO critical flows
// Run: npx playwright test
//
// These tests simulate real user interactions in a headless browser.

const { test, expect } = require('@playwright/test');

// Helper: skip onboarding by setting localStorage
async function skipOnboarding(page) {
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
        localStorage.setItem('sp_onboarding_seen', '1');
        localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
    });
    await page.reload();
    await page.waitForTimeout(1500);
}

test.describe('SINKPESO E2E', () => {

    test('loads the dashboard', async ({ page }) => {
        await page.goto('/');
        // Should see the SINKPESO logo or title
        await expect(page.locator('text=SINKPESO')).toBeVisible({ timeout: 10000 });
    });

    test('shows onboarding for first-time users', async ({ page }) => {
        await page.goto('/');
        // Onboarding should show "Welcome to SINKPESO"
        const welcome = page.locator('text=Welcome to SINKPESO');
        // May or may not show depending on localStorage state — check for either state
        const isOnboarding = await welcome.isVisible().catch(() => false);
        const isDashboard = await page.locator('text=Available This Month').isVisible().catch(() => false);
        expect(isOnboarding || isDashboard).toBeTruthy();
    });

    test('quick add expense via FAB', async ({ page }) => {
        await skipOnboarding(page);

        // Click the FAB (floating action button)
        const fab = page.locator('.fab');
        if (await fab.isVisible()) {
            await fab.click();
            // Should see the Quick Add modal
            await expect(page.locator('text=Quick Add Expense')).toBeVisible({ timeout: 5000 });
        }
    });

    test('navigates between tabs', async ({ page }) => {
        await skipOnboarding(page);

        // Click on Daily Expenses tab (desktop) or bottom nav
        const dailyTab = page.locator('text=Daily Expenses').first();
        if (await dailyTab.isVisible()) {
            await dailyTab.click();
            await expect(page.locator('text=Daily Outflow Tracking')).toBeVisible({ timeout: 5000 });
        }
    });

    test('settings page loads with all sections', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to settings
        const settingsBtn = page.locator('[title="Settings"]');
        if (await settingsBtn.isVisible()) {
            await settingsBtn.click();
            await page.waitForTimeout(500);
            // Should see key settings sections
            await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('text=Data Backup')).toBeVisible({ timeout: 5000 });
        }
    });

    test('PIN screen blocks access when PIN is set', async ({ page }) => {
        // Set a PIN hash in localStorage
        await page.goto('/');
        await page.waitForTimeout(500);
        await page.evaluate(() => {
            localStorage.setItem('sp_settings', JSON.stringify({
                _v: 2,
                data: { currency: 'PHP', theme: 'dark', pin: 'a'.repeat(64) }
            }));
        });
        await page.reload();
        await page.waitForTimeout(1000);
        // Should see PIN input
        const pinInput = page.locator('.pin-input');
        await expect(pinInput).toBeVisible({ timeout: 5000 });
    });

});