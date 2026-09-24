import { defineConfig } from '@playwright/test';
export default defineConfig({
  // Includes a cold Chromium process, GLB shader compilation and software screenshots.
  // Bite/reel deadlines in the gameplay tests are deliberately unchanged.
  testDir: 'tests/e2e', timeout: 90000, retries: 0, workers: 1,
  maxFailures: process.env.CI ? 1 : undefined,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, viewport: { width: 1280, height: 800 }, screenshot: 'only-on-failure', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
