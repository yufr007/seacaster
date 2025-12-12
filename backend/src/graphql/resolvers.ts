import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { tournamentService } from '../services/tournamentService';
import { catchValidationService } from '../services/catchValidationService';
import { marketplaceService } from '../services/marketplaceService';

const prisma = new PrismaClient();

export interface Context {
  userId?: number;
  fid?: number;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const resolvers = {
  Query: {
    // User queries
    me: async (_: any, __: any, context: Context) => {
      if (!context.isAuthenticated || !context.fid) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const user = await prisma.user.findUnique({
        where: { fid: context.fid },
        include: { inventory: true }
      });

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Add computed fields
      const catchCount = await prisma.catch.count({
        where: { userId: user.fid }
      });

      const tournamentWins = await prisma.tournamentEntry.count({
        where: { userId: user.fid, rank: 1 }
      });

      return { ...user, catchCount, tournamentWins };
    },

    user: async (_: any, { fid }: { fid: number }) => {
      const user = await prisma.user.findUnique({
        where: { fid },
        include: { inventory: true }
      });

      if (!user) {
        throw new GraphQLError('User not found');
      }

      const catchCount = await prisma.catch.count({ where: { userId: fid } });
      const tournamentWins = await prisma.tournamentEntry.count({
        where: { userId: fid, rank: 1 }
      });

      return { ...user, catchCount, tournamentWins };
    },

    leaderboard: async (_: any, { type, limit = 100 }: { type?: string; limit?: number }) => {
      const users = await prisma.user.findMany({
        orderBy: { xp: 'desc' },
        take: limit,
        include: { inventory: true }
      });

      return users.map((user, index) => ({
        user,
        score: user.xp,
        rank: index + 1
      }));
    },

    // Tournament queries
    activeTournaments: async () => {
      return await tournamentService.getActiveTournaments();
    },

    tournament: async (_: any, { id }: { id: string }) => {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: { entries: { include: { user: true } } }
      });

      if (!tournament) {
        throw new GraphQLError('Tournament not found');
      }

      // Calculate time remaining
      const timeRemaining = Math.max(0, tournament.endTime.getTime() - Date.now());

      return { ...tournament, timeRemaining };
    },

    tournamentLeaderboard: async (_: any, { tournamentId, limit = 50 }: { tournamentId: string; limit?: number }) => {
      return await prisma.tournamentEntry.findMany({
        where: { tournamentId },
        orderBy: { score: 'desc' },
        take: limit,
        include: { user: true, tournament: true }
      });
    },

    myTournaments: async (_: any, __: any, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      return await prisma.tournamentEntry.findMany({
        where: { userId: context.fid },
        orderBy: { joinedAt: 'desc' },
        include: { tournament: true, user: true }
      });
    },

