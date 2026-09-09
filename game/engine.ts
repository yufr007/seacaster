/** Shared rules. No wallet, renderer, timers, persistence or network side effects. */
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
export type Fish = { id: string; name: string; rarity: Rarity; weight: number; xp: number; image: string };
const fish = (id: string, name: string, rarity: Rarity, weight: number, xp: number, asset: string): Fish => ({ id, name, rarity, weight, xp, image: `/assets/fish/${asset}.png` });
export const FISH: readonly Fish[] = [
  fish('f1', 'Salty Sardine', 'Common', 0.2, 10, 'sardine'),
  fish('f2', 'Rusty Mackerel', 'Common', 0.8, 12, 'mackerel'),
  fish('f3', 'Bilge Seabass', 'Common', 1.5, 15, 'seabass'),
  fish('f4', 'Crimson Snapper', 'Uncommon', 4, 25, 'snapper'),
  fish('f5', 'Grog Grouper', 'Uncommon', 12, 30, 'grouper'),
  fish('f6', 'Corsair Cod', 'Uncommon', 8, 28, 'cod'),
  fish('f7', 'Treasure Tuna', 'Rare', 60, 50, 'tuna'),
  fish('f8', 'Cutlass Swordfish', 'Rare', 45, 55, 'swordfish'),
  fish('f9', 'Mahi Mahi', 'Rare', 25, 60, 'mahi'),
  fish('f10', 'Ironclad Marlin', 'Epic', 150, 100, 'marlin'),
  fish('f11', 'Storm Sailfish', 'Epic', 120, 110, 'sailfish'),
  fish('f12', 'Giant Bluefin', 'Epic', 400, 120, 'bluefin'),
  fish('f13', 'Ghost Megalodon', 'Legendary', 800, 250, 'megalodon'),
  fish('f14', 'Kraken Tentacle', 'Legendary', 500, 300, 'kraken'),
  fish('f15', 'Ghost Ship Leviathan', 'Mythic', 2000, 500, 'leviathan'),
];
export type Bait = 'worm' | 'shrimp' | 'squid';
export type Rod = 'bamboo' | 'carbon' | 'gold';
export const TACKLE = [
  { id: 'shrimp', name: 'Premium Shrimp', price: 40, amount: 5, level: 1, description: 'Five casts with a shorter wait.', image: '/assets/bait/bait_shrimp_1765863173083.png' },
  { id: 'squid', name: 'Rare Squid', price: 100, amount: 5, level: 1, description: 'Five casts with a 15% relative rare-tier weight boost.', image: '/assets/bait/bait_squid_1765863189969.png' },
  { id: 'carbon', name: 'Carbon Fiber Rod', price: 500, amount: 1, level: 5, description: 'A permanent rod upgrade. Earn 10% more catch XP.', image: '/assets/ui/fishing_rod_v4.png' },
  { id: 'gold', name: 'Golden Rod', price: 2500, amount: 1, level: 12, description: 'A permanent rod upgrade. Earn 20% more catch XP.', image: '/assets/ui/golden_pirate_rod_1765863136497.png' },
] as const;
export type Profile = {
  version: 2; xp: number; coins: number; totalCatches: number;
  catches: Record<string, { count: number; best: number }>;
  bait: Bait; baits: Record<'shrimp' | 'squid', number>; rod: Rod; rods: Rod[];
  daily: { day: string; catches: number; claimed: boolean };
};
export type Catch = { speciesId: string; weight: number };
export const dayKey = (now: number) => new Date(now).toISOString().slice(0, 10);
export const levelForXP = (xp: number) => Math.min(100, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
export const nextLevelXP = (xp: number) => levelForXP(xp) ** 2 * 100;
export function newProfile(now = Date.now()): Profile {
  return { version: 2, xp: 0, coins: 100, totalCatches: 0, catches: {}, bait: 'worm', baits: { shrimp: 0, squid: 0 }, rod: 'bamboo', rods: ['bamboo'], daily: { day: dayKey(now), catches: 0, claimed: false } };
}
const integer = (n: unknown, max = 1e9): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
/** Structural recovery only. Guest data is NEVER imported into an authenticated account. */
export function validateProfile(value: unknown, now = Date.now()): Profile {
  const fresh = () => newProfile(now);
  if (!record(value) || value.version !== 2 || !integer(value.xp) || !integer(value.coins) || !integer(value.totalCatches) || !record(value.catches) || !record(value.baits) || !record(value.daily)) return fresh();
  if (!['worm', 'shrimp', 'squid'].includes(String(value.bait)) || !['bamboo', 'carbon', 'gold'].includes(String(value.rod)) || !Array.isArray(value.rods)) return fresh();
  if (!value.rods.includes('bamboo') || !value.rods.includes(value.rod) || value.rods.some(r => !['bamboo', 'carbon', 'gold'].includes(r)) || new Set(value.rods).size !== value.rods.length) return fresh();
  if (!integer(value.baits.shrimp, 100000) || !integer(value.baits.squid, 100000)) return fresh();
  if (typeof value.daily.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.daily.day) || !integer(value.daily.catches) || typeof value.daily.claimed !== 'boolean') return fresh();
  const catches: Profile['catches'] = {};
  let count = 0;
  for (const [id, entry] of Object.entries(value.catches)) {
    const species = FISH.find(f => f.id === id);
    if (!species || !record(entry) || !integer(entry.count) || entry.count < 1 || typeof entry.best !== 'number' || !Number.isFinite(entry.best) || entry.best <= 0 || entry.best > species.weight * 1.5 + 0.01) return fresh();
    catches[id] = { count: entry.count, best: entry.best };
    count += entry.count;
  }
  if (count !== value.totalCatches) return fresh();
  return { version: 2, xp: value.xp, coins: value.coins, totalCatches: count, catches, bait: value.bait as Bait, baits: { shrimp: value.baits.shrimp, squid: value.baits.squid }, rod: value.rod as Rod, rods: [...value.rods] as Rod[], daily: { day: value.daily.day, catches: value.daily.catches, claimed: value.daily.claimed } };
}
export function buyTackle(profile: Profile, itemId: string): Profile {
  const item = TACKLE.find(i => i.id === itemId);
  if (!item) throw new Error('Unknown tackle.');
  if (levelForXP(profile.xp) < item.level) throw new Error(`Unlocks at level ${item.level}.`);
  if (profile.coins < item.price) throw new Error('Not enough earned coins.');
  if (item.id === 'shrimp' || item.id === 'squid') {
    if (profile.baits[item.id] > 99995) throw new Error('Bait box is full.');
    return { ...profile, coins: profile.coins - item.price, baits: { ...profile.baits, [item.id]: profile.baits[item.id] + item.amount } };
  }
  if (profile.rods.includes(item.id)) throw new Error('You already own this rod.');
  return { ...profile, coins: profile.coins - item.price, rods: [...profile.rods, item.id] };
}
export function equipTackle(profile: Profile, itemId: string): Profile {
  if (itemId === 'worm') return { ...profile, bait: 'worm' };
  if (itemId === 'shrimp' || itemId === 'squid') {
    if (profile.baits[itemId] < 1) throw new Error('No bait remaining.');
    return { ...profile, bait: itemId };
  }
  if (!profile.rods.includes(itemId as Rod)) throw new Error('Rod not owned.');
  return { ...profile, rod: itemId as Rod };
}
export function consumeBait(profile: Profile): Profile {
  if (profile.bait === 'worm') return profile;
  const remaining = profile.baits[profile.bait];
  if (remaining < 1) throw new Error('Choose available bait.');
  return { ...profile, baits: { ...profile.baits, [profile.bait]: remaining - 1 }, bait: remaining === 1 ? 'worm' : profile.bait };
}
export function chooseCatch(roll: number, weightRoll: number, bait: Bait = 'worm'): Catch {
  for (const v of [roll, weightRoll]) if (!Number.isFinite(v) || v < 0 || v >= 1) throw new Error('Random sample out of range.');
  const weights = [200, 200, 200, 83, 83, 84, 33, 33, 34, 13, 13, 14, 4.5, 4.5, 1].map((w, i) => w * (bait === 'squid' && i >= 6 ? 1.15 : 1));
  let target = roll * weights.reduce((a, b) => a + b, 0);
  let index = 0;
  while (index < weights.length - 1 && target >= weights[index]) target -= weights[index++];
  return { speciesId: FISH[index].id, weight: Math.round(FISH[index].weight * (0.75 + weightRoll * 0.75) * 100) / 100 };
}
export function awardCatch(profile: Profile, caught: Catch, now = Date.now()): Profile {
  const f = FISH.find(f => f.id === caught.speciesId);
  if (!f || !Number.isFinite(caught.weight) || caught.weight <= 0 || caught.weight > f.weight * 1.5 + 0.01) throw new Error('Invalid catch.');
  const existing = profile.catches[f.id];
  const daily = profile.daily.day === dayKey(now) ? profile.daily : { day: dayKey(now), catches: 0, claimed: false };
  const multiplier = profile.rod === 'gold' ? 1.2 : profile.rod === 'carbon' ? 1.1 : 1;
  return { ...profile, xp: profile.xp + Math.round(f.xp * multiplier), coins: profile.coins + Math.max(5, Math.round(f.xp / 2)), totalCatches: profile.totalCatches + 1, catches: { ...profile.catches, [f.id]: { count: (existing?.count ?? 0) + 1, best: Math.max(existing?.best ?? 0, caught.weight) } }, daily: { ...daily, catches: daily.catches + 1 } };
}
export function claimDaily(profile: Profile, now = Date.now()): Profile {
  if (profile.daily.day !== dayKey(now) || profile.daily.catches < 5 || profile.daily.claimed) throw new Error('Catch five fish today to claim this reward once.');
  return { ...profile, coins: profile.coins + 100, daily: { ...profile.daily, claimed: true } };
}
export type Reel = { elapsed: number; tension: number; progress: number; status: 'playing' | 'won' | 'lost' };
export type ReelInput = { at: number; hold: boolean };
export const newReel = (): Reel => ({ elapsed: 0, tension: 0.35, progress: 0, status: 'playing' });
/** Fixed 20 ms simulation step. UI and server replay use exactly the same integrator. */
export function stepReel(s: Reel, hold: boolean, seed: number): Reel {
  if (s.status !== 'playing') return s;
  const elapsed = s.elapsed + 20;
  const fight = Math.sin(elapsed / 700 + seed) * 0.045;
  const tension = Math.max(0, Math.min(1, s.tension + ((hold ? 0.18 : -0.28) + fight) * 0.02));
  const progress = Math.min(1, Math.max(0, s.progress + (hold ? 0.15 : -0.015) * 0.02));
  const status = tension >= 1 || tension <= 0 || elapsed >= 30000 ? 'lost' : progress >= 1 ? 'won' : 'playing';
  return { elapsed, tension, progress, status };
}
export function replayReel(seed: number, input: unknown, duration: number): Reel {
  if (!integer(seed, 0xffffffff) || !integer(duration, 30000) || duration < 20 || duration % 20 !== 0 || !Array.isArray(input) || input.length < 1 || input.length > 300) throw new Error('Invalid reel transcript.');
  let previous = -1;
  for (const event of input) {
    if (!record(event) || !integer(event.at, duration) || event.at % 20 !== 0 || event.at <= previous || typeof event.hold !== 'boolean') throw new Error('Invalid reel input.');
    previous = event.at;
  }
  const events = input as ReelInput[];
  if (events[0].at !== 0) throw new Error('Reel input must begin at zero.');
  let state = newReel(), index = 0;
  while (state.elapsed < duration && state.status === 'playing') {
    while (index + 1 < events.length && events[index + 1].at <= state.elapsed) index++;
    state = stepReel(state, events[index].hold, seed);
  }
  if (state.elapsed !== duration) throw new Error('Input continues after the reel ended.');
  return state;
}
