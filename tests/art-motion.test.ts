import test from 'node:test';
import assert from 'node:assert/strict';
import { bendRodVertex, bendRodNormal, waveHeight } from '../game/art-motion.ts';
test('authored rod stays fixed at the grip and its tip matches the fishing line', () => {
  assert.deepEqual(bendRodVertex(0, .73, 0, .6), [0, .73, 0]);
  assert.deepEqual(bendRodVertex(0, 3.55, 0, .6), [-.6, 3.55, 0]);
  assert.deepEqual(bendRodVertex(.05, .2, .03, .6), [.05, .2, .03]);
});
test('rod normals follow the deformation and stay normalized', () => {
  const normal = bendRodNormal(1, 0, 0, 3.55, .6);
  assert.ok(normal[1] > 0);
  assert.ok(Math.abs(Math.hypot(...normal) - 1) < 1e-6);
  assert.deepEqual(bendRodNormal(0, 0, 1, 2, .6), [0, 0, 1]);
});
test('float uses the same world-space displacement as the water shader', () => {
  for (const [x, z, time] of [[0, 0, 0], [2, -8, 3], [-2, -4, 15]]) {
    const expected = -.05 + Math.sin(x * .6 + time * .85) * .075 + Math.cos(z * .43 + time * .6) * .055;
    assert.equal(waveHeight(x, z, time), expected);
  }
});