    // Marketplace queries
    marketplaceListings: async (_: any, { itemType, status, limit = 50, offset = 0 }: any) => {
      const where: any = {};
      if (itemType) where.itemType = itemType;
      if (status) where.status = status;
      else where.status = 'ACTIVE';

      const [listings, total] = await Promise.all([
        prisma.marketplaceListing.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: { seller: true }
        }),
        prisma.marketplaceListing.count({ where })
      ]);

      return {
        listings,
        total,
        hasMore: offset + limit < total
      };
    },

    myListings: async (_: any, __: any, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      return await prisma.marketplaceListing.findMany({
        where: { sellerId: context.fid },
        orderBy: { createdAt: 'desc' },
        include: { seller: true }
      });
    },

    // Game data
    catchHistory: async (_: any, { userId, limit = 50 }: { userId?: number; limit?: number }, context: Context) => {
      const targetUserId = userId || context.fid;
      if (!targetUserId) throw new GraphQLError('User ID required');

      return await prisma.catch.findMany({
        where: { userId: targetUserId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: { user: true, tournament: true }
      });
    },

    fishCollection: async (_: any, { userId }: { userId: number }) => {
      const catches = await prisma.catch.findMany({
        where: { userId },
        orderBy: { timestamp: 'asc' }
      });

      // Group by fish ID
      const collection = new Map<string, any>();

      catches.forEach(c => {
        if (!collection.has(c.fishId)) {
          collection.set(c.fishId, {
            fishId: c.fishId,
            fishName: c.fishName,
            rarity: c.rarity,
            count: 0,
            firstCaught: c.timestamp,
            heaviest: c.weight
          });
        }

        const entry = collection.get(c.fishId)!;
        entry.count++;
        entry.heaviest = Math.max(entry.heaviest, c.weight);
      });

      return Array.from(collection.values());
    }
  },

  Mutation: {
    // User mutations
    syncUserProfile: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.isAuthenticated) throw new GraphQLError('Not authenticated');

      const user = await prisma.user.upsert({
        where: { fid: input.fid },
        update: {
          username: input.username,
          walletAddress: input.walletAddress,
          pfpUrl: input.pfpUrl,
          lastLogin: new Date()
        },
        create: {
          fid: input.fid,
          username: input.username,
          walletAddress: input.walletAddress,
          pfpUrl: input.pfpUrl,
          inventory: {
            create: {
              baits: { worm: 999 },
              rods: ['bamboo'],
              premiumParts: {},
              activeBaitId: 'worm',
              activeRodId: 'bamboo'
            }
          }
        },
        include: { inventory: true }
      });

      const catchCount = await prisma.catch.count({ where: { userId: user.fid } });
      const tournamentWins = await prisma.tournamentEntry.count({ where: { userId: user.fid, rank: 1 } });

      return { ...user, catchCount, tournamentWins };
    },

    claimDailyReward: async (_: any, __: any, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      const user = await prisma.user.findUnique({ where: { fid: context.fid } });
      if (!user) throw new GraphQLError('User not found');

      // Check if already claimed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastLogin = new Date(user.lastLogin);
      lastLogin.setHours(0, 0, 0, 0);

      if (today.getTime() === lastLogin.getTime()) {
        return {
          success: false,
          message: 'Already claimed today',
          coinsAwarded: 0,
          castsAwarded: 0,
          newStreak: user.streak
        };
      }

      // Calculate streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = user.streak;
      if (lastLogin.getTime() === yesterday.getTime()) {
        newStreak++;
      } else if (lastLogin.getTime() < yesterday.getTime()) {
        newStreak = 1; // Streak broken
      }

      const coinsAwarded = 20 * newStreak;
      const castsAwarded = 5;

      await prisma.user.update({
        where: { fid: context.fid },
        data: {
          lastLogin: new Date(),
          streak: newStreak,
          highestStreak: Math.max(user.highestStreak, newStreak),
          coins: user.coins + coinsAwarded,
          castsRemaining: Math.min(user.maxCasts, user.castsRemaining + castsAwarded)
        }
      });

      return {
        success: true,
        message: `Daily Bonus! +${coinsAwarded} Coins & +5 Casts!`,
        coinsAwarded,
        castsAwarded,
        newStreak
      };
    },

    openPrestigeChest: async (_: any, __: any, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      const user = await prisma.user.findUnique({ where: { fid: context.fid }, include: { inventory: true } });
      if (!user || !user.inventory) throw new GraphQLError('User not found');

      if (user.pendingChests <= 0) {
        return {
          success: false,
          message: 'No chests available',
          coinsAwarded: 0,
          baitsAwarded: {}
        };
      }

      const coinsAwarded = 5000;
      const baitsAwarded = { kraken_eye: 5 };

      // Update inventory
      const currentBaits = user.inventory.baits as any;
      currentBaits.kraken_eye = (currentBaits.kraken_eye || 0) + 5;

      await prisma.user.update({
        where: { fid: context.fid },
        data: {
          pendingChests: user.pendingChests - 1,
          coins: user.coins + coinsAwarded,
          castsRemaining: user.premium ? 9999 : user.maxCasts
        }
      });

      await prisma.inventory.update({
        where: { userId: context.fid },
        data: { baits: currentBaits }
      });

      return {
        success: true,
        message: `Prestige Rewards! +${coinsAwarded} Coins & 5 Kraken Eyes!`,
        coinsAwarded,
        baitsAwarded
      };
    },

    // Fishing mutations
    validateCatch: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      const validation = await catchValidationService.validateCatch(input, context.fid);

      if (!validation.valid) {
        return {
          valid: false,
          message: validation.reason,
          catch: null
        };
      }

      // Create catch record
      const catchRecord = await prisma.catch.create({
        data: {
          userId: context.fid,
          fishId: input.fishId,
          fishName: validation.fishData!.name,
          rarity: input.rarity,
          weight: input.weight,
          xpGained: validation.xpGained!,
          coinsGained: validation.coinsGained!,
          baitUsed: input.baitUsed,
          reactionTime: input.reactionTime,
          tournamentId: input.tournamentId || null
        },
        include: { user: true }
      });

      // Update tournament score if applicable
      if (input.tournamentId) {
        await tournamentService.submitScore(input.tournamentId, context.fid, input.weight);
      }

      return {
        valid: true,
        message: 'Catch validated',
        catch: catchRecord
      };
    },

    // Tournament mutations
    enterTournament: async (_: any, { tournamentId, entryMethod }: any, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) throw new GraphQLError('Tournament not found');

      if (tournament.status !== 'OPEN') {
        throw new GraphQLError('Tournament is not accepting entries');
      }

      if (tournament.currentParticipants >= tournament.maxParticipants) {
        throw new GraphQLError('Tournament is full');
      }

      // Check if already entered
      const existing = await prisma.tournamentEntry.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: context.fid
          }
        }
      });

      if (existing) {
        throw new GraphQLError('Already entered this tournament');
      }

      // Create entry
      const entry = await prisma.tournamentEntry.create({
        data: {
          tournamentId,
          userId: context.fid,
          entryMethod,
          score: 0,
          rank: 0
        },
        include: { tournament: true, user: true }
      });

      // Update participant count
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { currentParticipants: { increment: 1 } }
      });

      return entry;
    },

    // Marketplace mutations
    createListing: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      return await marketplaceService.createListing(context.fid, input);
    },

    buyListing: async (_: any, { listingId }: { listingId: string }, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      return await marketplaceService.buyListing(listingId, context.fid);
    },

    cancelListing: async (_: any, { listingId }: { listingId: string }, context: Context) => {
      if (!context.fid) throw new GraphQLError('Not authenticated');

      return await marketplaceService.cancelListing(listingId, context.fid);
    },

    // Admin mutations
    createTournament: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.isAdmin) throw new GraphQLError('Unauthorized');

      return await tournamentService.createTournament(input);
    },

    settleTournament: async (_: any, { tournamentId }: { tournamentId: string }, context: Context) => {
      if (!context.isAdmin) throw new GraphQLError('Unauthorized');

      return await tournamentService.settleTournament(tournamentId);
    }
  },

  // Field resolvers
  Tournament: {
    timeRemaining: (parent: any) => {
      return Math.max(0, Math.floor((parent.endTime.getTime() - Date.now()) / 1000));
    }
  },

  User: {
    inventory: async (parent: any) => {
      return await prisma.inventory.findUnique({ where: { userId: parent.fid } });
    }
  }
};
