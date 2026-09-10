import { test, expect } from '@playwright/test';
import { newProfile } from '../../game/engine';

async function enterFishing(page: import('@playwright/test').Page) {
  const enter = page.getByRole('button', { name: 'Enter the harbour' });
  await expect(enter.or(page.getByRole('button', { name: 'Go fishing', exact: true }))).toBeVisible();
  if (await enter.isVisible()) await enter.click();
  await page.getByRole('button', { name: 'Go fishing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
}

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'Australia/Melbourne' });

test('a held upward touch exposes a truthful cast preview before release', async ({ page }) => {
  await page.goto('/'); await enterFishing(page); await page.locator('canvas').waitFor(); await page.waitForTimeout(500);
  const cdp = await page.context().newCDPSession(page);
  const from: [number, number] = [230, 520]; const to: [number, number] = [265, 315];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1], id: 1 }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from[0] + (to[0] - from[0]) * i / 8, y: from[1] + (to[1] - from[1]) * i / 8, id: 1 }] });
    await page.waitForTimeout(25);
  }
  await expect(page.locator('main[data-cast-ready="true"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/premium-cast-preview-mobile.png' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
  await expect(page.getByRole('button', { name: 'Cancel cast', exact: true })).toBeVisible();
  await page.waitForTimeout(950); await page.screenshot({ path: 'test-results/premium-cast-landed-mobile.png' });
});

test('progress berths keep distinct premium frames on mobile', async ({ page }) => {
  const p = { ...newProfile(), totalCatches: 30, catches: { f1: { count: 30, best: .2 } } };
  await page.addInitScript(profile => localStorage.setItem('seacaster:guest:v2', JSON.stringify(profile)), p);
  await page.goto('/');
  const enter = page.getByRole('button', { name: 'Enter the harbour' }); if (await enter.isVisible()) await enter.click();
  for (const [id, name] of [['river', 'Willow Inlet'], ['boat', 'Little Skipper'], ['yacht', 'Sunseeker Yacht']] as const) {
    await page.getByRole('button', { name: 'Open platforms', exact: true }).click();
    await page.getByRole('button', { name: `Fish from ${name}`, exact: true }).click();
    await expect(page.getByTestId('living-world')).toHaveAttribute('data-platform', id);
    await page.getByRole('button', { name: 'Go fishing', exact: true }).click(); await page.waitForTimeout(750);
    await page.screenshot({ path: `test-results/premium-${id}-mobile.png` });
    await page.getByRole('button', { name: 'Return to harbour' }).click();
  }
});
