import { test, expect } from '@playwright/test';
import { enterFishing, enterHarbour, touchSwipe } from './support';
import { newProfile } from '../../game/engine';

test('title, harbour and the in-world bait chest are usable on a phone', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date('2026-09-10T12:00:00Z')); await page.goto('/');
  await expect(page.getByRole('button', { name: 'Enter the harbour' })).toBeVisible();
  await page.locator('canvas').waitFor(); await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/lifestyle-title-mobile.png' });
  await enterHarbour(page); await page.waitForTimeout(250);
  await expect(page.getByRole('heading', { name: 'Your little life on the water.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/lifestyle-harbour-mobile.png' });
  await page.getByRole('button', { name: 'Go fishing' }).click();
  await page.getByRole('button', { name: 'Open bait box', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A little something for the fish' })).toBeVisible();
  await page.screenshot({ path: 'test-results/lifestyle-bait-mobile.png' });
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.screenshot({ path: 'test-results/lifestyle-pier-mobile.png' });
  expect(errors).toEqual([]);
});

test('real touch gestures cast once; taps, sideways gestures and cancellation do not consume bait', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await enterFishing(page);
  await page.locator('canvas').waitFor();
  const before = await page.evaluate(() => localStorage.getItem('seacaster:guest:v2'));
  await touchSwipe(page, [230, 480], [233, 470]);
  await touchSwipe(page, [130, 460], [275, 454]);
  await touchSwipe(page, [230, 490], [225, 310], true);
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('seacaster:guest:v2'))).toBe(before);
  await touchSwipe(page, [230, 500], [260, 320]);
  await expect(page.getByRole('button', { name: 'Cancel cast', exact: true })).toBeVisible();
  await page.waitForTimeout(950);
  await page.screenshot({ path: 'test-results/lifestyle-bobber-mobile.png' });
  await page.getByRole('button', { name: 'Cancel cast', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
});

for (const [id, name] of [['river', 'Willow Inlet'], ['boat', 'Little Skipper'], ['yacht', 'Sunseeker Yacht']]) {
  test(`${name} renders its own earned berth and persists selection`, async ({ page }) => {
    const p = { ...newProfile(), totalCatches: 30, catches: { f1: { count: 30, best: .2 } } };
    await page.addInitScript(profile => {
      if (!localStorage.getItem('seacaster:guest:v2')) localStorage.setItem('seacaster:guest:v2', JSON.stringify(profile));
    }, p);
    await page.clock.setFixedTime(new Date('2026-09-10T12:00:00Z')); await page.goto('/'); await enterHarbour(page);
    await page.getByRole('button', { name: 'Open platforms', exact: true }).click();
    await page.getByRole('button', { name: `Fish from ${name}`, exact: true }).click();
    await expect(page.getByTestId('living-world')).toHaveAttribute('data-platform', id);
    await page.getByRole('button', { name: 'Go fishing' }).click(); await page.waitForTimeout(700);
    await page.screenshot({ path: `test-results/lifestyle-${id}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/lifestyle-${id}-mobile.png` });
    await page.getByRole('button', { name: 'Return to harbour' }).click();
    await page.reload(); await expect(page.getByTestId('living-world')).toHaveAttribute('data-platform', id);
  });
}

test('clock follows the device timezone rather than a server timezone', async ({ browser }) => {
  for (const [zone, period] of [['America/New_York', 'night'], ['Australia/Melbourne', 'day']]) {
    const context = await browser.newContext({ timezoneId: zone, viewport: { width: 390, height: 844 } }); const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-09-10T03:00:00Z'));
    await page.goto('http://127.0.0.1:4173/'); await enterFishing(page);
    await expect(page.getByTestId('living-world')).toHaveAttribute('data-period', period);
    await page.waitForTimeout(700); await page.screenshot({ path: `test-results/lifestyle-${period}-mobile.png` }); await context.close();
  }
});

test('comfort settings persist and illustrated mode does not remove touch casting', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await enterFishing(page);
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  const volume = page.getByRole('slider', { name: 'Ocean ambience volume' });
  await volume.focus(); await volume.press('Home');
  for (let i = 0; i < 5; i++) await volume.press('ArrowRight');
  await page.getByRole('checkbox', { name: 'Low-power mode' }).check();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await touchSwipe(page, [230, 490], [210, 300]);
  await expect(page.getByRole('button', { name: 'Cancel cast' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel cast' }).click();
  await page.reload(); await enterFishing(page);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Ocean ambience volume' })).toHaveValue('0.25');
});
