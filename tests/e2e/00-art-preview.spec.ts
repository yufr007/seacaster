import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { enterFishing } from './support';

test('capture the real authored scene and renderer timing before gameplay regressions', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date('2026-09-10T12:00:00Z'));
  await page.goto('/'); await enterFishing(page);
  await expect(page.getByTestId('living-world')).toHaveAttribute('data-art-ready', 'true');
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(async () => {
    const samples: number[] = [];
    let previous = performance.now();
    await new Promise<void>(resolve => {
      const started = previous;
      const tick = (now: number) => {
        samples.push(now - previous); previous = now;
        if (now - started >= 3000) resolve(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const canvas = document.querySelector('canvas')!;
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    samples.sort((a, b) => a - b);
    return {
      renderer: gl && extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'not exposed',
      frames: samples.length,
      medianFrameMs: samples[Math.floor(samples.length * .5)],
      p95FrameMs: samples[Math.min(samples.length - 1, Math.floor(samples.length * .95))],
      canvas: { width: canvas.width, height: canvas.height },
      note: 'Software-runner timing is diagnostic evidence, not a physical-phone benchmark.',
    };
  });
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/art-render-metrics.json', JSON.stringify(metrics, null, 2));
  console.log('ART_RENDER_METRICS', JSON.stringify(metrics));
  await page.screenshot({ path: 'test-results/art-first-frame-mobile.png' });
  expect(errors).toEqual([]);
});
