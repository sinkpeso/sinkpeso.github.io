// playwright.config.js — Playwright E2E test configuration for SINKPESO
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    retries: 0,
    use: {
        headless: true,
        viewport: { width: 390, height: 844 }, // iPhone 14 size
        actionTimeout: 10000,
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    webServer: {
        command: 'node serve.js',
        port: 3000,
        reuseExistingServer: true,
        timeout: 10000,
    },
});