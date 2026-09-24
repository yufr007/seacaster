import { awardCatch, chooseCatch, consumeBait, replayReel } from './engine.ts';
import type { Catch, Profile, Rod } from './engine.ts';

export type Cast = {
  id: string; biteAt: number; expiresAt: number; catch: Catch; rod: Rod;
  hookedAt: number | null; seed: number | null; completed: boolean;
};
export type CastView = Pick<Cast, 'id' | 'biteAt' | 'expiresAt'>;
export const castView = (cast: Cast): CastView => ({ id: cast.id, biteAt: cast.biteAt, expiresAt: cast.expiresAt });
export function createCast(profile: Profile, now: number, rolls: [number, number, number], id: string): { cast: Cast; profile: Profile } {
  if (!Number.isFinite(now) || !id || rolls.some(v => !Number.isFinite(v) || v < 0 || v >= 1)) throw new Error('Invalid cast parameters.');
  const wait = (profile.bait === 'shrimp' ? 1600 : 2400) + Math.floor(rolls[2] * 1600);
  const biteAt = now + wait;
  return { profile: consumeBait(profile), cast: { id, biteAt, expiresAt: biteAt + 3500, catch: chooseCatch(rolls[0], rolls[1], profile.bait), rod: profile.rod, hookedAt: null, seed: null, completed: false } };
}
export function hookCast(cast: Cast, now: number, seed: number): Cast {
  if (cast.completed || cast.hookedAt !== null) throw new Error('This cast is no longer waiting.');
  if (!Number.isFinite(now) || now < cast.biteAt || now > cast.expiresAt) throw new Error('Missed the bite. Cast again.');
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid reel seed.');
  return { ...cast, hookedAt: now, seed };
}
export function finishCast(profile: Profile, cast: Cast, inputs: unknown, duration: number, now: number): { profile: Profile; cast: Cast; catch: Catch } {
  if (cast.completed || cast.hookedAt === null || cast.seed === null) throw new Error('No active hooked fish.');
  const elapsed = now - cast.hookedAt;
  if (!Number.isFinite(elapsed) || elapsed < duration - 200 || elapsed > 60000) throw new Error('Reel timing is invalid or expired.');
  if (replayReel(cast.seed, inputs, duration).status !== 'won') throw new Error('The fish escaped.');
  const awarded = awardCatch({ ...profile, rod: cast.rod }, cast.catch, now);
  return { profile: { ...awarded, rod: profile.rod }, cast: { ...cast, completed: true }, catch: cast.catch };
}
