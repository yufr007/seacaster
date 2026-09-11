import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const file = new URL('../public/models/sculpted/harbour-kit.glb', import.meta.url);
test('shipped art has textures, normals, animation and stable interaction pivots', () => {
  assert.ok(existsSync(file), 'The authored GLB art kit has not been built.');
  const bytes = readFileSync(file);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67); assert.equal(bytes.readUInt32LE(4), 2); assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.ok(bytes.length < 12 * 1024 * 1024, 'Art kit exceeded 12 MiB.');
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const names = new Set(gltf.nodes.map((n: {name?: string}) => n.name));
  for (const name of ['Pier', 'Skiff', 'Yacht', 'BaitChest', 'Island', 'LighthouseIsland', 'InletBanks', 'ReefFish', 'Rod', 'Bobber', 'Gull', 'LidPivot', 'BaitAnchor', 'RodTip', 'RodBlank', 'ReelCrank', 'TailPivot', 'WingLeft', 'WingRight']) assert.ok(names.has(name), `Missing art interface: ${name}`);
  assert.ok(gltf.images?.length >= 5, 'Expected textures, not flat-color primitives.');
  assert.ok(gltf.images.every((i: {uri?: string; bufferView?: number}) => !i.uri && i.bufferView !== undefined));
  assert.ok(gltf.buffers.every((b: {uri?: string}) => !b.uri), 'No off-origin geometry.');
  assert.ok(gltf.animations?.some((a: {channels: unknown[]}) => a.channels.length > 0), 'Missing fish animation.');
  let triangles = 0;
  for (const mesh of gltf.meshes) for (const p of mesh.primitives) {
    assert.ok(p.attributes.NORMAL !== undefined, 'Normals must be authored.');
    assert.ok(p.attributes.TEXCOORD_0 !== undefined, 'Meshes need UVs.');
    triangles += gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3;
  }
  assert.ok(triangles < 350000, `Kit exceeds triangle budget: ${triangles}`);
  console.log(JSON.stringify({artBytes: bytes.length, triangles, materials: gltf.materials.length, textures: gltf.images.length, animations: gltf.animations.length}));
});
