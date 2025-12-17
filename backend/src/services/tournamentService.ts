import { Tournament, TournamentEntry } from '@prisma/client';
import { broadcastTournamentUpdate } from '../sockets/tournamentSocket';
import { getPrisma, isMockMode, MOCK_TOURNAMENTS, MOCK_LEADERBOARD } from '../utils/db';

// Payout distribution percentages
const PAYOUT_STRUCTURE: Record<string, number[]> = {
  Daily: [0.5, 0.3, 0.15, 0.05], // Top 4: 50%, 30%, 15%, 5%
  Weekly: [0.5, 0.3, 0.15, 0.05], // Top 4: 50%, 30%, 15%, 5%
  Boss: [0.495, 0.3, 0.15, 0.05, 0.005], // Top 5: 49.5%, 30%, 15%, 5%, 0.5%
  Championship: [0.3, 0.25, 0.15, 0.1, 0.1, 0.05, 0.05] // Top 7
};

export const tournamentService = {
  /**
   * Get all active tournaments (OPEN or LIVE status)
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    // Return mock data if no database configured
    if (isMockMode()) {
      console.log('[TournamentService] Using mock tournaments');
      return MOCK_TOURNAMENTS as unknown as Tournament[];
    }

    const prisma = getPrisma();
    if (!prisma) return [];

    try {
      return await prisma.tournament.findMany({
        where: {
          endTime: { gt: new Date() },
          status: { in: ['OPEN', 'LIVE'] }
        },
        orderBy: { endTime: 'asc' },
        include: {
          entries: {
            include: { user: true },
            orderBy: { score: 'desc' },
            take: 10 // Top 10 for preview
          }
        }
      });
    } catch (error) {
      console.warn('[TournamentService] DB Error in getActiveTournaments:', error);
      return MOCK_TOURNAMENTS as unknown as Tournament[];
    }
  },

  /**
   * Get Leaderboard for a tournament
   */
  async getLeaderboard(tournamentId: string, limit = 50): Promise<any[]> {
    if (isMockMode()) {
      return MOCK_LEADERBOARD;
    }

    const prisma = getPrisma();
    if (!prisma) return MOCK_LEADERBOARD;

    try {
      return await prisma.tournamentEntry.findMany({
        where: { tournamentId },
        orderBy: { score: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              fid: true,
              username: true,
              pfpUrl: true,
              level: true
            }
          }
        }
      });
    } catch (error) {
      console.warn(`[TournamentService] DB Error in getLeaderboard for ${tournamentId}:`, error);
      return MOCK_LEADERBOARD;
    }
  },

  /**
   * Get Tournament by ID
   */
  async getTournamentById(id: string): Promise<Tournament | null> {
    if (isMockMode()) {
      return MOCK_TOURNAMENTS.find(t => t.id === id) as unknown as Tournament || null;
    }

    const prisma = getPrisma();
    if (!prisma) return null;

    try {
      return await prisma.tournament.findUnique({
        where: { id }
      });
    } catch (error) {
      console.warn(`[TournamentService] DB Error in getTournamentById for ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new tournament instance
   */
  async createTournament(input: {
    type: 'Daily' | 'Weekly' | 'Boss' | 'Championship';
    title: string;
    prizePool: number;
    entryFee: number;
    maxParticipants: number;
    durationMinutes: number;
  }): Promise<Tournament> {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error('Database not configured for write operations');
    }

    const houseCutPercent = input.type === 'Boss' || input.type === 'Championship' ? 20 : 10;

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + input.durationMinutes * 60 * 1000);

    const tournament = await prisma.tournament.create({
      data: {
        type: input.type,
        title: input.title,
        prizePool: input.prizePool,
        entryFee: input.entryFee,
        houseCutPercent,
        maxParticipants: input.maxParticipants,
        status: 'OPEN',
        startTime,
        endTime
      }
    });

    console.log(`[Tournament] Created ${tournament.type} tournament: ${tournament.title} (${tournament.id})`);

    return tournament;
  },

  /**
   * Submit a score for a tournament entry
   * Updates score if higher, creates entry if new
   */
  async submitScore(tournamentId: string, fid: number, score: number): Promise<TournamentEntry> {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error('Database not configured for write operations');
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!tournament || tournament.status === 'ENDED') {
      throw new Error('Tournament is not active');
    }

    // Check if user already has entry
    const existingEntry = await prisma.tournamentEntry.findUnique({
      where: {
        tournamentId_userId: { tournamentId, userId: fid }
      }
    });

    if (existingEntry) {
      // Only update if new score is higher
      if (score > existingEntry.score) {
        const updated = await prisma.tournamentEntry.update({
          where: { id: existingEntry.id },
          data: { score }
        });

        // Recalculate ranks
        await this.recalculateRanks(tournamentId);

        // Broadcast update to connected clients
        broadcastTournamentUpdate(tournamentId, 'SCORE_UPDATED');

        return updated;
      }

      return existingEntry;
    } else {
      // New entry - must be within transaction to handle participant count
      const entry = await prisma.$transaction(async (tx: any) => {
        const newEntry = await tx.tournamentEntry.create({
          data: {
            tournamentId,
            userId: fid,
            score,
            rank: 0,
            entryMethod: 'TICKET' // Default, should be set from entry flow
          }
        });

        await tx.tournament.update({
          where: { id: tournamentId },
          data: { currentParticipants: { increment: 1 } }
        });

        return newEntry;
      });

      await this.recalculateRanks(tournamentId);
      broadcastTournamentUpdate(tournamentId, 'NEW_ENTRY');

      return entry;
    }
  },

  /**
   * Recalculate ranks for all entries in a tournament
   */
  async recalculateRanks(tournamentId: string): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) return;

    const entries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      orderBy: { score: 'desc' }
    });

    // Update ranks in batch
    await Promise.all(
      entries.map((entry: TournamentEntry, index: number) =>
        prisma.tournamentEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 }
        })
      )
    );
  },

  /**
   * Settle tournament: Calculate winners, distribute prizes, close tournament
   * Called by cron job when tournament ends
   */
  async settleTournament(tournamentId: string): Promise<{
    tournamentId: string;
    grossPool: number;
    netPool: number;
    houseCutAmount: number;
    winners: Array<{
      fid: number;
      score: number;
      payout: number;
      address: string;
    }>;
  }> {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error('Database not configured for write operations');
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          orderBy: { score: 'desc' },
          take: 20,
          include: { user: true }
        }
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status === 'ENDED') {
      throw new Error('Tournament already settled');
    }

    console.log(`[Settlement] Processing ${tournament.title} (${tournamentId})`);

    const grossPool = Number(tournament.prizePool);
    const houseCutPercent = Number(tournament.houseCutPercent) / 100;
    const houseCutAmount = grossPool * houseCutPercent;
    const netPool = grossPool - houseCutAmount;

    const payoutStructure = PAYOUT_STRUCTURE[tournament.type] || [1.0];
    const winners: Array<{ fid: number; score: number; payout: number; address: string }> = [];

    // Calculate and assign payouts
    for (let i = 0; i < payoutStructure.length && i < tournament.entries.length; i++) {
      const entry = tournament.entries[i];
      const payout = netPool * payoutStructure[i];

      winners.push({
        fid: entry.userId,
        score: Number(entry.score),
        payout,
        address: entry.user.walletAddress || '0x0000000000000000000000000000000000000000'
      });

      // Update entry with payout amount
      await prisma.tournamentEntry.update({
        where: { id: entry.id },
        data: {
          rank: i + 1,
          payout
        }
      });

      // Add winnings to user's coin balance
      await prisma.user.update({
        where: { fid: entry.userId },
        data: {
          coins: { increment: Math.floor(payout) }
        }
      });
    }

    // Mark tournament as ended
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'ENDED',
        settledAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'TOURNAMENT_SETTLED',
        details: {
          tournamentId,
          type: tournament.type,
          grossPool,
          netPool,
          houseCutAmount,
          winners: winners.map(w => ({ fid: w.fid, payout: w.payout }))
        }
      }
    });

    console.log(`[Settlement] ${tournament.title} Complete`);
    console.log(`[Settlement] House Cut: $${houseCutAmount.toFixed(2)}`);
    console.log(
      `[Settlement] Winners:`,
      winners.map(w => `FID:${w.fid} ($${w.payout.toFixed(2)})`).join(', ')
    );

    broadcastTournamentUpdate(tournamentId, 'SETTLED');

    return {
      tournamentId,
      grossPool,
      netPool,
      houseCutAmount,
      winners
    };
  },

  /**
   * Auto-create new tournament instances when current ones fill or end
   * Called by cron scheduler
   */
  async autoCreateTournaments(): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) {
      console.log('[Auto-Create] Skipping - no database configured');
      return;
    }

    const now = new Date();

    // Check for Daily tournaments
    const activeDailies = await prisma.tournament.count({
      where: {
        type: 'Daily',
        status: { in: ['OPEN', 'LIVE'] },
        endTime: { gt: now }
      }
    });

    if (activeDailies === 0) {
      await this.createTournament({
        type: 'Daily',
        title: 'Daily Catch Challenge',
        prizePool: 30,
        entryFee: 0.5,
        maxParticipants: 60,
        durationMinutes: 1440 // 24 hours
      });
      console.log('[Auto-Create] Created Daily tournament');
    }

    // Check for Weekly tournaments (Sunday 12pm UTC)
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    if (dayOfWeek === 0 && hour === 12) {
      const activeWeeklies = await prisma.tournament.count({
        where: {
          type: 'Weekly',
          status: { in: ['OPEN', 'LIVE'] },
          endTime: { gt: now }
        }
      });

      if (activeWeeklies === 0) {
        await this.createTournament({
          type: 'Weekly',
          title: 'Weekly Masters',
          prizePool: 150,
          entryFee: 2.0,
          maxParticipants: 75,
          durationMinutes: 10080 // 7 days
        });
        console.log('[Auto-Create] Created Weekly tournament');
      }
    }
  },

  /**
   * Check and settle ended tournaments
   * Called by cron every 5 minutes
   */
  async checkAndSettleEndedTournaments(): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) return;

    try {
      const endedTournaments = await prisma.tournament.findMany({
        where: {
          status: { in: ['OPEN', 'LIVE'] },
          endTime: { lte: new Date() }
        }
      });

      for (const tournament of endedTournaments) {
        try {
          await this.settleTournament(tournament.id);
        } catch (error) {
          console.error(`[Settlement Error] Failed to settle ${tournament.id}:`, error);
        }
      }
    } catch (error) {
      console.warn('[TournamentService] Error checking ended tournaments:', error);
    }
  }
};
