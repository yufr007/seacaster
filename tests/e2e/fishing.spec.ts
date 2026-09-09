import { test, expect } from '@playwright/test';
test('guest fishing, collection and tackle work without a wallet', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open tackle', exact: true }).click();
  await page.getByRole('button', { name: 'Buy Premium Shrimp' }).click();
  await expect(page.getByText('60 coins', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('button', { name: 'Cast line', exact: true }).click();
  await page.getByRole('button', { name: 'Hook fish', exact: true }).click({ timeout: 10000 });
  const button = page.getByRole('button', { name: 'Hold to reel', exact: true });
  await expect(button).toBeVisible();
  const box = await button.boundingBox(); if (!box) throw new Error('Reel control is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  let holding = true; await page.mouse.down(); const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    // Sample atomically without locator auto-wait: a completed reel removes this meter.
    const sample = await page.evaluate(() => document.querySelector('[role="meter"][aria-label="Line tension"]')?.getAttribute('aria-valuenow') ?? null);
    if (sample === null) break;
    const tension = Number(sample);
    if (holding && tension > 68) { await page.mouse.up(); holding = false; }
    else if (!holding && tension < 38) { await page.mouse.down(); holding = true; }
    await page.waitForTimeout(80);
  }
  await page.mouse.up();
  await expect(page.getByRole('dialog', { name: 'Catch landed' })).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'test-results/catch-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Keep fishing' }).click();
  await page.getByRole('button', { name: 'Open collection' }).click();
  await expect(page.getByText('1 / 15 discovered')).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Open collection' }).click();
  await expect(page.getByText('1 / 15 discovered')).toBeVisible(); expect(errors).toEqual([]);
});
test('mobile layout keeps the game usable and does not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/fishing-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('checkbox', { name: 'Low-power mode' }).check();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
});
test('wallet tools load without pretending checkout is configured', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.getByRole('button', { name: 'Save with Base' }).click();
  await expect(page.getByRole('dialog', { name: 'Your Base connection' })).toBeVisible();
  await expect(page.getByText('Onchain checkout is not configured in this build. No payment will be requested.')).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeEnabled(); expect(errors).toEqual([]);
});
test('a missed bite can be retried without inventing a catch', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Cast line', exact: true }).click();
  await expect(page.getByText('The one that got away. Try another cast.')).toBeVisible({ timeout: 12000 });
  await page.getByRole('button', { name: 'Cast line', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel cast' }).click();
  await page.getByRole('button', { name: 'Open collection' }).click();
  await expect(page.getByText('0 / 15 discovered')).toBeVisible();
});
