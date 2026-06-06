// generate-screenshots.js — Generate app screenshots for SINKPESO landing page
//
// Usage:
//   npm install puppeteer
//   node screenshots/generate-screenshots.js
//
// Requires: Puppeteer (headless Chrome)
// Generates 8 screenshots: desktop + mobile views of key app screens

const puppeteer = require('puppeteer');
const path = require('path');

const APP_URL = 'https://sinkpeso.github.io/app.html';
const SCREENSHOT_DIR = __dirname;

// Sample data to inject into localStorage so the app looks populated
const SAMPLE_DATA = {
    // Core state key used by the app
    'sinkpeso_state': JSON.stringify({
        wallets: [
            { id: 'w1', name: 'Cash', balance: 5200, icon: 'cash', color: '#00E676' },
            { id: 'w2', name: 'GCash', balance: 8450, icon: 'gcash', color: '#007DFE' },
            { id: 'w3', name: 'BDO Savings', balance: 45000, icon: 'bank', color: '#FBBF24' },
        ],
        transactions: [
            { id: 't1', type: 'expense', amount: 285, category: 'Food', note: 'Jollibee lunch', walletId: 'w1', date: '2026-06-06' },
            { id: 't2', type: 'expense', amount: 150, category: 'Transport', note: 'Grab to Makati', walletId: 'w2', date: '2026-06-06' },
            { id: 't3', type: 'expense', amount: 1250, category: 'Groceries', note: 'SM Supermarket weekly', walletId: 'w2', date: '2026-06-05' },
            { id: 't4', type: 'expense', amount: 180, category: 'Food', note: 'Coffee with team', walletId: 'w1', date: '2026-06-05' },
            { id: 't5', type: 'income', amount: 32000, category: 'Salary', note: 'June salary', walletId: 'w3', date: '2026-06-01' },
            { id: 't6', type: 'expense', amount: 8000, category: 'Bills', note: 'Rent', walletId: 'w3', date: '2026-06-05' },
            { id: 't7', type: 'expense', amount: 2800, category: 'Bills', note: 'Meralco', walletId: 'w2', date: '2026-06-15' },
            { id: 't8', type: 'expense', amount: 1699, category: 'Bills', note: 'PLDT', walletId: 'w2', date: '2026-06-10' },
            { id: 't9', type: 'expense', amount: 340, category: 'Transport', note: 'Grab to airport', walletId: 'w1', date: '2026-06-04' },
            { id: 't10', type: 'expense', amount: 450, category: 'Food', note: 'Dinner at Max\'s', walletId: 'w1', date: '2026-06-03' },
        ],
        bills: [
            { id: 'b1', name: 'Meralco', amount: 2800, dueDay: 15, paid: true },
            { id: 'b2', name: 'PLDT', amount: 1699, dueDay: 10, paid: true },
            { id: 'b3', name: 'Rent', amount: 8000, dueDay: 5, paid: true },
            { id: 'b4', name: 'Globe Postpaid', amount: 1499, dueDay: 20, paid: false },
        ],
        vaults: [
            { id: 'v1', name: 'Emergency Fund', target: 20000, saved: 15000, icon: 'shield' },
            { id: 'v2', name: 'Japan Trip', target: 20000, saved: 8000, icon: 'plane' },
            { id: 'v3', name: 'New Laptop', target: 50000, saved: 12500, icon: 'laptop' },
        ],
        activeTab: 'dashboard',
        premium: true,
        onboardingDone: true,
    })
};

// Screenshots to capture
const SCREENSHOTS = [
    // Desktop screenshots (1280x720)
    { name: 'dashboard-desktop', tab: 'dashboard', width: 1280, height: 720, mobile: false },
    { name: 'expenses-desktop', tab: 'expenses', width: 1280, height: 720, mobile: false },
    { name: 'bills-desktop', tab: 'bills', width: 1280, height: 720, mobile: false },
    { name: 'savings-desktop', tab: 'savings', width: 1280, height: 720, mobile: false },
    { name: 'diary-desktop', tab: 'photo-diary', width: 1280, height: 720, mobile: false },
    // Mobile screenshots (390x844 - iPhone 14)
    { name: 'dashboard-mobile', tab: 'dashboard', width: 390, height: 844, mobile: true },
    { name: 'expenses-mobile', tab: 'expenses', width: 390, height: 844, mobile: true },
    { name: 'diary-mobile', tab: 'photo-diary', width: 390, height: 844, mobile: true },
];

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const shot of SCREENSHOTS) {
        console.log(`Generating ${shot.name}...`);
        const page = await browser.newPage();
        await page.setViewport({ width: shot.width, height: shot.height });

        // Inject sample data before the page loads
        await page.evaluateOnNewDocument((data) => {
            for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, value);
            }
        }, SAMPLE_DATA);

        await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 20000 });

        // Wait for app to render
        await page.waitForSelector('.bn-wrap, .premium-panel, .page-wrap', { timeout: 10000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        // Dismiss onboarding if visible
        const onboardingBtn = await page.$('button[aria-label="Skip tutorial"]');
        if (onboardingBtn) await onboardingBtn.click();
        await new Promise(r => setTimeout(r, 500));

        // Click the appropriate tab to navigate
        if (shot.tab !== 'dashboard') {
            try {
                // Try clicking the nav button for this tab
                const navBtns = await page.$$('.nav-btn, .bnav-btn');
                for (const btn of navBtns) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text && text.toLowerCase().includes(shot.tab.replace('-', ' ').replace('photo ', '').replace('diary', 'diary'))) {
                        await btn.click();
                        await new Promise(r => setTimeout(r, 800));
                        break;
                    }
                }
            } catch (e) {
                console.log(`  ⚠ Could not navigate to ${shot.tab}, capturing current view`);
            }
        }

        // Take the screenshot
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `${shot.name}.png`),
            fullPage: false
        });
        console.log(`  ✓ ${shot.name}.png (${shot.width}x${shot.height})`);
        await page.close();
    }

    await browser.close();
    console.log(`\nDone! ${SCREENSHOTS.length} screenshots saved to screenshots/`);
})();