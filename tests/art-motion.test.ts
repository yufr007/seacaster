import test from 'node:test';
import assert from 'node:assert/strict';
import { bendRodVertex, bendRodNormal, waveHeight } from '../game/art-motion.ts';
import * as artMotion from '../game/art-motion.ts';
import { waterVertexShader, waterFragmentShader } from '../shaders/water.ts';
import { readFileSync } from 'node:fs';
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
test('float and rendered surface use the same primary world-space displacement', () => {
  for (const [x, z, time] of [[0, 0, 0], [2, -8, 3], [-2, -4, 15]]) {
    const expected = -.05 + Math.sin(x * .6 + time * .85) * .075 + Math.cos(z * .43 + time * .6) * .055;
    assert.equal(waveHeight(x, z, time), expected);
  }
  assert.match(waterVertexShader, /p\.x \* \.6 \+ t \* \.85/);
  assert.match(waterVertexShader, /p\.y \* \.43 \+ t \* \.6/);
  assert.match(waterVertexShader, /waveHeight\(base\.xz, time\)/);
  assert.doesNotMatch(waterVertexShader, /float c\s*=/, 'Do not add hidden geometry waves the float cannot follow.');
});
test('water uses view-aware surface shading instead of repeating binary stripe bands', () => {
  assert.match(waterVertexShader, /vNormal/);
  assert.match(waterFragmentShader, /fresnel/i);
  assert.match(waterFragmentShader, /cameraPosition/);
  assert.doesNotMatch(waterFragmentShader, /float band\s*\(/, 'Old stripe-band water reads as a repeating texture at phone scale.');
});
test('rod attribute snapshots honor the actual interleaved GLB stride and offsets', () => {
  const snapshot = (artMotion as Record<string, unknown>).snapshotVec3;
  assert.equal(typeof snapshot, 'function', 'The rod needs stride-aware attribute snapshots.');
  const copy = snapshot as (a: { count: number; getX(i: number): number; getY(i: number): number; getZ(i: number): number }) => Float32Array;
  const bytes = readFileSync(new URL('../public/models/sculpted/harbour-kit.glb', import.meta.url));
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binary = 20 + jsonLength + 8;
  const node = gltf.nodes.find((n: { name: string }) => n.name === 'RodBlank');
  const primitive = gltf.meshes[node.mesh].primitives[0];
  for (const key of ['POSITION', 'NORMAL']) {
    const accessor = gltf.accessors[primitive.attributes[key]];
    const view = gltf.bufferViews[accessor.bufferView];
    assert.ok(view.byteStride > 12, 'The regression fixture must remain interleaved.');
    const start = binary + view.byteOffset + (accessor.byteOffset ?? 0);
    const at = (i: number, component: number) => bytes.readFloatLE(start + i * view.byteStride + component * 4);
    const packed = copy({ count: accessor.count, getX: i => at(i, 0), getY: i => at(i, 1), getZ: i => at(i, 2) });
    assert.equal(packed.length, accessor.count * 3);
    for (let i = 0; i < accessor.count; i++) {
      assert.deepEqual(Array.from(packed.subarray(i * 3, i * 3 + 3)), [at(i, 0), at(i, 1), at(i, 2)]);
      if (key === 'POSITION') {
        const bent = bendRodVertex(packed[i * 3], packed[i * 3 + 1], packed[i * 3 + 2], .6);
        assert.ok(Math.abs(bent[0]) < .7 && bent[1] >= .72 && bent[1] <= 3.56 && Math.abs(bent[2]) < .05);
      }
    }
  }
});
test('background art does not pay for foreground-only shadow receivers', () => {
  const policy = (artMotion as Record<string, unknown>).artCastsShadow;
  assert.equal(typeof policy, 'function');
  const casts = policy as (name: string) => boolean;
  assert.equal(casts('Pier'), true); assert.equal(casts('BaitChest'), true);
  for (const name of ['ReefFish', 'Gull', 'Island', 'LighthouseIsland', 'InletBanks']) assert.equal(casts(name), false);
});
test('environment reflections are reserved for glossy paint, glass and metal', () => {
  const policy = (artMotion as Record<string, unknown>).needsArtReflection;
  assert.equal(typeof policy, 'function');
  const reflects = policy as (roughness: number, metalness: number) => boolean;
  assert.equal(reflects(.73, 0), false); assert.equal(reflects(.85, 0), false);
  assert.equal(reflects(.3, 0), true); assert.equal(reflects(.33, .58), true);
});
