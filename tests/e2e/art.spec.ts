import { test, expect } from '@playwright/test';
import { enterFishing, touchSwipe, setTestTime } from './support';
import { newProfile } from '../../game/engine';

for (const platform of ['pier', 'river', 'boat', 'yacht']) {
  test(`authored ${platform} loads real GLB art and keeps its bait controls usable`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewportSize({ width: 390, height: 844 });
    await setTestTime(page, '2026-09-10T12:00:00Z');
    await page.addInitScript(p => localStorage.setItem('seacaster:guest:v2', JSON.stringify(p)), {
      ...newProfile(), totalCatches: 30, catches: { f1: { count: 30, best: .2 } }, platform,
    });
    const asset = page.waitForResponse(r => r.url().endsWith('/models/sculpted/harbour-kit.glb'));
    await page.goto('/'); await enterFishing(page);
    expect((await asset).ok()).toBe(true);
    await expect(page.getByTestId('living-world')).toHaveAttribute('data-art-ready', 'true');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `test-results/art-${platform}-mobile.png` });
    await page.getByRole('button', { name: 'Open bait box', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'A little something for the fish' })).toBeVisible();
    await page.getByRole('button', { name: 'Close panel' }).click();
    await touchSwipe(page, [225, 495], [240, 315]);
    await expect(page.getByRole('button', { name: 'Cancel cast', exact: true })).toBeVisible();
    await page.waitForTimeout(900); await page.screenshot({ path: `test-results/art-${platform}-cast-mobile.png` });
    await page.getByRole('button', { name: 'Cancel cast', exact: true }).click();
    expect(errors).toEqual([]);
  });
}

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
  await page.waitForTimeout(800); await page.screenshot({ path: 'test-results/art-night-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(700);
  await page.screenshot({ path: 'test-results/art-night-mobile.png' });
});
