import { expect, type Page } from '@playwright/test';
export async function enterHarbour(page: Page) {
  const enter = page.getByRole('button', { name: 'Enter the harbour' });
  await expect(page.getByRole('button', { name: 'Enter the harbour' }).or(page.getByRole('button', { name: 'Go fishing', exact: true }))).toBeVisible();
  if (await enter.isVisible()) await enter.click();
  await expect(page.getByRole('button', { name: 'Go fishing', exact: true })).toBeVisible();
}
export async function enterFishing(page: Page) {
  await enterHarbour(page); await page.getByRole('button', { name: 'Go fishing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cast line', exact: true })).toBeVisible();
}
export async function touchSwipe(page: Page, from: [number, number], to: [number, number], cancel = false) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1], id: 1 }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from[0] + (to[0] - from[0]) * i / 8, y: from[1] + (to[1] - from[1]) * i / 8, id: 1 }] });
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] }); await cdp.detach();
}

/** Shift wall-clock time only. Playwright's Clock also replaces RAF and queues fake frames. */
export async function setTestTime(page: Page, iso: string) {
  await page.addInitScript(value => {
    const NativeDate = Date;
    const offset = NativeDate.parse(value) - NativeDate.now();
    globalThis.Date = new Proxy(NativeDate, {
      construct(target, args, newTarget) {
        return Reflect.construct(target, args.length ? args : [NativeDate.now() + offset], newTarget);
      },
      apply() { return new NativeDate(NativeDate.now() + offset).toString(); },
      get(target, key, receiver) {
        if (key === 'now') return () => NativeDate.now() + offset;
        return Reflect.get(target, key, receiver);
      },
    });
  }, iso);
}
