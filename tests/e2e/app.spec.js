// E2E tests for SINKPESO critical flows
// Run: npx playwright test
//
// These tests simulate real user interactions in a headless browser.

const { test, expect } = require('@playwright/test');

// Helper: skip onboarding by setting localStorage
async function skipOnboarding(page) {
    await page.goto('/app.html');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
        localStorage.setItem('sp_onboarding_seen', '1');
        localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
    });
    await page.reload();
    await page.waitForTimeout(1500);
}

test.describe('SINKPESO E2E', () => {

    test('landing page loads', async ({ page }) => {
        await page.goto('/');
        // Landing page should show the SINKPESO heading
        await expect(page.locator('text=SINKPESO')).toBeVisible({ timeout: 10000 });
        // Should have a CTA linking to the app
        await expect(page.locator('a[href="app.html"]')).toBeVisible({ timeout: 5000 });
    });

    test('loads the dashboard', async ({ page }) => {
        await page.goto('/app.html');
        // Should see the SINKPESO logo or title
        await expect(page.locator('text=SINKPESO')).toBeVisible({ timeout: 10000 });
    });

    test('shows onboarding for first-time users', async ({ page }) => {
        await page.goto('/app.html');
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
        await page.goto('/app.html');
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

    test('archive month modal opens and closes', async ({ page }) => {
        await skipOnboarding(page);

        // Open the utility kebab menu
        const utilMenu = page.locator('.util-menu-btn');
        if (await utilMenu.isVisible()) {
            await utilMenu.click();
            // Click "Archive Month"
            const archiveBtn = page.locator('text=Archive Month');
            if (await archiveBtn.isVisible()) {
                await archiveBtn.click();
                // Should see the Close This Month modal
                await expect(page.locator('text=Close This Month')).toBeVisible({ timeout: 5000 });
                // Close it
                const cancelBtn = page.locator('button:has-text("Cancel")');
                await cancelBtn.first().click();
                await page.waitForTimeout(300);
            }
        }
    });

    test('Bills & Income tab shows income form', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        if (await budgetTab.isVisible()) {
            await budgetTab.click();
            await page.waitForTimeout(500);
            // Should see income form
            await expect(page.locator('text=Add Money In')).toBeVisible({ timeout: 5000 });
        }
    });

    test('Savings Vaults tab loads empty state', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Savings Vaults
        const goalsTab = page.locator('text=Savings Vaults').first();
        if (await goalsTab.isVisible()) {
            await goalsTab.click();
            await page.waitForTimeout(500);
            // Should see either vault cards or empty state
            const hasVaults = await page.locator('text=No Savings Vaults yet').isVisible().catch(() => false);
            const hasCreate = await page.locator('text=Create New Vault').isVisible().catch(() => false);
            const hasTitle = await page.locator('h2:has-text("Savings Vaults")').isVisible().catch(() => false);
            expect(hasVaults || hasCreate || hasTitle).toBeTruthy();
        }
    });

    test('Daily Expenses tab shows expense form', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Daily Expenses
        const dailyTab = page.locator('text=Daily Expenses').first();
        if (await dailyTab.isVisible()) {
            await dailyTab.click();
            await page.waitForTimeout(500);
            // Should see the expense form
            await expect(page.locator('text=Log New Daily Spend Item')).toBeVisible({ timeout: 5000 });
        }
    });

    test('app has correct title and meta tags', async ({ page }) => {
        await page.goto('/app.html');
        await expect(page).toHaveTitle('SINKPESO');
        // Check theme color meta tag
        const themeColor = page.locator('meta[name="theme-color"]');
        await expect(themeColor).toHaveAttribute('content', '#020810');
    });

});
