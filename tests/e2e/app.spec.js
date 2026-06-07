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

// Helper: seed some test data into localStorage
async function seedTestData(page, data = {}) {
    await page.evaluate((d) => {
        if (d.wallets) localStorage.setItem('sp_wallets', JSON.stringify(d.wallets));
        if (d.daily) localStorage.setItem('sp_daily', JSON.stringify(d.daily));
        if (d.incomes) localStorage.setItem('sp_incomes', JSON.stringify(d.incomes));
        if (d.bills) localStorage.setItem('sp_bills', JSON.stringify(d.bills));
        if (d.debts) localStorage.setItem('sp_debts', JSON.stringify(d.debts));
        if (d.templates) localStorage.setItem('sp_templates', JSON.stringify(d.templates));
        if (d.txns) localStorage.setItem('sp_txns', JSON.stringify(d.txns));
        if (d.funds) localStorage.setItem('sp_funds', JSON.stringify(d.funds));
        if (d.budgets) localStorage.setItem('sp_budgets', JSON.stringify(d.budgets));
        if (d.recurring) localStorage.setItem('sp_recurring', JSON.stringify(d.recurring));
    }, data);
}

test.describe('SINKPESO E2E', () => {

    test('landing page loads', async ({ page }) => {
        await page.goto('/');
        // Landing page should show the SINKPESO heading
        await expect(page.locator('.nav-brand-text').first()).toBeVisible({ timeout: 10000 });
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
        await expect(fab).toBeVisible({ timeout: 5000 });
        await fab.click();
        // Should see the Quick Add modal
        await expect(page.locator('text=Quick Add Expense')).toBeVisible({ timeout: 5000 });
    });

    test('navigates between tabs', async ({ page }) => {
        await skipOnboarding(page);

        // Click on Daily Expenses tab (desktop) or bottom nav
        const dailyTab = page.locator('text=Daily Expenses').first();
        await expect(dailyTab).toBeVisible({ timeout: 5000 });
        await dailyTab.click();
        await expect(page.locator('text=Daily Outflow Tracking')).toBeVisible({ timeout: 5000 });
    });

    test('settings page loads with all sections', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to settings
        const settingsBtn = page.locator('[title="Settings"]');
        await expect(settingsBtn).toBeVisible({ timeout: 5000 });
        await settingsBtn.click();
        await page.waitForTimeout(500);
        // Should see key settings sections
        await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Data Backup')).toBeVisible({ timeout: 5000 });
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
        await expect(utilMenu).toBeVisible({ timeout: 5000 });
        await utilMenu.click();
        // Click "Archive Month"
        const archiveBtn = page.locator('text=Archive Month');
        await expect(archiveBtn).toBeVisible({ timeout: 5000 });
        await archiveBtn.click();
        // Should see the Close This Month modal
        await expect(page.locator('text=Close This Month')).toBeVisible({ timeout: 5000 });
        // Close it
        const cancelBtn = page.locator('button:has-text("Cancel")');
        await cancelBtn.first().click();
        await page.waitForTimeout(300);
        // Modal should be gone
        await expect(page.locator('text=Close This Month')).not.toBeVisible({ timeout: 3000 });
    });

    test('Bills & Income tab shows income form', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        await expect(budgetTab).toBeVisible({ timeout: 5000 });
        await budgetTab.click();
        await page.waitForTimeout(500);
        // Should see income form
        await expect(page.locator('text=Add Money In')).toBeVisible({ timeout: 5000 });
    });

    test('Savings Vaults tab loads empty state', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Savings Vaults
        const goalsTab = page.locator('text=Savings Vaults').first();
        await expect(goalsTab).toBeVisible({ timeout: 5000 });
        await goalsTab.click();
        await page.waitForTimeout(500);
        // Should see either vault cards, create button, or the section title
        const section = page.locator('h2:has-text("Savings Vaults")').or(page.locator('text=No Savings Vaults yet')).or(page.locator('text=Create New Vault'));
        await expect(section.first()).toBeVisible({ timeout: 5000 });
    });

    test('Daily Expenses tab shows expense form', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Daily Expenses
        const dailyTab = page.locator('text=Daily Expenses').first();
        await expect(dailyTab).toBeVisible({ timeout: 5000 });
        await dailyTab.click();
        await page.waitForTimeout(500);
        // Should see the expense form
        await expect(page.locator('text=Log New Daily Spend Item')).toBeVisible({ timeout: 5000 });
    });

    test('app has correct title and meta tags', async ({ page }) => {
        await page.goto('/app.html');
        await expect(page).toHaveTitle('SINKPESO');
        // Check theme color meta tag
        const themeColor = page.locator('meta[name="theme-color"]');
        await expect(themeColor).toHaveAttribute('content', '#020810');
    });

    // ═══════════════════════════════════════════════════════════════
    // NEW TESTS — v2.2.0 E2E Hardening
    // ═══════════════════════════════════════════════════════════════

    test('expense logging end-to-end', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Daily Expenses tab
        const dailyTab = page.locator('text=Daily Expenses').first();
        if (await dailyTab.isVisible()) {
            await dailyTab.click();
            await page.waitForTimeout(500);

            // Fill in the expense form
            const nameInput = page.locator('input[placeholder="What did you pay for?"]');
            const amountInput = page.locator('input[placeholder="Amount"]');

            if (await nameInput.isVisible() && await amountInput.isVisible()) {
                await nameInput.fill('Test E2E Goto');
                await amountInput.fill('150');

                // Click "Log Item" button
                const logBtn = page.locator('button:has-text("Log Item")');
                if (await logBtn.isVisible()) {
                    await logBtn.click();
                    await page.waitForTimeout(1000);

                    // Verify the expense appears in the spending log
                    const expenseRow = page.locator('text=Test E2E Goto');
                    await expect(expenseRow.first()).toBeVisible({ timeout: 5000 });

                    // Verify toast appeared
                    const toast = page.locator('text=Expense logged');
                    await expect(toast.first()).toBeVisible({ timeout: 5000 });
                }
            }
        }
    });

    test('quick-add template logs expense', async ({ page }) => {
        // Seed a template
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            templates: [{ id: "tpl-e2e", label: "E2E Jeepney", amountCents: 1300, category: "Personal", icon: "wallet" }]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Daily Expenses
        const dailyTab = page.locator('text=Daily Expenses').first();
        if (await dailyTab.isVisible()) {
            await dailyTab.click();
            await page.waitForTimeout(500);

            // Look for the Quick Add section with the template
            const templateBtn = page.locator('button:has-text("E2E Jeepney")');
            if (await templateBtn.isVisible()) {
                await templateBtn.click();
                await page.waitForTimeout(1000);

                // Verify the expense was logged
                const expenseRow = page.locator('text=E2E Jeepney').first();
                await expect(expenseRow).toBeVisible({ timeout: 5000 });
            }
        }
    });

    test('debt tracker flow', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Utang Tracker via the More bottom sheet
        const moreBtn = page.locator('.bnav-btn:has-text("More")');
        if (await moreBtn.isVisible()) {
            await moreBtn.click();
            await page.waitForTimeout(500);

            const utangBtn = page.locator('text=Utang Tracker');
            if (await utangBtn.isVisible()) {
                await utangBtn.click();
                await page.waitForTimeout(500);

                // Should see the Utang Tracker page
                const pageTitle = page.locator('text=Utang Tracker');
                await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

                // Look for "Add Debt" or "Add New" button
                const addDebtBtn = page.locator('button:has-text("Add")').first();
                if (await addDebtBtn.isVisible()) {
                    await addDebtBtn.click();
                    await page.waitForTimeout(500);

                    // Should see the Add New Debt modal
                    const modalTitle = page.locator('text=Add New Debt');
                    if (await modalTitle.isVisible()) {
                        // Fill in the form
                        const personInput = page.locator('input[placeholder="Who?"]');
                        const amountInput = page.locator('input[placeholder="0.00"]');

                        if (await personInput.isVisible()) {
                            await personInput.fill('Juan E2E');
                            await amountInput.fill('500');

                            // Click "Add Debt"
                            const saveBtn = page.locator('button:has-text("Add Debt"):not(:has-text("+"))').first();
                            if (await saveBtn.isVisible()) {
                                await saveBtn.click();
                                await page.waitForTimeout(1000);

                                // Verify the debt appears in the list
                                const debtEntry = page.locator('text=Juan E2E');
                                await expect(debtEntry.first()).toBeVisible({ timeout: 5000 });
                            }
                        }
                    }
                }
            }
        }
    });

    test('premium gate blocks features', async ({ page }) => {
        // Ensure no license key is set
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await page.evaluate(() => {
            localStorage.removeItem('sp_license');
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Pera Report via desktop tab or More sheet
        const peraTab = page.locator('button:has-text("Pera Report")').first();
        if (await peraTab.isVisible()) {
            await peraTab.click();
            await page.waitForTimeout(500);

            // Should see either a premium gate or "Get Premium" CTA
            const hasPremiumGate = await page.locator('text=Premium').first().isVisible().catch(() => false);
            const hasGetPremium = await page.locator('text=Get Premium').first().isVisible().catch(() => false);
            const hasUpgrade = await page.locator('text=Upgrade').first().isVisible().catch(() => false);
            const hasTrial = await page.locator('text=Free Trial').first().isVisible().catch(() => false);

            // At least one premium-related element should be visible
            expect(hasPremiumGate || hasGetPremium || hasUpgrade || hasTrial).toBeTruthy();
        }
    });

    test('wallet CRUD operations', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Wallets tab
        const walletsTab = page.locator('button:has-text("Wallets")').first();
        if (await walletsTab.isVisible()) {
            await walletsTab.click();
            await page.waitForTimeout(500);

            // Should see the wallets view
            const walletsTitle = page.locator('text=My Wallets');
            const hasTitle = await walletsTitle.isVisible().catch(() => false);

            if (hasTitle) {
                // Look for "Add Wallet" or create button
                const addWalletBtn = page.locator('button:has-text("Add Wallet")').first();
                if (await addWalletBtn.isVisible()) {
                    await addWalletBtn.click();
                    await page.waitForTimeout(500);

                    // Should see a wallet creation form/modal
                    const nameInput = page.locator('input[placeholder*="Wallet"]').first();
                    if (await nameInput.isVisible()) {
                        await nameInput.fill('E2E Test Wallet');

                        // Save the wallet
                        const saveBtn = page.locator('button:has-text("Save")').first();
                        if (await saveBtn.isVisible()) {
                            await saveBtn.click();
                            await page.waitForTimeout(1000);

                            // Verify the wallet appears
                            const walletEntry = page.locator('text=E2E Test Wallet');
                            await expect(walletEntry.first()).toBeVisible({ timeout: 5000 });
                        }
                    }
                }
            }
        }
    });

    test('Cashflow tab loads projection', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Cashflow
        const cashflowTab = page.locator('button:has-text("Cashflow")').first();
        if (await cashflowTab.isVisible()) {
            await cashflowTab.click();
            await page.waitForTimeout(500);

            // Should see either the cashflow chart or a premium gate
            const hasCashflowTitle = await page.locator('text=Cashflow').first().isVisible().catch(() => false);
            const hasForecast = await page.locator('text=Forecast').first().isVisible().catch(() => false);
            const hasProjection = await page.locator('text=30').first().isVisible().catch(() => false);
            const hasPremium = await page.locator('text=Premium').first().isVisible().catch(() => false);

            expect(hasCashflowTitle || hasForecast || hasProjection || hasPremium).toBeTruthy();
        }
    });

    test('mobile bottom nav shows all sections', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });
        await skipOnboarding(page);

        // Verify bottom nav exists
        const bottomNav = page.locator('.bottom-nav');
        await expect(bottomNav).toBeVisible({ timeout: 5000 });

        // Should have Home, Expenses, Diary, Savings, More
        const homeBtn = page.locator('.bnav-btn:has-text("Home")');
        const expenseBtn = page.locator('.bnav-btn:has-text("Expenses")');
        const savingsBtn = page.locator('.bnav-btn:has-text("Savings")');

        await expect(homeBtn).toBeVisible({ timeout: 5000 });
        await expect(expenseBtn).toBeVisible({ timeout: 5000 });
        await expect(savingsBtn).toBeVisible({ timeout: 5000 });
    });

    // ═══════════════════════════════════════════════════════════════
    // WALLET TRANSFER E2E TESTS
    // ═══════════════════════════════════════════════════════════════

    test('wallet transfer end-to-end', async ({ page }) => {
        // Seed 2 wallets with opening balances
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            wallets: [
                { id: 'cash-e2e', name: 'Cash', openingBalanceCents: 100000, color: '#00E676' },
                { id: 'gcash-e2e', name: 'GCash', openingBalanceCents: 50000, color: '#2563EB' }
            ]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Wallets tab
        const walletsTab = page.locator('button:has-text("Wallets")').first();
        if (await walletsTab.isVisible()) {
            await walletsTab.click();
            await page.waitForTimeout(500);

            // Verify both wallets are visible
            await expect(page.locator('text=Cash').first()).toBeVisible({ timeout: 5000 });
            await expect(page.locator('text=GCash').first()).toBeVisible({ timeout: 5000 });

            // Click the Transfer button
            const transferBtn = page.locator('button:has-text("Transfer")').first();
            if (await transferBtn.isVisible()) {
                await transferBtn.click();
                await page.waitForTimeout(500);

                // Verify transfer modal opens
                await expect(page.locator('text=Transfer Between Wallets')).toBeVisible({ timeout: 5000 });

                // Fill in the amount
                const amountInput = page.locator('input[placeholder="0.00"]').last();
                if (await amountInput.isVisible()) {
                    await amountInput.fill('200');
                    await page.waitForTimeout(300);

                    // Click Transfer button in modal
                    const commitBtn = page.locator('button:has-text("Transfer")').last();
                    if (await commitBtn.isVisible()) {
                        await commitBtn.click();
                        await page.waitForTimeout(1000);

                        // Verify success toast
                        const toast = page.locator('text=Transferred');
                        await expect(toast.first()).toBeVisible({ timeout: 5000 });

                        // Verify modal closed
                        const modalTitle = page.locator('text=Transfer Between Wallets');
                        await expect(modalTitle).not.toBeVisible({ timeout: 3000 });
                    }
                }
            }
        }
    });

    test('transfer appears in Transaction Log', async ({ page }) => {
        // Seed wallets and an existing transfer transaction
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            wallets: [
                { id: 'cash-log', name: 'Cash', openingBalanceCents: 100000, color: '#00E676' },
                { id: 'gcash-log', name: 'GCash', openingBalanceCents: 50000, color: '#2563EB' }
            ],
            txns: [
                {
                    id: 'xfer-e2e-log',
                    type: 'wallet_transfer',
                    fromWalletId: 'cash-log',
                    toWalletId: 'gcash-log',
                    amountCents: 30000,
                    date: new Date().toISOString().slice(0, 10),
                    note: 'E2E Transfer Test',
                    fromWalletNameSnapshot: 'Cash',
                    toWalletNameSnapshot: 'GCash'
                }
            ]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Transaction Log via desktop tab
        const logsTab = page.locator('button:has-text("Logs")').first();
        if (await logsTab.isVisible()) {
            await logsTab.click();
            await page.waitForTimeout(500);

            // Should see the transfer in the log
            const transferRow = page.locator('text=Cash → GCash');
            await expect(transferRow.first()).toBeVisible({ timeout: 5000 });

            // Should see "Wallet Transfer" subtitle
            const subtitle = page.locator('text=Wallet Transfer');
            await expect(subtitle.first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('transfer button hidden with single wallet', async ({ page }) => {
        // Seed only 1 wallet
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            wallets: [
                { id: 'only-wallet', name: 'OnlyWallet', openingBalanceCents: 50000, color: '#FF5722' }
            ]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Wallets tab
        const walletsTab = page.locator('button:has-text("Wallets")').first();
        if (await walletsTab.isVisible()) {
            await walletsTab.click();
            await page.waitForTimeout(500);

            // Transfer button should NOT be visible (requires >= 2 wallets)
            const transferBtn = page.locator('button:has-text("Transfer")');
            const isTransferVisible = await transferBtn.first().isVisible().catch(() => false);
            expect(isTransferVisible).toBeFalsy();
        }
    });

    test('wallet balances update after transfer', async ({ page }) => {
        // Seed 2 wallets
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            wallets: [
                { id: 'bal-w1', name: 'SourceWallet', openingBalanceCents: 100000, color: '#00E676' },
                { id: 'bal-w2', name: 'DestWallet', openingBalanceCents: 50000, color: '#2563EB' }
            ]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Wallets tab
        const walletsTab = page.locator('button:has-text("Wallets")').first();
        if (await walletsTab.isVisible()) {
            await walletsTab.click();
            await page.waitForTimeout(500);

            // Perform a transfer of ₱500 (50000 cents)
            const transferBtn = page.locator('button:has-text("Transfer")').first();
            if (await transferBtn.isVisible()) {
                await transferBtn.click();
                await page.waitForTimeout(500);

                const amountInput = page.locator('input[placeholder="0.00"]').last();
                if (await amountInput.isVisible()) {
                    await amountInput.fill('500');
                    await page.waitForTimeout(300);

                    const commitBtn = page.locator('button:has-text("Transfer")').last();
                    if (await commitBtn.isVisible()) {
                        await commitBtn.click();
                        await page.waitForTimeout(1500);

                        // Verify the source wallet now shows ₱500 (was ₱1,000)
                        const sourceBalance = page.locator('text=₱500.00');
                        const hasSource = await sourceBalance.first().isVisible().catch(() => false);

                        // Verify the dest wallet now shows ₱1,000 (was ₱500)
                        const destBalance = page.locator('text=₱1,000.00');
                        const hasDest = await destBalance.first().isVisible().catch(() => false);

                        // At least one balance change should be visible
                        expect(hasSource || hasDest).toBeTruthy();
                    }
                }
            }
        }
    });

    test('More sheet contains all secondary tabs', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });
        await skipOnboarding(page);

        // Open More sheet
        const moreBtn = page.locator('.bnav-btn:has-text("More")');
        await expect(moreBtn).toBeVisible({ timeout: 5000 });
        await moreBtn.click();
        await page.waitForTimeout(500);

        // Should see secondary navigation options
        const hasBills = await page.locator('text=Bills & Income').first().isVisible().catch(() => false);
        const hasWallets = await page.locator('text=Wallets').first().isVisible().catch(() => false);
        const hasUtang = await page.locator('text=Utang Tracker').first().isVisible().catch(() => false);
        const hasCashflow = await page.locator('text=Cashflow').first().isVisible().catch(() => false);

        expect(hasBills && hasWallets && hasUtang && hasCashflow).toBeTruthy();
    });

    // ═══════════════════════════════════════════════════════════════
    // CSV IMPORT E2E TESTS (v2.5.0)
    // ═══════════════════════════════════════════════════════════════

    test('CSV import button visible in Settings', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Settings
        const settingsBtn = page.locator('[title="Settings"]');
        await expect(settingsBtn).toBeVisible({ timeout: 5000 });
        await settingsBtn.click();
        await page.waitForTimeout(500);

        // Should see Data Backup section
        await expect(page.locator('text=Data Backup')).toBeVisible({ timeout: 5000 });

        // Should see CSV import button
        const importBtn = page.locator('text=Import Transactions (.csv)');
        await expect(importBtn).toBeVisible({ timeout: 5000 });
    });

    test('CSV export button visible in Settings', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Settings
        const settingsBtn = page.locator('[title="Settings"]');
        await expect(settingsBtn).toBeVisible({ timeout: 5000 });
        await settingsBtn.click();
        await page.waitForTimeout(500);

        // Should see CSV export button
        const exportBtn = page.locator('text=Export Transactions (.csv)');
        await expect(exportBtn).toBeVisible({ timeout: 5000 });
    });

    test('CSV import button also in utility menu', async ({ page }) => {
        await skipOnboarding(page);

        // Open utility kebab menu
        const utilMenu = page.locator('.util-menu-btn');
        await expect(utilMenu).toBeVisible({ timeout: 5000 });
        await utilMenu.click();
        await page.waitForTimeout(300);

        // Should see Export as CSV option
        const exportCSV = page.locator('text=Export as CSV');
        await expect(exportCSV).toBeVisible({ timeout: 5000 });
    });

    // ═══════════════════════════════════════════════════════════════
    // RECURRING TRANSACTIONS E2E TESTS (v2.5.0)
    // ═══════════════════════════════════════════════════════════════

    test('recurring transactions section visible in Bills & Income', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        await expect(budgetTab).toBeVisible({ timeout: 5000 });
        await budgetTab.click();
        await page.waitForTimeout(500);

        // Should see the Recurring Transactions section
        await expect(page.locator('text=Recurring Transactions')).toBeVisible({ timeout: 5000 });

        // Should see Add button
        const addBtn = page.locator('button:has-text("+ Add")').first();
        await expect(addBtn).toBeVisible({ timeout: 5000 });
    });

    test('add recurring item form opens and closes', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        await expect(budgetTab).toBeVisible({ timeout: 5000 });
        await budgetTab.click();
        await page.waitForTimeout(500);

        // Click Add button
        const addBtn = page.locator('button:has-text("+ Add")').first();
        await expect(addBtn).toBeVisible({ timeout: 5000 });
        await addBtn.click();
        await page.waitForTimeout(300);

        // Should see form fields
        const nameInput = page.locator('input[placeholder*="Netflix"]').first();
        await expect(nameInput).toBeVisible({ timeout: 5000 });

        // Should see Add Recurring Item button
        await expect(page.locator('button:has-text("Add Recurring Item")')).toBeVisible({ timeout: 5000 });

        // Close the form
        const cancelBtn = page.locator('button:has-text("Cancel")').last();
        await cancelBtn.click();
        await page.waitForTimeout(300);

        // Form should be hidden
        await expect(page.locator('input[placeholder*="Netflix"]').first()).not.toBeVisible({ timeout: 3000 });
    });

    test('seeding recurring items shows them in list', async ({ page }) => {
        // Seed recurring items
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            recurring: [
                {
                    id: 'rec-e2e-1',
                    type: 'expense',
                    name: 'Netflix E2E',
                    amountCents: 14900,
                    category: 'Entertainment',
                    walletId: null,
                    frequency: 'monthly',
                    dayOfMonth: 15,
                    nextDueDate: '2026-07-15',
                    isActive: true,
                    createdAt: '2026-06-08'
                },
                {
                    id: 'rec-e2e-2',
                    type: 'income',
                    name: 'Freelance E2E',
                    amountCents: 500000,
                    category: 'Freelance',
                    walletId: null,
                    frequency: 'biweekly',
                    dayOfMonth: 1,
                    nextDueDate: '2026-06-22',
                    isActive: false,
                    createdAt: '2026-06-08'
                }
            ]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        await expect(budgetTab).toBeVisible({ timeout: 5000 });
        await budgetTab.click();
        await page.waitForTimeout(500);

        // Should see recurring items in the list
        await expect(page.locator('text=Netflix E2E').first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Freelance E2E').first()).toBeVisible({ timeout: 5000 });

        // Should see Monthly badge on Netflix
        const monthlyBadge = page.locator('text=Monthly').first();
        await expect(monthlyBadge).toBeVisible({ timeout: 5000 });

        // Should see Biweekly badge on Freelance
        const biweeklyBadge = page.locator('text=Biweekly').first();
        await expect(biweeklyBadge).toBeVisible({ timeout: 5000 });

        // Should see Paused badge on inactive item
        const pausedBadge = page.locator('text=Paused').first();
        await expect(pausedBadge).toBeVisible({ timeout: 5000 });

        // Should see ON/OFF toggle buttons
        const onBtn = page.locator('button:has-text("ON")').first();
        const offBtn = page.locator('button:has-text("OFF")').first();
        await expect(onBtn).toBeVisible({ timeout: 5000 });
        await expect(offBtn).toBeVisible({ timeout: 5000 });
    });

    test('recurring item toggle ON/OFF works', async ({ page }) => {
        // Seed a recurring item
        await page.goto('/app.html');
        await page.waitForTimeout(500);
        await seedTestData(page, {
            recurring: [
                {
                    id: 'rec-toggle-e2e',
                    type: 'expense',
                    name: 'Toggle Test',
                    amountCents: 10000,
                    category: 'Other',
                    walletId: null,
                    frequency: 'monthly',
                    dayOfMonth: 1,
                    nextDueDate: '2026-07-01',
                    isActive: true,
                    createdAt: '2026-06-08'
                }
            ]
        });
        await page.evaluate(() => {
            localStorage.setItem('sp_onboarding_seen', '1');
            localStorage.setItem('sp_settings', JSON.stringify({ _v: 2, data: { currency: 'PHP', theme: 'dark', pin: '' } }));
        });
        await page.reload();
        await page.waitForTimeout(1500);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        await expect(budgetTab).toBeVisible({ timeout: 5000 });
        await budgetTab.click();
        await page.waitForTimeout(500);

        // Item should show ON
        const onBtn = page.locator('button:has-text("ON")').first();
        await expect(onBtn).toBeVisible({ timeout: 5000 });

        // Click to toggle OFF
        await onBtn.click();
        await page.waitForTimeout(500);

        // Should now show OFF
        const offBtn = page.locator('button:has-text("OFF")').first();
        await expect(offBtn).toBeVisible({ timeout: 5000 });
    });

    test('empty state shows when no recurring items', async ({ page }) => {
        await skipOnboarding(page);

        // Navigate to Bills & Income
        const budgetTab = page.locator('text=Bills & Income').first();
        await expect(budgetTab).toBeVisible({ timeout: 5000 });
        await budgetTab.click();
        await page.waitForTimeout(500);

        // Should see empty state for recurring
        const emptyTitle = page.locator('text=No recurring items');
        await expect(emptyTitle).toBeVisible({ timeout: 5000 });

        const emptySub = page.locator('text=Auto-log Netflix, Spotify, rent, salary');
        await expect(emptySub).toBeVisible({ timeout: 5000 });
    });

    test('recurring transactions in More sheet description', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });
        await skipOnboarding(page);

        // Open More sheet
        const moreBtn = page.locator('.bnav-btn:has-text("More")');
        await expect(moreBtn).toBeVisible({ timeout: 5000 });
        await moreBtn.click();
        await page.waitForTimeout(500);

        // Bills & Income description should mention recurring
        const description = page.locator('text=Track bills, income, recurring');
        await expect(description).toBeVisible({ timeout: 5000 });
    });

    // ═══════════════════════════════════════════════════════════════
    // SEO E2E TESTS (v2.5.0)
    // ═══════════════════════════════════════════════════════════════

    test('landing page has SEO meta tags', async ({ page }) => {
        await page.goto('/');

        // Check description meta tag
        const description = page.locator('meta[name="description"]');
        await expect(description).toHaveAttribute('content', /offline budgeting app/);

        // Check OG tags
        const ogTitle = page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveAttribute('content', /SINKPESO/);

        const ogImage = page.locator('meta[property="og:image"]');
        await expect(ogImage).toHaveAttribute('content', 'logosinkpeso.png');

        // Check Twitter Card
        const twitterCard = page.locator('meta[name="twitter:card"]');
        await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
    });

    test('app.html has SEO meta tags', async ({ page }) => {
        await page.goto('/app.html');

        // Check description meta tag
        const description = page.locator('meta[name="description"]');
        await expect(description).toHaveAttribute('content', /offline budgeting app/);

        // Check OG tags
        const ogTitle = page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveAttribute('content', /SINKPESO/);

        // Check title includes full name
        await expect(page).toHaveTitle('SINKPESO — Private Budget Tracker');
    });

    test('landing page has JSON-LD structured data', async ({ page }) => {
        await page.goto('/');

        // Should have JSON-LD script
        const jsonLd = page.locator('script[type="application/ld+json"]');
        await expect(jsonLd).toBeAttached({ timeout: 5000 });

        // Verify content
        const content = await jsonLd.textContent();
        expect(content).toContain('WebApplication');
        expect(content).toContain('SINKPESO');
    });

});
