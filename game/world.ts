import type { Profile } from './engine.ts';

export type PlatformId = 'pier' | 'river' | 'boat' | 'yacht';
export const PLATFORMS = [
  { id: 'pier', name: 'Driftwood Pier', location: 'SUNSHELL HARBOUR', catches: 0, title: 'Where every story starts', description: 'Warm planks, a faithful bait box and a whole ocean of possibility.', color: '#e8aa56' },
  { id: 'river', name: 'Willow Inlet', location: 'THE RIVER MEETS THE SEA', catches: 3, title: 'Take the scenic route', description: 'A leafy estuary hideaway. Lily pads, smooth stones and nobody in a hurry.', color: '#8ad89d' },
  { id: 'boat', name: 'Little Skipper', location: 'BEYOND THE BREAKWATER', catches: 10, title: 'Your first taste of freedom', description: 'A cheerful little fishing boat. Rock with the swell and make the bay your own.', color: '#ff9277' },
  { id: 'yacht', name: 'Sunseeker Yacht', location: 'THE GOOD LIFE', catches: 30, title: 'You have earned this view', description: 'Cream decks, turquoise cushions and your own patch of blue.', color: '#8bdce9' },
] as const;
export function normalizePlatform(id: unknown, catches: number): PlatformId {
  return PLATFORMS.find(p => p.id === id && catches >= p.catches)?.id ?? 'pier';
}
export function platformFor(profile: Pick<Profile, 'platform' | 'totalCatches'>) {
  return PLATFORMS.find(p => p.id === normalizePlatform(profile.platform, profile.totalCatches))!;
}
export function equipPlatform(profile: Profile, id: string): Profile {
  const platform = PLATFORMS.find(p => p.id === id);
  if (!platform) throw new Error('Unknown platform.');
  if (profile.totalCatches < platform.catches) throw new Error(`Unlocks after ${platform.catches} catches.`);
  return { ...profile, platform: platform.id };
}
export type SkyPeriod = 'dawn' | 'day' | 'dusk' | 'night';
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
/** An ambient local-clock cycle, not astronomical sunrise or weather. */
export function skyAtHour(hour: number) {
  const h = Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 12;
  const daylight = smooth((h - 5) / 2) * (1 - smooth((h - 17.5) / 2.5));
  const period: SkyPeriod = h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17.5 ? 'day' : h >= 17.5 && h < 20 ? 'dusk' : 'night';
  return { hour: h, daylight, period, sun: daylight >= .35, warmth: period === 'dawn' || period === 'dusk' ? 1 - Math.abs(daylight - .5) : 0 };
}
export type CastGesture = { power: number; aim: number };
export function swipeCast(dx: number, dy: number, width: number, height: number, cancelled = false): CastGesture | null {
  if (cancelled || ![dx, dy, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const rise = -dy;
  if (rise < clamp(height * .085, 48, 88) || Math.abs(dx) > rise * .95) return null;
  return { power: clamp(rise / (height * .25), .25, 1), aim: clamp(dx / (width * .3), -1, 1) };
}
export function castArc(from: readonly number[], to: readonly number[], time: number): [number, number, number] {
  const t = clamp(time);
  if (t === 0) return [from[0], from[1], from[2]];
  if (t === 1) return [to[0], to[1], to[2]];
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * 3.2, from[2] + (to[2] - from[2]) * t];
}

/** Shared visible water landing position for cast preview and the actual bobber. */
export function castTarget(gesture: CastGesture): [number, number, number] {
  const power = clamp(gesture.power);
  const aim = clamp(gesture.aim, -1, 1);
  return [aim * 2.8, .16, -2.8 - power * 6.4];
}

export type CameraFrame = {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
};

/** Presentation-only camera identity. It never changes cast or reward rules. */
export function cameraFrame(platform: PlatformId, portrait: boolean, home: boolean): CameraFrame {
  if (home) return { position: [0, 7.3, portrait ? 12 : 13.4], lookAt: [0, 1, -6.5], fov: 48 };
  const frames: Record<PlatformId, CameraFrame> = {
    pier: { position: [0, 7.15, 12.2], lookAt: [0, .9, -6.35], fov: 47 },
    river: { position: [0, 6.55, 11.5], lookAt: [0, .65, -6.85], fov: 49 },
    boat: { position: [0, 7.8, 13.05], lookAt: [0, .82, -7.05], fov: 50 },
    yacht: { position: [0, 8.65, 14.15], lookAt: [0, 1.18, -7.45], fov: 52 },
  };
  const frame = frames[platform] ?? frames.pier;
  return portrait ? frame : { ...frame, position: [frame.position[0], frame.position[1] + .15, frame.position[2] + 1.65] };
}

/** Pure drag projection used by the touch hook and the 3D cast preview. */
export function castDrag(dx: number, dy: number, width: number, height: number) {
  const charge = Number.isFinite(dy) && Number.isFinite(height) && height > 0 ? clamp(-dy / (height * .25)) : 0;
  return { charge, preview: swipeCast(dx, dy, width, height) };
}

export type PlatformAtmosphere = {
  kind: 'harbour' | 'inlet' | 'offshore' | 'luxury';
  rock: number;
  water: number;
  ambientRate: number;
};

/** Small presentation coefficients shared by animation and procedural ambience. */
export function platformAtmosphere(platform: PlatformId): PlatformAtmosphere {
  const moods: Record<PlatformId, PlatformAtmosphere> = {
    pier: { kind: 'harbour', rock: 0, water: .62, ambientRate: 1 },
    river: { kind: 'inlet', rock: 0, water: .42, ambientRate: .78 },
    boat: { kind: 'offshore', rock: .045, water: .9, ambientRate: .92 },
    yacht: { kind: 'luxury', rock: .028, water: .74, ambientRate: .62 },
  };
  return moods[platform] ?? moods.pier;
}

export type PlatformDetails = {
  signature: 'working-pier' | 'willow-landing' | 'little-skippers-deck' | 'sunseeker-deck';
  rails: boolean;
  reeds: boolean;
  pennant: boolean;
  cushion: boolean;
  accent: string;
};

/** Cosmetic-only deck vocabulary. Deliberately contains no economy or reward fields. */
export function platformDetails(platform: PlatformId): PlatformDetails {
  const details: Record<PlatformId, PlatformDetails> = {
    pier: { signature: 'working-pier', rails: false, reeds: false, pennant: false, cushion: false, accent: '#e7b16b' },
    river: { signature: 'willow-landing', rails: false, reeds: true, pennant: false, cushion: false, accent: '#88bd79' },
    boat: { signature: 'little-skippers-deck', rails: false, reeds: false, pennant: true, cushion: false, accent: '#ef7e60' },
    yacht: { signature: 'sunseeker-deck', rails: true, reeds: false, pennant: false, cushion: true, accent: '#63bcc0' },
  };
  return details[platform] ?? details.pier;
}
