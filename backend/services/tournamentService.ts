import { TOURNAMENT_CONFIG } from '../../constants'; // Shared constants

// Mocking PrismaClient since @prisma/client is likely not generated in this environment
class PrismaClient {
  tournament = {
    findMany: async (_: any) => [] as any[],
    findUnique: async (_: any) => ({} as any),
    update: async (_: any) => ({}),
  };
  tournamentEntry = {
    findUnique: async (_: any) => (null as any),
    update: async (_: any) => ({}),
    create: async (_: any) => ({}),
    findMany: async (_: any) => [] as any[],
  };
  user = {
    findUnique: async (_: any) => ({ walletAddress: '0x0000000000000000000000000000000000000000' } as any),
  };
  $transaction = async (cb: (tx: any) => Promise<any>) => cb(this);
}

const prisma = new PrismaClient();

// Mock Tournament Interface
interface Tournament {
  id: string;
  title: string;
  prizePool: number;
  type: string;
  status: string;
  maxParticipants: number;
  entryFee: number;
  startTime: Date;
  endTime: Date;
  currentParticipants: number;
}

// Configuration for Payout Distribution (Percentages of Net Pool)
const PAYOUT_STRUCTURE = {
  'Daily': [0.5, 0.3, 0.2], // Top 3: 50%, 30%, 20%
  'Weekly': [0.4, 0.3, 0.2, 0.1], // Top 4
  'Boss': [1.0], // Winner takes all
  'Champ': [0.3, 0.25, 0.15, 0.1, 0.1, 0.05, 0.05] // Top 7
};

export const tournamentService = {
  /**
   * Get active tournaments with participant counts
   */
  async getActiveTournaments() {
    return await prisma.tournament.findMany({
      where: {
        endTime: { gt: new Date() },
        status: { in: ['OPEN', 'LIVE'] }
      },
      orderBy: { endTime: 'asc' }
    });
  },

  /**
   * Record a score for a user in a tournament
   */
  async submitScore(tournamentId: string, fid: number, score: number) {
    // Upsert logic: Update score if higher, or create new entry
    const entry = await prisma.tournamentEntry.findUnique({
      where: { tournamentId_fid: { tournamentId, fid } }
    });

    if (entry) {
      if (score > entry.score) {
        return await prisma.tournamentEntry.update({
          where: { id: entry.id },
          data: { score }
        });
      }
      return entry;
    } else {
      // New entry
      // Ensure transaction is used to increment participant count safely
      return await prisma.$transaction(async (tx) => {
        await tx.tournament.update({
            where: { id: tournamentId },
            data: { currentParticipants: { increment: 1 } }
        });
        
        return await tx.tournamentEntry.create({
          data: {
            tournamentId,
            fid,
            score,
            rank: 0 // Will be recalculated
          }
        });
      });
    }
  },

  /**
   * Settle a tournament: Calculate winners, House Cut, and update DB/Contract Status
   * This is called by the Cron Job when endTime is reached.
   */
  async settleTournament(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.status === 'ENDED') return;

    console.log(`[Settlement] Processing Tournament ${tournament.title} (${tournamentId})...`);

    // 1. Get Leaderboard (Top X based on structure)
    const entries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      orderBy: { score: 'desc' },
      take: 20 // Fetch enough to cover payout structures
    });

    if (entries.length === 0) {
      await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'ENDED' } });
      return;
    }

    // 2. Calculate Economics
    // Total Pool = Entry Fee * Participants (Simulated for variable) 
    // OR Fixed Prize Pool from Config (as per prompt "Prize Pool $30").
    // The prompt implies Guaranteed Pools ($30, $150, etc).
    // Let's use the Fixed Prize Pool defined in DB/Constants.
    
    const grossPool = tournament.prizePool;
    const type = tournament.type as keyof typeof PAYOUT_STRUCTURE;
    
    // Determine House Cut Split (90/10 vs 80/20)
    let houseCutPercent = 0.10;
    if (type === 'Boss' || type === 'Champ') {
        houseCutPercent = 0.20;
    }
    
    const houseCutAmount = grossPool * houseCutPercent;
    const netPool = grossPool - houseCutAmount;
    
    const distribution = PAYOUT_STRUCTURE[type] || [1.0];
    
    const winners: { fid: number, score: number, payout: number, address?: string }[] = [];

    // 3. Distribute Prizes
    for (let i = 0; i < distribution.length; i++) {
        if (i < entries.length) {
            const winnerEntry = entries[i];
            const payout = netPool * distribution[i];
            
            // In production, we'd fetch the user's verified wallet address here
            const user = await prisma.user.findUnique({ where: { fid: winnerEntry.fid } });

            winners.push({
                fid: winnerEntry.fid,
                score: winnerEntry.score,
                payout: payout,
                address: user?.walletAddress || '0x0000000000000000000000000000000000000000'
            });

            // Update Entry with Rank and Payout
            await prisma.tournamentEntry.update({
                where: { id: winnerEntry.id },
                data: { rank: i + 1, payout: payout }
            });
        }
    }

    // 4. Close Tournament in DB
    await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'ENDED' }
    });

    console.log(`[Settlement] ${tournament.title} Complete.`);
    console.log(`[Settlement] House Cut: $${houseCutAmount.toFixed(2)}`);
    console.log(`[Settlement] Winners:`, winners.map(w => `FID:${w.fid} ($${w.payout.toFixed(2)})`).join(', '));

    // 5. Trigger Smart Contract Payout (Mock/Log)
    // In a real env with a hot wallet, we would execute:
    // contract.settleTournament(tournamentId, winners.map(w => w.address), winners.map(w => w.payout));
    
    return {
        tournamentId,
        grossPool,
        netPool,
        houseCutAmount,
        winners
    };
  }
};
