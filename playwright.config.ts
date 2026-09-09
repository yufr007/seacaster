import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e', timeout: 45000, retries: 0, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, viewport: { width: 1280, height: 800 }, screenshot: 'only-on-failure', trace: 'retain-on-failure', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
