import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests.
 *
 * These cover what vitest structurally cannot: real browser rendering, the
 * browser's own language list and layout. They run against the Vite dev
 * server's backend-free fixtures (`?fixture=settings` and friends), so no Oink
 * service is needed.
 */
export default defineConfig({
  testDir: './e2e',
  // The suite drives one shared dev server, so tests must not race each other over its state.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',

  use: {
    baseURL: 'http://127.0.0.1:1440',
    headless: true,
    video: 'on',
    screenshot: 'on',
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    viewport: { width: 1040, height: 680 },
  },

  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1040, height: 680 },
        // The installed browser rather than a Playwright download: test the browser users actually run.
        channel: 'chrome',
      },
    },
  ],

  webServer: {
    command: 'npm run dev -w apps/oink',
    url: 'http://127.0.0.1:1440',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
