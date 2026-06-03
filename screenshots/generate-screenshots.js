// generate-screenshots.js — Generate Play Store screenshots for SINKPESO
//
// Usage:
//   npm install puppeteer
//   node screenshots/generate-screenshots.js
//
// Requires: Puppeteer (headless Chrome)

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });

    // Desktop screenshot (1280x720)
    console.log('Generating desktop screenshot...');
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1280, height: 720 });
    await desktopPage.goto('https://sinkpeso.github.io', { waitUntil: 'networkidle0', timeout: 15000 });
    // Wait for app to load (bypass onboarding if shown)
    await desktopPage.waitForSelector('.bn-wrap', { timeout: 10000 }).catch(() => {});
    // Dismiss onboarding if visible
    const onboardingBtn = await desktopPage.$('button[aria-label="Skip tutorial"]');
    if (onboardingBtn) await onboardingBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await desktopPage.screenshot({ path: path.join(__dirname, 'dashboard.png'), fullPage: false });
    console.log('  ✓ dashboard.png (1280x720)');
    await desktopPage.close();

    // Mobile screenshot (390x844 - iPhone 14)
    console.log('Generating mobile screenshot...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844 });
    await mobilePage.goto('https://sinkpeso.github.io', { waitUntil: 'networkidle0', timeout: 15000 });
    await mobilePage.waitForSelector('.bn-wrap', { timeout: 10000 }).catch(() => {});
    const mobileOnb = await mobilePage.$('button[aria-label="Skip tutorial"]');
    if (mobileOnb) await mobileOnb.click();
    await new Promise(r => setTimeout(r, 1000));
    await mobilePage.screenshot({ path: path.join(__dirname, 'mobile-dashboard.png'), fullPage: false });
    console.log('  ✓ mobile-dashboard.png (390x844)');
    await mobilePage.close();

    await browser.close();
    console.log('\nDone! Screenshots saved to screenshots/');
})();