export enum GamePhase {
  IDLE = 'IDLE',
  CASTING = 'CASTING',
  WAITING = 'WAITING',
  HOOKED = 'HOOKED',
  CATCHING = 'CATCHING',
  ANIMATING_CATCH = 'ANIMATING_CATCH',
  REWARD = 'REWARD'
}

export enum Rarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  MYTHIC = 'Mythic'
}

export interface Fish {
  id: string;
  name: string;
  rarity: Rarity;
  weight: number;
  xp: number;
  image: string;
  catchWindow: number; // Seconds timing window
  description?: string;
}

export interface Bait {
  id: string;
  name: string;
  effect: string;
  bonus: number; // multiplier
  icon: string;
  rarity: Rarity;
  description: string;
}

export interface Rod {
  id: string;
  name: string;
  rarity: Rarity;
  levelRequired: number;
  perk: string;
}

export interface Inventory {
  baits: Record<string, number>;
  rods: string[]; // IDs of owned rods
  activeBaitId: string;
  activeRodId: string;
}

export interface UserStats {
  fid: number;
  username: string;
  xp: number;
  level: number;
  castsRemaining: number;
  maxCasts: number;
  lastCastRefill: number; // Timestamp
  lastLogin: number; // Timestamp for streak calculation
  coins: number;
  premium: boolean; // Season Pass status
  streak: number; // Daily login streak
  highestStreak: number;
  pendingChests: number; // Prestige Loot Chests
}

export interface Tournament {
  id: string;
  title: string;
  prizePool: number; // USDC
  timeLeft: string;
  endTime?: number; // Timestamp for precise countdown
  participants: number;
  maxParticipants: number;
  rank: number | null;
  entryFee: number; // USDC
  type: 'Daily' | 'Weekly' | 'Boss' | 'Champ';
  status: 'OPEN' | 'LIVE' | 'ENDED';
}

export interface LeaderboardEntry {
  fid: number;
  username: string;
  score: number; // Total weight or points
  rank: number;
  avatar: string;
}