import test from 'node:test';
import assert from 'node:assert/strict';
import { newProfile, validateProfile } from '../game/engine.ts';
import { PLATFORMS, equipPlatform, platformFor, skyAtHour, swipeCast, castArc, castTarget, cameraFrame, castDrag, platformAtmosphere, platformDetails } from '../game/world.ts';
import type { PlatformId } from '../game/world.ts';

test('a new angler has a pier without spending coins', () => {
  const p = newProfile(); assert.equal(p.platform, 'pier'); assert.equal(platformFor(p).id, 'pier');
});
test('platforms unlock from verified catch progress and selection costs nothing', () => {
  const p = { ...newProfile(), totalCatches: 10 };
  assert.equal(equipPlatform(p, 'boat').platform, 'boat'); assert.equal(equipPlatform(p, 'boat').coins, p.coins);
  assert.throws(() => equipPlatform(p, 'yacht'), /Unlocks/);
  assert.throws(() => equipPlatform(p, 'unknown'), /Unknown platform/);
  assert.equal(PLATFORMS.length, 4);
});
test('selection does not accept a locked saved berth and keeps old V2 saves', () => {
  const p = newProfile(); const { platform, ...old } = p;
  assert.equal(validateProfile(old).platform, 'pier');
  assert.equal(validateProfile({ ...p, platform: 'yacht' }).platform, 'pier');
  assert.equal(platformFor({ ...p, platform: 'yacht' }).id, 'pier');
});
test('upward swipes cast while taps, horizontal drags, cancellation and non-finite input do not', () => {
  assert.equal(swipeCast(0, -8, 390, 844), null);
  assert.equal(swipeCast(170, -70, 390, 844), null);
  assert.equal(swipeCast(0, 100, 390, 844), null);
  assert.equal(swipeCast(0, -160, 390, 844, true), null);
  assert.equal(swipeCast(NaN, -160, 390, 844), null);
  const cast = swipeCast(28, -160, 390, 844); assert.ok(cast); assert.ok(cast.power > .5); assert.ok(cast.aim > 0);
  assert.ok(swipeCast(0, -500, 390, 844)!.power <= 1);
});
test('world clock wraps midnight and supports day, dawn, dusk and night', () => {
  assert.equal(skyAtHour(12).period, 'day'); assert.equal(skyAtHour(1).period, 'night');
  assert.equal(skyAtHour(6).period, 'dawn'); assert.equal(skyAtHour(18.5).period, 'dusk');
  assert.deepEqual(skyAtHour(25), skyAtHour(1));
  assert.ok(skyAtHour(12).daylight > skyAtHour(1).daylight);
  assert.equal(skyAtHour(NaN).period, 'day');
});
test('bait follows an actual arc from the rod tip to the water', () => {
  const from: [number, number, number] = [1, 3, 4], to: [number, number, number] = [0, 0, -7];
  assert.deepEqual(castArc(from, to, 0), from); assert.deepEqual(castArc(from, to, 1), to);
  assert.ok(castArc(from, to, .5)[1] > 3);
  assert.deepEqual(castArc(from, to, 2), to);
});


test('cast target is the single bounded source of truth for visible landing position', () => {
  assert.deepEqual(castTarget({ power: .25, aim: -1 }), [-2.8, .16, -4.4]);
  assert.deepEqual(castTarget({ power: 1, aim: 1 }), [2.8, .16, -9.2]);
  assert.deepEqual(castTarget({ power: .6, aim: 0 }), [0, .16, -6.64]);
  assert.deepEqual(castTarget({ power: 9, aim: -9 }), [-2.8, .16, -9.2]);
});

test('each fishing berth has a finite and distinct portrait camera while home framing stays calm', () => {
  const ids: PlatformId[] = ['pier', 'river', 'boat', 'yacht'];
  const frames = ids.map(id => cameraFrame(id, true, false));
  for (const frame of frames) {
    assert.ok([...frame.position, ...frame.lookAt, frame.fov].every(Number.isFinite));
    assert.ok(frame.fov >= 42 && frame.fov <= 56);
    assert.ok(frame.position[2] > 9);
    assert.ok(frame.lookAt[2] < -4);
  }
  assert.equal(new Set(frames.map(f => JSON.stringify(f))).size, ids.length);
  const home = ids.map(id => cameraFrame(id, true, true));
  assert.equal(new Set(home.map(f => JSON.stringify(f))).size, 1);
});

test('landscape framing backs away without changing the berth identity target', () => {
  const portrait = cameraFrame('yacht', true, false);
  const landscape = cameraFrame('yacht', false, false);
  assert.ok(landscape.position[2] > portrait.position[2]);
  assert.deepEqual(landscape.lookAt, portrait.lookAt);
});

test('cast drag exposes cosmetic charge but only marks a truthful valid preview', () => {
  const short = castDrag(0, -30, 390, 844);
  assert.ok(short.charge > 0); assert.equal(short.preview, null);
  const valid = castDrag(35, -180, 390, 844);
  assert.ok(valid.preview); assert.equal(valid.preview?.aim, 35 / (390 * .3));
  assert.equal(castDrag(190, -90, 390, 844).preview, null);
});

test('platform atmosphere keeps motion and ambient density bounded per berth', () => {
  const pier = platformAtmosphere('pier'), river = platformAtmosphere('river'), boat = platformAtmosphere('boat'), yacht = platformAtmosphere('yacht');
  assert.equal(pier.rock, 0); assert.equal(river.rock, 0);
  assert.ok(boat.rock > 0); assert.ok(yacht.rock > 0);
  for (const mood of [pier, river, boat, yacht]) {
    assert.ok(mood.water >= .35 && mood.water <= 1);
    assert.ok(mood.ambientRate >= .4 && mood.ambientRate <= 1.2);
  }
  assert.equal(new Set([pier.kind, river.kind, boat.kind, yacht.kind]).size, 4);
});

test('each berth exposes distinct cosmetic deck details without economic fields', () => {
  const details = (['pier', 'river', 'boat', 'yacht'] as PlatformId[]).map(platformDetails);
  assert.equal(new Set(details.map(d => d.signature)).size, 4);
  assert.equal(details[0].rails, false); assert.equal(details[1].reeds, true);
  assert.equal(details[2].pennant, true); assert.equal(details[3].rails, true);
  for (const detail of details) assert.equal('reward' in detail || 'odds' in detail || 'price' in detail, false);
});
