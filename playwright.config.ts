import { defineConfig, devices } from '@playwright/test';

// The browser check for the built site. By default it serves out/ on
// localhost with tests/browser/serve.mjs, so run `npm run build` first.
// BROWSER_CHECK_BASE_URL points it at a deployed copy instead (read only).
// BROWSER_CHECK_SHOTS names the directory for the full-page screenshots.
const port = 4173;
const external = process.env.BROWSER_CHECK_BASE_URL;

export default defineConfig({
  testDir: 'tests/browser',
  // One browser, one page at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120_000,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: external ?? `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  webServer: external
    ? undefined
    : {
        command: `node tests/browser/serve.mjs out ${port}`,
        url: `http://127.0.0.1:${port}/`,
        reuseExistingServer: false,
        stdout: 'ignore',
      },
});
