import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Two dev servers, one per catalogue source.
 *
 * The bundled-catalogue server is what the app does by default: no network, no key,
 * so those specs assert on real rendered data instead of on a mock. The jsonmock
 * server exercises the HTTP client, with the network stubbed by `page.route` so the
 * suite never depends on a third-party endpoint being up.
 *
 * See https://playwright.dev/docs/test-configuration.
 */
const FIXTURE_PORT = 7213
const JSONMOCK_PORT = 7214

const ACTION_TIMEOUT_MS = 10_000
const EXPECT_TIMEOUT_MS = 5_000
const TEST_TIMEOUT_MS = 30_000

export default defineConfig({
  testDir: './e2e',
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    actionTimeout: ACTION_TIMEOUT_MS,
    trace: 'on-first-retry',
    // Headless everywhere: a suite that pops browser windows cannot run on a server.
    headless: true,
  },

  projects: [
    {
      name: 'catalogue',
      testMatch: /(search|detail)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${FIXTURE_PORT}` },
    },
    {
      name: 'jsonmock',
      testMatch: /jsonmock-source\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${JSONMOCK_PORT}` },
    },
  ],

  webServer: [
    {
      command: `vite --port ${FIXTURE_PORT} --strictPort`,
      port: FIXTURE_PORT,
      reuseExistingServer: !process.env.CI,
      env: { VITE_MOVIES_PROVIDER: 'fixture' },
    },
    {
      command: `vite --port ${JSONMOCK_PORT} --strictPort`,
      port: JSONMOCK_PORT,
      reuseExistingServer: !process.env.CI,
      env: { VITE_MOVIES_PROVIDER: 'jsonmock' },
    },
  ],
})
