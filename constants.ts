
import { Rarity, Fish, Bait, Rod } from './types';

// ============================================
// BASE SEPOLIA TESTNET CONTRACTS (DEPLOYED)
// ============================================
export const CONTRACTS = {
  USDC: '0x0Cb77646C49a01a1053bAf01072954e69ce55965',
  SEACASTER_PASS: '0x6E1A9f233A4128d0386Ac8cD6A53844787891971',
  TOURNAMENT_ESCROW: '0x9465e54e3287ea00E4cF243f86FB927849e780e3',
  MARKETPLACE: '0x47DD58c99EE81910f4631Df3aF8Cc8FbfBb25Baf'
} as const;

export const TOKEN_IDS = {
  SEASON_PASS: 1,
  PIRATE: {
    HANDLE: 100,
    ROD_BODY: 200,
    HOOK: 300,
    REEL: 400,
    ANIMATION: 500
  },
  TICKETS: {
    DAILY: 1000,
    WEEKLY: 1001,
    BOSS: 1002,
    CHAMPIONSHIP: 1003
  }
} as const;

export const CHAIN_CONFIG = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  usdcDecimals: 6
} as const;

// ============================================
// GAME CONSTANTS
// ============================================
export const LEVEL_BASE_XP = 100;
export const LEVEL_EXPONENT = 1.4; // 40% increase per level

// Probability Weights (out of 1000)
export const RARITY_WEIGHTS = {
  [Rarity.COMMON]: 600,    // 60%
  [Rarity.UNCOMMON]: 250,  // 25%
  [Rarity.RARE]: 100,      // 10%
  [Rarity.EPIC]: 40,       // 4%
  [Rarity.LEGENDARY]: 9,   // 0.9%
  [Rarity.MYTHIC]: 1       // 0.1%
};

// Exact Tournament Economics
export const TOURNAMENT_CONFIG = {
  DAILY: {
    id: '1',
    title: 'Daily Skirmish',
    entryFee: 0.50,
    prizePool: 30.00,
    maxParticipants: 60,
    distribution: '90/10', // 90% to winners, 10% house
    houseCut: 3.00,
    type: 'Daily'
  },
  WEEKLY: {
    id: '2',
    title: 'Weekly Pro',
    entryFee: 2.00,
    prizePool: 150.00,
    maxParticipants: 75,
    distribution: '90/10',
    houseCut: 15.00,
    type: 'Weekly'
  },
  BOSS: {
    id: '3',
    title: 'Kraken Boss Raid',
    entryFee: 7.99,
    prizePool: 247.69,
    maxParticipants: 31,
    distribution: '80/20',
    houseCut: 49.54,
    type: 'Boss'
  },
  CHAMP: {
    id: '4',
    title: 'World Championship',
    entryFee: 50.00,
    prizePool: 10000.00,
    maxParticipants: 200,
    distribution: '80/20',
    houseCut: 2000.00,
    type: 'Champ'
  }
} as const;

export const FISH_TYPES: Fish[] = [
  // Common (60%) - Use premium PNGs
  { id: 'f1', name: 'Salty Sardine', rarity: Rarity.COMMON, weight: 0.2, xp: 10, catchWindow: 2.0, image: '/assets/fish/sardine.png', description: 'A common snack for pirates.' },
  { id: 'f2', name: 'Rusty Mackerel', rarity: Rarity.COMMON, weight: 0.8, xp: 12, catchWindow: 2.0, image: '/assets/fish/mackerel.png', description: 'Tastes like old coins.' },
  { id: 'f3', name: 'Bilge Seabass', rarity: Rarity.COMMON, weight: 1.5, xp: 15, catchWindow: 2.0, image: '/assets/fish/seabass.png', description: 'Found near the hull.' },

  // Uncommon (25%)
  { id: 'f4', name: 'Crimson Snapper', rarity: Rarity.UNCOMMON, weight: 4.0, xp: 25, catchWindow: 1.5, image: '/assets/fish/snapper.png', description: 'Red as a sunset.' },
  { id: 'f5', name: 'Grog Grouper', rarity: Rarity.UNCOMMON, weight: 12.0, xp: 30, catchWindow: 1.5, image: '/assets/fish/grouper.png', description: 'Looks grumpy.' },
  { id: 'f6', name: 'Corsair Cod', rarity: Rarity.UNCOMMON, weight: 8.0, xp: 28, catchWindow: 1.5, image: '/assets/fish/cod.png', description: 'Swims in formation.' },

  // Rare (10%)
  { id: 'f7', name: 'Treasure Tuna', rarity: Rarity.RARE, weight: 60.0, xp: 50, catchWindow: 1.0, image: '/assets/fish/tuna.png', description: 'Scales shine like doubloons.' },
  { id: 'f8', name: 'Cutlass Swordfish', rarity: Rarity.RARE, weight: 45.0, xp: 55, catchWindow: 1.0, image: '/assets/fish/swordfish.png', description: 'Sharp enough to shave with.' },
  { id: 'f9', name: 'Mahi Mahi', rarity: Rarity.RARE, weight: 25.0, xp: 60, catchWindow: 1.0, image: '/assets/fish/mahi.png', description: 'The dorado of the deep.' },

  // Epic (4%)
  { id: 'f10', name: 'Ironclad Marlin', rarity: Rarity.EPIC, weight: 150.0, xp: 100, catchWindow: 0.75, image: '/assets/fish/marlin.png', description: 'Breaks weak lines easily.' },
  { id: 'f11', name: 'Storm Sailfish', rarity: Rarity.EPIC, weight: 120.0, xp: 110, catchWindow: 0.75, image: '/assets/fish/sailfish.png', description: 'Fast as lightning.' },
  { id: 'f12', name: 'Giant Bluefin', rarity: Rarity.EPIC, weight: 400.0, xp: 120, catchWindow: 0.75, image: '/assets/fish/bluefin.png', description: 'The king of tunas.' },

  // Legendary (0.9%)
  { id: 'f13', name: 'Ghost Megalodon', rarity: Rarity.LEGENDARY, weight: 800.0, xp: 250, catchWindow: 0.5, image: '/assets/fish/megalodon.png', description: 'Thought to be extinct...' },
  { id: 'f14', name: 'Kraken Tentacle', rarity: Rarity.LEGENDARY, weight: 500.0, xp: 300, catchWindow: 0.5, image: '/assets/fish/kraken.png', description: 'Just a piece of the beast.' },

  // Mythic (0.1%)
  { id: 'f15', name: 'Ghost Ship Leviathan', rarity: Rarity.MYTHIC, weight: 2000.0, xp: 500, catchWindow: 0.5, image: '/assets/fish/leviathan.png', description: 'The Flying Dutchman itself.' },
];

