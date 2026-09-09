import test from 'node:test';
import assert from 'node:assert/strict';
import { newProfile, levelForXP, buyTackle, chooseCatch, awardCatch, claimDaily, stepReel, replayReel, validateProfile, FISH, newReel } from '../game/engine.ts';

test('guest starts with a playable, non-premium profile', () => {
  const p = newProfile(0);
  assert.equal(p.version, 2); assert.equal(p.bait, 'worm'); assert.equal(p.coins, 100); assert.equal('premium' in p, false);
});
test('large XP awards cross every earned level', () => {
  assert.equal(levelForXP(0), 1); assert.equal(levelForXP(100), 2); assert.equal(levelForXP(900), 4);
});
test('tackle uses catalogue prices and does not mutate the input', () => {
  const p = newProfile(0), q = buyTackle(p, 'shrimp');
  assert.equal(q.coins, 60); assert.equal(q.baits.shrimp, 5); assert.equal(p.coins, 100);
  assert.throws(() => buyTackle(p, 'invented')); assert.throws(() => buyTackle({ ...p, coins: 0 }, 'shrimp'));
});
test('catch rarity and weight are selected by rules, not caller-provided attributes', () => {
  assert.equal(chooseCatch(0, 0).speciesId, 'f1'); assert.equal(chooseCatch(0.9999, 0.99).speciesId, 'f15');
  for (const roll of [-1, 1, NaN, Infinity]) assert.throws(() => chooseCatch(roll, 0.5));
});
test('a catch updates collection once and advances daily progress', () => {
  const p = newProfile(0), q = awardCatch(p, chooseCatch(0, 0.5), 0);
  assert.equal(q.catches.f1.count, 1); assert.equal(q.totalCatches, 1); assert.equal(q.daily.catches, 1);
  assert.equal(q.xp, FISH[0].xp); assert.equal(p.totalCatches, 0);
});
test('daily reward cannot be claimed twice or before completion', () => {
  let p = newProfile(0); assert.throws(() => claimDaily(p, 0));
  for (let i = 0; i < 5; i++) p = awardCatch(p, chooseCatch(0, 0.5), 0);
  const q = claimDaily(p, 0); assert.equal(q.coins, p.coins + 100);
  assert.throws(() => claimDaily(q, 0)); assert.throws(() => claimDaily(q, 86400000));
});
test('tampered and malformed local saves reset without granting entitlements', () => {
  const p = newProfile(0); assert.deepEqual(validateProfile(p, 0), p);
  for (const bad of [null, {}, { ...p, coins: -1 }, { ...p, xp: NaN }, { ...p, catches: { fake: {count: 1, best: 1} } }]) assert.deepEqual(validateProfile(bad, 0), p);
  const clean = validateProfile({ ...p, premium: true, arbitrary: 'value' }, 0);
  assert.equal('premium' in clean, false); assert.equal('arbitrary' in clean, false);
});
test('constant reeling snaps the line; no input loses the fish', () => {
  let a = newReel(), b = newReel();
  for (let i = 0; i < 1500; i++) { a = stepReel(a, true, 42); b = stepReel(b, false, 42); }
  assert.equal(a.status, 'lost'); assert.equal(b.status, 'lost');
});
test('input replay matches the actual deterministic reel simulation', () => {
  let s = newReel(), hold = true;
  const events = [{ at: 0, hold }];
  while (s.status === 'playing' && s.elapsed < 30000) {
    const next: boolean = s.tension > 0.7 ? false : s.tension < 0.35 ? true : hold;
    if (next !== hold) { hold = next; events.push({ at: s.elapsed, hold }); }
    s = stepReel(s, hold, 42);
  }
  assert.equal(s.status, 'won'); assert.deepEqual(replayReel(42, events, s.elapsed), s);
});
test('replay rejects malformed, reordered, oversized and impossible inputs', () => {
  for (const events of [[], [{ at: -1, hold: true }], [{ at: 0, hold: 'true' }], [{ at: 0, hold: true }, { at: 0, hold: false }], Array.from({length: 301}, (_,i) => ({at:i*20, hold:true}))]) assert.throws(() => replayReel(1, events, 10000));
  assert.throws(() => replayReel(1, [{ at: 0, hold: true }], Infinity));
});
