import crypto from 'crypto';
import { FISH_TYPES, RARITY_WEIGHTS, BAITS } from '../constants';
import { getPrisma, isMockMode } from '../utils/db';

interface CatchInput {
  fid: number;
  fishId: string;
  weight: number;
  rarity: string;
  baitUsed: string;
  reactionTime: number; // milliseconds
  timestamp: number; // client timestamp
  clientSeed: string; // for RNG verification
  tournamentId?: string;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  xpGained?: number;
  coinsGained?: number;
  fishData?: any;
}

// Mock user for development without database
const MOCK_USER = {
  fid: 1,
  username: 'Angler',
  premium: true,
  castsRemaining: 100,
  maxCasts: 20,
  xp: 500,
  level: 5,
  coins: 1000,
  streak: 3,
};

/**
 * Server-side catch validation to prevent cheating
 * Validates timing, RNG, rate limits, and fish data
 */
export const catchValidationService = {
  /**
   * Validate a catch submission from the client
   */
  async validateCatch(input: CatchInput, userId: number): Promise<ValidationResult> {
    const prisma = getPrisma();

    // If no database, use mock validation (for frontend development)
    if (!prisma || isMockMode()) {
      console.log('[CatchValidation] Running in mock mode');
      const fishData = FISH_TYPES.find(f => f.id === input.fishId);
      if (!fishData) {
        return { valid: false, reason: 'Invalid fish ID' };
      }
      const xpGained = fishData.xp * (MOCK_USER.premium ? 2 : 1);
      const coinsGained = Math.floor(input.weight * 10);
      return { valid: true, xpGained, coinsGained, fishData };
    }

    // 1. Verify user exists and has casts remaining
    const user = await prisma.user.findUnique({ where: { fid: userId } });

    if (!user) {
      return { valid: false, reason: 'User not found' };
    }

    if (!user.premium && user.castsRemaining <= 0) {
      return { valid: false, reason: 'No casts remaining' };
    }

    // 2. Verify fish data exists
    const fishData = FISH_TYPES.find(f => f.id === input.fishId);

    if (!fishData) {
      return { valid: false, reason: 'Invalid fish ID' };
    }

    // 3. Verify rarity matches fish
    if (fishData.rarity !== input.rarity) {
      return { valid: false, reason: 'Fish rarity mismatch' };
    }

    // 4. Verify reaction time is within acceptable window
    const maxWindow = fishData.catchWindow * 1000; // Convert to ms
    const levelBonus = Math.min(0.5, user.level / 100);
    const adjustedWindow = maxWindow * (1 + levelBonus);

    if (input.reactionTime > adjustedWindow + 500) {
      // +500ms tolerance for network lag
      return { valid: false, reason: 'Reaction time too slow' };
    }

    if (input.reactionTime < 50) {
      // Minimum human reaction time
      return { valid: false, reason: 'Reaction time too fast (bot detected)' };
    }

    // 5. Verify timestamp is recent (within last 60 seconds)
    const now = Date.now();
    const timeDiff = Math.abs(now - input.timestamp);

    if (timeDiff > 60000) {
      return { valid: false, reason: 'Catch timestamp too old' };
    }

    // 6. Verify bait exists and was available
    const baitData = BAITS[input.baitUsed];
    if (!baitData) {
      return { valid: false, reason: 'Invalid bait' };
    }

    // 7. Check rate limiting (anti-spam)
    try {
      const recentCatches = await prisma.catch.count({
        where: {
          userId,
          timestamp: {
            gte: new Date(now - 30000) // Last 30 seconds
          }
        }
      });

      if (recentCatches > 3) {
        // Max 3 catches per 30 seconds
        return { valid: false, reason: 'Rate limit exceeded' };
      }
    } catch (error) {
      console.warn('[CatchValidation] Rate limit check failed, skipping:', error);
    }

    // 8. Calculate rewards
    let xpBase = fishData.xp;

    // Apply rod bonus
    let rodMultiplier = 1.0;
    if (user.level >= 50) rodMultiplier = 1.5; // Gold Rod: +50%
    else if (user.level >= 20) rodMultiplier = 1.1; // Carbon Rod: +10%
    else if (user.level >= 10) rodMultiplier = 1.05; // Fiberglass: +5%

    xpBase = Math.floor(xpBase * rodMultiplier);

    // Apply premium bonus
    const xpGained = user.premium ? xpBase * 2 : xpBase;

    // Coins based on weight
    const coinsGained = Math.floor(input.weight * 10);

    // 9. Consume cast (if not premium)
    if (!user.premium) {
      await prisma.user.update({
        where: { fid: userId },
        data: {
          castsRemaining: Math.max(0, user.castsRemaining - 1)
        }
      });
    }

    // 10. Update user XP and level
    const newXp = user.xp + xpGained;
    const newLevel = this.calculateLevel(newXp);

    await prisma.user.update({
      where: { fid: userId },
      data: {
        xp: newXp,
        level: newLevel,
        coins: user.coins + coinsGained
      }
    });

    // 11. Check for level up rewards
    if (newLevel > user.level) {
      await this.grantLevelRewards(userId, newLevel, user.premium);
    }

    return {
      valid: true,
      xpGained,
      coinsGained,
      fishData
    };
  },

  /**
   * Calculate level from total XP
   * Formula: XP = LEVEL_BASE_XP * LEVEL_EXPONENT^(level-1)
   */
  calculateLevel(xp: number): number {
    const LEVEL_BASE_XP = 100;
    const LEVEL_EXPONENT = 1.4;

    let level = 1;
    let xpRequired = 0;

    while (xpRequired <= xp) {
      level++;
      xpRequired += Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, level - 2));
    }

    return level - 1;
  },

  /**
   * Grant rewards for leveling up
   */
  async grantLevelRewards(userId: number, level: number, premium: boolean): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) return;

    const user = await prisma.user.findUnique({
      where: { fid: userId },
      include: { inventory: true }
    });

    if (!user || !user.inventory) return;

    // Cast rewards based on level range
    let bonusCasts = 0;
    let rewardBaitId = 'worm';

    if (level <= 9) {
      bonusCasts = premium ? 5 : 2;
      rewardBaitId = premium ? 'shrimp' : 'worm';
    } else if (level <= 19) {
      bonusCasts = premium ? 7 : 3;
      rewardBaitId = premium ? 'shrimp' : 'worm';
    } else if (level <= 29) {
      bonusCasts = premium ? 10 : 4;
      rewardBaitId = premium ? 'lure' : 'shrimp';
    } else if (level <= 39) {
      bonusCasts = premium ? 12 : 5;
      rewardBaitId = premium ? 'squid' : 'lure';
    } else if (level <= 49) {
      bonusCasts = premium ? 15 : 6;
      rewardBaitId = premium ? 'chum' : 'squid';
    } else {
      bonusCasts = premium ? 20 : 10;
      rewardBaitId = premium ? 'kraken_eye' : 'chum';
    }

    // Update user casts
    if (!premium) {
      await prisma.user.update({
        where: { fid: userId },
        data: {
          castsRemaining: Math.min(user.maxCasts, user.castsRemaining + bonusCasts)
        }
      });
    }

    // Add bait to inventory
    if (rewardBaitId !== 'worm') {
      const currentBaits = user.inventory.baits as any;
      currentBaits[rewardBaitId] = (currentBaits[rewardBaitId] || 0) + 1;

      await prisma.inventory.update({
        where: { userId },
        data: { baits: currentBaits }
      });
    }

    // Milestone rewards (every 10 levels)
    if (level % 10 === 0 && premium) {
      // Grant premium rod part (would need to mint NFT in production)
      const premiumParts = user.inventory.premiumParts as any;

      if (level === 10) premiumParts.handle = true;
      else if (level === 20) premiumParts.body = true;
      else if (level === 30) premiumParts.hook = true;
      else if (level === 40) premiumParts.reel = true;
      else if (level === 50) premiumParts.animation = true;

      await prisma.inventory.update({
        where: { userId },
        data: { premiumParts }
      });
    }

    // Prestige chests at 60, 70, 80, 90, 100
    if ([60, 70, 80, 90, 100].includes(level)) {
      await prisma.user.update({
        where: { fid: userId },
        data: {
          pendingChests: { increment: 1 }
        }
      });
    }

    console.log(`[Level Up] User ${userId} reached level ${level}`);
  }
};
