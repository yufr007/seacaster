/**
 * Game Constants - Shared between frontend and backend
 * This file should be kept in sync with frontend constants.ts
 */

export enum Rarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  MYTHIC = 'Mythic'
}

// XP System
export const LEVEL_BASE_XP = 100;
export const LEVEL_EXPONENT = 1.4;

// Rarity Weights (base probabilities out of 1000)
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  [Rarity.MYTHIC]: 1, // 0.1%
  [Rarity.LEGENDARY]: 9, // 0.9%
  [Rarity.EPIC]: 40, // 4%
  [Rarity.RARE]: 100, // 10%
  [Rarity.UNCOMMON]: 250, // 25%
  [Rarity.COMMON]: 600 // 60%
};

// Fish Database
export interface Fish {
  id: string;
  name: string;
  rarity: Rarity;
  weight: number; // Average weight
  xp: number;
  catchWindow: number; // Seconds
  description: string;
}

export const FISH_TYPES: Fish[] = [
  // Common (60%)
  { id: 'sardine', name: 'Sardine', rarity: Rarity.COMMON, weight: 0.2, xp: 10, catchWindow: 2.0, description: 'A small, silvery fish' },
  { id: 'anchovy', name: 'Anchovy', rarity: Rarity.COMMON, weight: 0.15, xp: 10, catchWindow: 2.0, description: 'Tiny but tasty' },
  { id: 'herring', name: 'Herring', rarity: Rarity.COMMON, weight: 0.3, xp: 10, catchWindow: 2.0, description: 'A common schooling fish' },
  { id: 'perch', name: 'Perch', rarity: Rarity.COMMON, weight: 0.5, xp: 12, catchWindow: 1.8, description: 'Freshwater favorite' },

  // Uncommon (25%)
  { id: 'mackerel', name: 'Mackerel', rarity: Rarity.UNCOMMON, weight: 1.0, xp: 25, catchWindow: 1.5, description: 'Fast and feisty' },
  { id: 'bass', name: 'Sea Bass', rarity: Rarity.UNCOMMON, weight: 1.5, xp: 28, catchWindow: 1.5, description: 'A prized catch' },
  { id: 'cod', name: 'Cod', rarity: Rarity.UNCOMMON, weight: 2.0, xp: 30, catchWindow: 1.4, description: 'Cold water dweller' },

  // Rare (10%)
  { id: 'tuna', name: 'Tuna', rarity: Rarity.RARE, weight: 5.0, xp: 50, catchWindow: 1.0, description: 'Powerful swimmer' },
  { id: 'barracuda', name: 'Barracuda', rarity: Rarity.RARE, weight: 4.5, xp: 55, catchWindow: 1.0, description: 'Sharp-toothed predator' },
  { id: 'snapper', name: 'Red Snapper', rarity: Rarity.RARE, weight: 3.5, xp: 48, catchWindow: 1.1, description: 'Delicious and elusive' },

  // Epic (4%)
  { id: 'swordfish', name: 'Swordfish', rarity: Rarity.EPIC, weight: 10.0, xp: 100, catchWindow: 0.75, description: 'Majestic billfish' },
  { id: 'marlin', name: 'Blue Marlin', rarity: Rarity.EPIC, weight: 12.0, xp: 110, catchWindow: 0.75, description: 'The ultimate game fish' },
  { id: 'shark', name: 'Tiger Shark', rarity: Rarity.EPIC, weight: 15.0, xp: 120, catchWindow: 0.7, description: 'Apex predator' },

  // Legendary (0.9%)
  { id: 'megalodon', name: 'Megalodon', rarity: Rarity.LEGENDARY, weight: 50.0, xp: 250, catchWindow: 0.5, description: 'Ancient giant' },
  { id: 'kraken', name: 'Kraken Tentacle', rarity: Rarity.LEGENDARY, weight: 45.0, xp: 260, catchWindow: 0.5, description: 'Legendary sea monster' },

  // Mythic (0.1%)
  { id: 'ghost_ship', name: 'Ghost Ship Wreckage', rarity: Rarity.MYTHIC, weight: 100.0, xp: 500, catchWindow: 0.5, description: 'Cursed pirate treasure' },
  { id: 'leviathan', name: 'Leviathan', rarity: Rarity.MYTHIC, weight: 150.0, xp: 550, catchWindow: 0.5, description: 'The Beast Below' }
];

// Bait System
export interface Bait {
  id: string;
  name: string;
  effect: string; // Type of effect
  bonus: number; // Multiplier or flat bonus
  rarity: Rarity;
  description: string;
}

export const BAITS: Record<string, Bait> = {
  worm: {
    id: 'worm',
    name: 'Basic Worm',
    effect: 'None',
    bonus: 1.0,
    rarity: Rarity.COMMON,
    description: 'Infinite default bait'
  },
  shrimp: {
    id: 'shrimp',
    name: 'Premium Shrimp',
    effect: 'Speed',
    bonus: 0.85, // 15% faster bite
    rarity: Rarity.UNCOMMON,
    description: 'Speeds up bites by 15%'
  },
  lure: {
    id: 'lure',
    name: 'Uncommon Lure',
    effect: 'Rare+',
    bonus: 1.10, // +10% rare chance
    rarity: Rarity.UNCOMMON,
    description: 'Increases rare fish chance'
  },
  squid: {
    id: 'squid',
    name: 'Rare Squid',
    effect: 'Rare++',
    bonus: 1.15, // +15% rare chance
    rarity: Rarity.RARE,
    description: 'Greatly increases rare fish chance'
  },
  chum: {
    id: 'chum',
    name: 'Epic Chum',
    effect: 'Epic+',
    bonus: 1.25, // +25% epic+ chance
    rarity: Rarity.EPIC,
    description: 'Attracts epic and legendary fish'
  },
  kraken_eye: {
    id: 'kraken_eye',
    name: 'Kraken Eye',
    effect: 'Legendary',
    bonus: 1.50, // +50% legendary chance
    rarity: Rarity.LEGENDARY,
    description: 'Summons legendary creatures'
  }
};

// Tournament Configuration
export interface TournamentConfig {
  type: 'Daily' | 'Weekly' | 'Boss' | 'Championship';
  prizePool: number;
  entryFee: number;
  maxParticipants: number;
  houseCutPercent: number;
  duration: number; // minutes
}

export const TOURNAMENT_CONFIG: Record<string, TournamentConfig> = {
  Daily: {
    type: 'Daily',
    prizePool: 30,
    entryFee: 0.5,
    maxParticipants: 60,
    houseCutPercent: 10,
    duration: 1440 // 24 hours
  },
  Weekly: {
    type: 'Weekly',
    prizePool: 150,
    entryFee: 2.0,
    maxParticipants: 75,
    houseCutPercent: 10,
    duration: 10080 // 7 days
  },
  Boss: {
    type: 'Boss',
    prizePool: 247.69,
    entryFee: 7.99,
    maxParticipants: 31,
    houseCutPercent: 20,
    duration: 1440 // 24 hours
  },
  Championship: {
    type: 'Championship',
    prizePool: 10000,
    entryFee: 50,
    maxParticipants: 200,
    houseCutPercent: 20,
    duration: 10080 // 7 days
  }
};