export const BAITS: Record<string, Bait> = {
  'worm': { id: 'worm', name: 'Basic Worm', effect: 'None', bonus: 1, icon: '/assets/bait/bait_worm_1765863155303.png', rarity: Rarity.COMMON, description: 'Standard catch rates.' },
  'shrimp': { id: 'shrimp', name: 'Premium Shrimp', effect: 'Speed', bonus: 1.15, icon: '/assets/bait/bait_shrimp_1765863173083.png', rarity: Rarity.UNCOMMON, description: '+15% bite speed.' },
  'lure': { id: 'lure', name: 'Uncommon Lure', effect: 'Rare+', bonus: 1.10, icon: '/assets/bait/bait_minnow_1765863236305.png', rarity: Rarity.UNCOMMON, description: '+10% rare chance.' },
  'squid': { id: 'squid', name: 'Rare Squid', effect: 'Rare++', bonus: 1.15, icon: '/assets/bait/bait_squid_1765863189969.png', rarity: Rarity.RARE, description: '+15% rare chance.' },
  'chum': { id: 'chum', name: 'Epic Chum', effect: 'Epic+', bonus: 1.25, icon: '/assets/bait/bait_legendary_chum_1765863253233.png', rarity: Rarity.EPIC, description: '+25% epic+ chance.' },
  'kraken_eye': { id: 'kraken_eye', name: 'Kraken Bait', effect: 'Legendary', bonus: 1.50, icon: '/assets/bait/bait_kraken_eye.png.jpg', rarity: Rarity.LEGENDARY, description: '+50% legendary chance.' },
};

export const RODS: Record<string, Rod & { image: string }> = {
  'bamboo': { id: 'bamboo', name: 'Bamboo Pole', rarity: Rarity.COMMON, levelRequired: 1, perk: 'None', image: '/assets/ui/fishing_rod.png' },
  'fiberglass': { id: 'fiberglass', name: 'Fiberglass Rod', rarity: Rarity.UNCOMMON, levelRequired: 10, perk: '+5% XP', image: '/assets/ui/fishing_rod.png' },
  'carbon': { id: 'carbon', name: 'Carbon Fiber', rarity: Rarity.RARE, levelRequired: 20, perk: '+10% XP', image: '/assets/ui/fishing_rod.png' },
  'gold': { id: 'gold', name: 'Golden Rod', rarity: Rarity.LEGENDARY, levelRequired: 50, perk: '+50% XP', image: '/assets/ui/golden_pirate_rod_1765863136497.png' },
  'pirate': { id: 'pirate', name: 'Pirate Captain Rod', rarity: Rarity.MYTHIC, levelRequired: 100, perk: '+100% XP', image: '/assets/fish/pirate_rod.png' },
};

export const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: 'text-gray-300 border-gray-400',
  [Rarity.UNCOMMON]: 'text-green-400 border-green-500',
  [Rarity.RARE]: 'text-blue-400 border-blue-500',
  [Rarity.EPIC]: 'text-purple-400 border-purple-500',
  [Rarity.LEGENDARY]: 'text-yellow-400 border-yellow-500',
  [Rarity.MYTHIC]: 'text-pink-500 border-pink-500',
};

export const RARITY_BG: Record<Rarity, string> = {
  [Rarity.COMMON]: 'bg-gray-800/80',
  [Rarity.UNCOMMON]: 'bg-green-900/80',
  [Rarity.RARE]: 'bg-blue-900/80',
  [Rarity.EPIC]: 'bg-purple-900/80',
  [Rarity.LEGENDARY]: 'bg-yellow-900/80',
  [Rarity.MYTHIC]: 'bg-pink-900/80',
};
