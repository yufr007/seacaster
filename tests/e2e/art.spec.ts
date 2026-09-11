import { test, expect } from '@playwright/test';
import { enterFishing, touchSwipe, setTestTime } from './support';
import { newProfile } from '../../game/engine';

test.describe.configure({ mode: 'serial', timeout: 120000 });

async function seedPlatform(page: import('@playwright/test').Page, platform: string) {
  await page.addInitScript(({ profile, selected }) => localStorage.setItem('seacaster:guest:v2', JSON.stringify({ ...profile, platform: selected })), {
    profile: { ...newProfile(), totalCatches: 30, catches: { f1: { count: 30, best: .2 } } },
    selected: platform,
  });
}

for (const platform of ['pier', 'river', 'boat', 'yacht']) {
  test(`authored ${platform} loads the production GLB on mobile`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width: 390, height: 844 });
    await setTestTime(page, '2026-09-10T12:00:00Z');
    await seedPlatform(page, platform);
    const asset = page.waitForResponse(response => response.url().endsWith('/models/sculpted/harbour-kit.glb'));
    await page.goto('/');
    await enterFishing(page);
    expect((await asset).ok()).toBe(true);
    await expect(page.getByTestId('living-world')).toHaveAttribute('data-art-ready', 'true');
    await page.waitForTimeout(650);
    await page.screenshot({ path: `test-results/art-${platform}-mobile.png` });
    expect(errors).toEqual([]);
  });
}

test('authored pier keeps bait selection and touch casting attached to the rendered scene', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTestTime(page, '2026-09-10T12:00:00Z');
  await seedPlatform(page, 'pier');
  await page.goto('/');
  await enterFishing(page);
  await expect(page.getByTestId('living-world')).toHaveAttribute('data-art-ready', 'true');
  await page.getByRole('button', { name: 'Open bait box', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A little something for the fish' })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await touchSwipe(page, [225, 495], [240, 315]);
  // This assertion is the interaction gate. Do not perform cleanup after the screenshot:
  // a software-rendered PNG capture can outlive the intentionally short fishing cast window.
  await expect(page.getByRole('button', { name: 'Cancel cast', exact: true })).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'test-results/art-pier-cast-mobile.png' });
});

test('a failed art download falls back to playable illustrated fishing', async ({ page }) => {
  await page.route('**/models/sculpted/harbour-kit.glb', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/'); await enterFishing(page);
  await expect(page.getByTestId('living-world')).toHaveClass(/is-illustrated/);
  await page.getByRole('button', { name: 'Cast line', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel cast', exact: true })).toBeVisible();
});

test('authored night lighting and desktop framing remain readable', async ({ page }) => {
  await setTestTime(page, '2026-09-10T01:00:00Z'); await page.goto('/');
  await enterFishing(page); await expect(page.getByTestId('living-world')).toHaveAttribute('data-art-ready', 'true');
  await page.waitForTimeout(650); await page.screenshot({ path: 'test-results/art-night-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(450);
  await page.screenshot({ path: 'test-results/art-night-mobile.png' });
});
