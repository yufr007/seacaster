import test from 'node:test';
import assert from 'node:assert/strict';
import { newProfile, validateProfile } from '../game/engine.ts';
import { PLATFORMS, equipPlatform, platformFor, skyAtHour, swipeCast, castArc } from '../game/world.ts';

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
