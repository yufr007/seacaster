import test from 'node:test';
import assert from 'node:assert/strict';
import { createCast, hookCast, finishCast } from '../game/cast.ts';
import { newProfile, newReel, stepReel } from '../game/engine.ts';

test('server cast chooses the catch and consumes only equipped bait', () => {
  const p = { ...newProfile(0), bait: 'shrimp' as const, baits: { shrimp: 1, squid: 0 } };
  const { cast, profile } = createCast(p, 0, [0.1, 0.5, 0.5], 'cast-1');
  assert.equal(cast.biteAt, 2400); assert.equal(cast.id, 'cast-1');
  assert.equal(profile.bait, 'worm'); assert.equal(profile.baits.shrimp, 0); assert.equal(p.baits.shrimp, 1);
});
test('hook timing is measured against the issued cast', () => {
  const { cast } = createCast(newProfile(0), 1000, [0.1, 0.5, 0.5], 'cast-2');
  assert.throws(() => hookCast(cast, cast.biteAt - 1, 42));
  assert.throws(() => hookCast(cast, cast.expiresAt + 1, 42));
  const hooked = hookCast(cast, cast.biteAt + 100, 42);
  assert.equal(hooked.hookedAt, cast.biteAt + 100);
  assert.throws(() => hookCast(hooked, cast.biteAt + 200, 42));
});
test('server awards a completed transcript once and rejects fast-forwarded play', () => {
  let s = newReel(), hold = true;
  const events = [{ at: 0, hold }];
  while (s.status === 'playing') {
    const next = s.tension > .7 ? false : s.tension < .35 ? true : hold;
    if (hold !== next) { hold = next; events.push({at:s.elapsed,hold}); }
    s = stepReel(s, hold, 42);
  }
  const p = newProfile(0);
  const { cast } = createCast(p, 0, [0.1, 0.5, 0.5], 'cast-3');
  const h = hookCast(cast, cast.biteAt + 100, 42);
  assert.throws(() => finishCast(p, h, events, s.elapsed, h.hookedAt! + 100));
  const r = finishCast(p, h, events, s.elapsed, h.hookedAt! + s.elapsed + 300);
  assert.equal(r.profile.totalCatches, 1); assert.equal(r.cast.completed, true);
  assert.throws(() => finishCast(r.profile, r.cast, events, s.elapsed, h.hookedAt! + s.elapsed + 400));
});
test('failed reels and expired hooked casts never create rewards', () => {
  const p = newProfile(0);
  const { cast } = createCast(p, 0, [0.1, 0.5, 0.5], 'cast-4');
  const h = hookCast(cast, cast.biteAt, 42);
  assert.throws(() => finishCast(p, h, [{at:0,hold:false}], 20, h.hookedAt! + 1000));
  assert.throws(() => finishCast(p, h, [{at:0,hold:true}], 20, h.hookedAt! + 61000));
});
