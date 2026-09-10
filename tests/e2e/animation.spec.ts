import { test, expect } from '@playwright/test';
import { enterFishing, touchSwipe } from './support';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'Pacific/Honolulu', video: { mode: 'on', size: { width: 390, height: 844 } } });

test.describe('mobile animation evidence', () => {
  test('a real swipe, bobber, tension fight and landing complete with the soundscape enabled', async ({ page }, testInfo) => {
    test.setTimeout(75000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
    await page.locator('canvas').waitFor(); await page.waitForTimeout(1200);
    await enterFishing(page);
    await touchSwipe(page, [225, 545], [258, 335]);
    await page.getByRole('button', { name: 'Hook fish', exact: true }).click({ timeout: 12000 });
    const button = page.getByRole('button', { name: 'Hold to reel', exact: true });
    await expect(button).toBeVisible();
    const cdp = await page.context().newCDPSession(page);
    const box = await button.boundingBox(); if (!box) throw new Error('Missing reel button');
    const finger = [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 }];
    let holding = false;
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      const tension = await page.evaluate(() => document.querySelector('[role="meter"]')?.getAttribute('aria-valuenow') ?? null);
      if (tension === null) break;
      if (!holding && Number(tension) < 40) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: finger }); holding = true; }
      else if (holding && Number(tension) > 68) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); holding = false; }
      await page.waitForTimeout(75);
    }
    if (holding) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    await expect(page.getByRole('dialog', { name: 'Catch landed' })).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(650); await page.screenshot({ path: 'test-results/lifestyle-catch-mobile.png' });
    await page.getByRole('button', { name: 'Keep fishing' }).click();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    await testInfo.attach('animation-note', { body: 'Recorded actual browser input and rendering. Browser video does not include audio; soundscape mixing is tested separately.', contentType: 'text/plain' });
  });
});

test('sound is opt-in, produces a live signal, and suspends when muted', async ({ page }) => {
  await page.addInitScript(() => {
    const Base = window.AudioContext;
    class MonitoredAudioContext extends Base {
      constructor(options?: AudioContextOptions) { super(options); (window as any).__audio = this; }
      createDynamicsCompressor() {
        const node = super.createDynamicsCompressor();
        const analyser = this.createAnalyser(); analyser.fftSize = 256; node.connect(analyser);
        (window as any).__audioMeter = analyser; return node;
      }
    }
    window.AudioContext = MonitoredAudioContext;
  });
  await page.goto('/');
  expect(await page.evaluate(() => Boolean((window as any).__audio))).toBe(false);
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__audio?.state)).toBe('running');
  await expect.poll(() => page.evaluate(() => {
    const analyser = (window as any).__audioMeter as AnalyserNode;
    const samples = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(samples);
    return samples.reduce((sum, sample) => sum + Math.abs(sample), 0);
  })).toBeGreaterThan(.001);
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__audio?.state)).toBe('suspended');
});
