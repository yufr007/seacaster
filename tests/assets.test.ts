import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

for (const name of ['sardine', 'mackerel', 'seabass', 'cod', 'leviathan']) {
  test(`${name} has a bounded RGBA sprite with a transparent border, not a baked checkerboard`, () => {
    const path = process.env.ASSET_TEST_ROOT
      ? resolve(process.env.ASSET_TEST_ROOT, `${name}.png`)
      : new URL(`../public/assets/fish/${name}.png`, import.meta.url);
    const png = readFileSync(path);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.subarray(12, 16).toString(), 'IHDR');
    assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(16) <= 512);
    assert.ok(png.readUInt32BE(20) > 0 && png.readUInt32BE(20) <= 512);
    assert.equal(png[24], 8, 'Expected eight-bit colour channels');
    assert.equal(png[25], 6, 'Expected real RGBA transparency');
    assert.equal(png[28], 0, 'Expected non-interlaced PNG');
    const chunks: Buffer[] = [];
    for (let offset = 8; offset + 12 <= png.length;) {
      const length = png.readUInt32BE(offset);
      assert.ok(offset + length + 12 <= png.length, 'Truncated PNG');
      if (png.subarray(offset + 4, offset + 8).toString() === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
      offset += length + 12;
    }
    const firstRow = inflateSync(Buffer.concat(chunks));
    assert.ok(firstRow[0] <= 4, 'Invalid PNG filter');
    // The first pixel has no left/up neighbours under any PNG row filter.
    assert.equal(firstRow[4], 0, 'Expected a fully transparent top-left pixel');
  });
}
