import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://127.0.0.1:4178/offline-check/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 15 Pro Max'], defaultBrowserType: 'webkit' },
    },
  ],
  webServer: {
    command: 'npx tsx tests/server.ts',
    url: 'http://127.0.0.1:4178/offline-check/',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
