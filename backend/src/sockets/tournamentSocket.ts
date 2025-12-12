import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Server as HTTPServer } from 'http';

const prisma = new PrismaClient();

let io: SocketIOServer;

/**
 * Initialize Socket.IO server for real-time tournament updates
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://seacaster.app',
      methods: ['GET', 'POST']
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join tournament room
    socket.on('join:tournament', async (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`[Socket.IO] ${socket.id} joined tournament:${tournamentId}`);

      // Send current leaderboard
      try {
        const leaderboard = await getTournamentLeaderboard(tournamentId);
        socket.emit('leaderboard:update', leaderboard);
      } catch (error) {
        console.error(`[Socket.IO] Error fetching leaderboard:`, error);
      }
    });

    // Leave tournament room
    socket.on('leave:tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`[Socket.IO] ${socket.id} left tournament:${tournamentId}`);
    });

    // Request leaderboard update
    socket.on('leaderboard:request', async (tournamentId: string) => {
      try {
        const leaderboard = await getTournamentLeaderboard(tournamentId);
        socket.emit('leaderboard:update', leaderboard);
      } catch (error) {
        console.error(`[Socket.IO] Error fetching leaderboard:`, error);
        socket.emit('error', { message: 'Failed to fetch leaderboard' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Start periodic leaderboard updates (every 5 seconds)
  startPeriodicUpdates();

  console.log('[Socket.IO] Server initialized');

  return io;
}

/**
 * Get current leaderboard for a tournament
 */
async function getTournamentLeaderboard(tournamentId: string) {
  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId },
    orderBy: { score: 'desc' },
    take: 50,
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

  return entries.map((entry, index) => ({
    rank: index + 1,
    fid: entry.user.fid,
    username: entry.user.username,
    pfpUrl: entry.user.pfpUrl,
    level: entry.user.level,
    score: Number(entry.score),
    payout: entry.payout ? Number(entry.payout) : null
  }));
}

/**
 * Broadcast tournament update to all clients in tournament room
 */
export function broadcastTournamentUpdate(
  tournamentId: string,
  action: 'NEW_ENTRY' | 'SCORE_UPDATED' | 'SETTLED' | 'STARTED' | 'ENDED'
) {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized');
    return;
  }

  io.to(`tournament:${tournamentId}`).emit('tournament:update', {
    tournamentId,
    action,
    timestamp: Date.now()
  });

  console.log(`[Socket.IO] Broadcast ${action} for tournament:${tournamentId}`);
}

/**
 * Broadcast leaderboard update for a specific tournament
 */
export async function broadcastLeaderboardUpdate(tournamentId: string) {
  if (!io) return;

  try {
    const leaderboard = await getTournamentLeaderboard(tournamentId);

    io.to(`tournament:${tournamentId}`).emit('leaderboard:update', leaderboard);

    console.log(`[Socket.IO] Leaderboard update sent for tournament:${tournamentId}`);
  } catch (error) {
    console.error(`[Socket.IO] Error broadcasting leaderboard:`, error);
  }
}

/**
 * Start periodic leaderboard updates for all active tournaments
 */
function startPeriodicUpdates() {
  // Update leaderboards every 5 seconds
  setInterval(async () => {
    try {
      const activeTournaments = await prisma.tournament.findMany({
        where: {
          status: { in: ['OPEN', 'LIVE'] },
          endTime: { gt: new Date() }
        },
        select: { id: true }
      });

      for (const tournament of activeTournaments) {
        // Check if anyone is watching this tournament
        const roomSize = io.sockets.adapter.rooms.get(`tournament:${tournament.id}`)?.size || 0;

        if (roomSize > 0) {
          await broadcastLeaderboardUpdate(tournament.id);
        }
      }
    } catch (error) {
      console.error('[Socket.IO] Error in periodic updates:', error);
    }
  }, 5000); // 5 seconds

  console.log('[Socket.IO] Periodic updates started (5s interval)');
}

/**
 * Get Socket.IO server instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}
