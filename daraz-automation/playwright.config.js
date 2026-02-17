// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Directory containing test files
  testDir: './tests',

  // Maximum time one test can run (ms)
  timeout: 60000,

  // Expect timeout for assertions (ms)
  expect: {
    timeout: 10000,
  },

  // Run tests in parallel
  fullyParallel: false,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Global settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'https://www.daraz.pk',

    // Browser viewport
    viewport: { width: 1366, height: 768 },

    // Headless mode (set to false for debugging)
    headless: true,

    // Slow down actions by this amount of ms (helpful for debugging)
    slowMo: 0,

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Timeout for each action (ms)
    actionTimeout: 15000,

    // Timeout for navigation (ms)
    navigationTimeout: 30000,
  },

  // Projects define which browsers to test in
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to run on Firefox or WebKit
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
