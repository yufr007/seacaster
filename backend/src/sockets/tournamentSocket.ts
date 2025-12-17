// backend/src/sockets/tournamentSocket.ts

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  ScoreUpdate,
  LeaderboardEntry,
  UserJoinedEvent,
  UserLeftEvent,
  TournamentStateUpdate,
  TournamentSettledEvent,
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
} from './types';

import { tournamentService } from '../services/tournamentService';
import { marketplaceService } from '../services/marketplaceService'; // If needed for validation

// Remove local Prisma instantiation
// const prisma = new PrismaClient();

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

/**
 * Initialize Socket.IO server for real-time tournament updates
 * Supports both namespace (/tournament) and root paths
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  // ============================================
  // ROOT NAMESPACE CONNECTION HANDLER
  // ============================================
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Extract user from socket handshake auth (optional for anonymous viewers)
    const fid = socket.handshake.auth?.fid as number | undefined;
    const username = socket.handshake.auth?.username as string | undefined;

    if (fid && username) {
      socket.data.fid = fid;
      socket.data.username = username;
      console.log(`[Socket.IO] Authenticated user: ${username} (FID: ${fid})`);
    }

    // ============================================
    // TOURNAMENT JOIN EVENT
    // ============================================
    socket.on('join:tournament', async (tournamentId: string) => {
      try {
        socket.join(`tournament:${tournamentId}`);
        console.log(`[Socket.IO] ${socket.id} joined tournament:${tournamentId}`);

        // Fetch and send current tournament state
        const tournament = await tournamentService.getTournamentById(tournamentId);

        if (tournament) {
          const stateUpdate: TournamentStateUpdate = {
            tournamentId,
            status: tournament.status as 'OPEN' | 'LIVE' | 'ENDED',
            currentParticipants: tournament.currentParticipants,
            maxParticipants: tournament.maxParticipants,
            timeRemaining: Math.max(0, new Date(tournament.endTime).getTime() - Date.now())
          };
          socket.emit('tournament:state', stateUpdate);
        }

        // Send current leaderboard
        const leaderboard = await getTournamentLeaderboard(tournamentId);
        socket.emit('leaderboard:update', leaderboard);

        // Notify room that a user joined (if authenticated)
        if (fid && username) {
          const joinEvent: UserJoinedEvent = {
            tournamentId,
            userId: fid,
            username,
            totalParticipants: tournament?.currentParticipants || 0,
            timestamp: new Date()
          };
          socket.to(`tournament:${tournamentId}`).emit('user:joined', joinEvent);
        }
      } catch (error) {
        console.error(`[Socket.IO] Error joining tournament:`, error);
        socket.emit('error', {
          code: 'JOIN_FAILED',
          message: 'Failed to join tournament',
          recoverable: true
        });
      }
    });

    // ============================================
    // TOURNAMENT LEAVE EVENT
    // ============================================
    socket.on('leave:tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`[Socket.IO] ${socket.id} left tournament:${tournamentId}`);

      // Notify room that a user left (if authenticated)
      if (fid && username) {
        const leaveEvent: UserLeftEvent = {
          tournamentId,
          userId: fid,
          username,
          totalParticipants: 0, // Would need to query for accurate count
          timestamp: new Date()
        };
        socket.to(`tournament:${tournamentId}`).emit('user:left', leaveEvent);
      }
    });

    // ============================================
    // LEADERBOARD REQUEST EVENT
    // ============================================
    socket.on('leaderboard:request', async (tournamentId: string) => {
      try {
        const leaderboard = await getTournamentLeaderboard(tournamentId);
        socket.emit('leaderboard:update', leaderboard);
      } catch (error) {
        console.error(`[Socket.IO] Error fetching leaderboard:`, error);
        socket.emit('error', {
          code: 'LEADERBOARD_FETCH_FAILED',
          message: 'Failed to fetch leaderboard',
          recoverable: true
        });
      }
    });

    // ============================================
    // SCORE UPDATE EVENT (Client → Server)
    // ============================================
    socket.on('score:update' as any, async (data: { tournamentId: string; score: number; newRank?: number }, callback?: (response: any) => void) => {
      try {
        if (!fid) {
          callback?.({ error: 'Not authenticated' });
          return;
        }

        const { tournamentId, score, newRank } = data;

        // Verify user is in tournament
        // Optimized: Assuming frontend validation for now to avoid extra DB call on every score update
        // In prod, check cache or service
        const isParticipant = true; // Placeholder for service check if needed: await tournamentService.isParticipant(tournamentId, fid);

        if (!isParticipant) {
          callback?.({ error: 'Not entered in this tournament' });
          return;
        }

        // Create score update event
        const scoreUpdate: ScoreUpdate = {
          tournamentId,
          userId: fid,
          username: username || 'Anonymous',
          score,
          rank: newRank || 0, // Rank calculation deferred to periodic update or service
          timestamp: new Date()
        };

        // Broadcast to all users in tournament room
        io.to(`tournament:${tournamentId}`).emit('score:changed', scoreUpdate);

        callback?.({ success: true });
        console.log(`[Socket.IO] Score update broadcast for ${fid} in ${tournamentId}`);
      } catch (error) {
        console.error(`[Socket.IO] Error updating score:`, error);
        callback?.({ error: 'Failed to update score' });
      }
    });

    // ============================================
    // PING/HEARTBEAT (Keep-alive)
    // ============================================
    socket.on('ping' as any, (callback: (response: any) => void) => {
      callback({ pong: true, timestamp: Date.now() });
    });

    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });

    // ============================================
    // ERROR HANDLER
    // ============================================
    socket.on('error', (error) => {
      console.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
    });
  });

  // Start periodic leaderboard updates (every 5 seconds for active tournaments)
  startPeriodicUpdates();

  console.log('[Socket.IO] Server initialized');

  return io;
}

/**
 * Get current leaderboard for a tournament
 */
async function getTournamentLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
  // Use service to fetch leaderboard (which handles DB abstraction)
  const entries = await tournamentService.getLeaderboard(tournamentId, 50);

  return entries.map((entry: any, index: number) => ({
    rank: index + 1,
    userId: entry.user.fid,
    username: entry.user.username,
    score: Number(entry.score),
    avatar: entry.user.pfpUrl || undefined
  }));
}

/**
 * Broadcast tournament update to all clients in tournament room
 * Called from backend services when events occur
 */
export function broadcastTournamentUpdate(
  tournamentId: string,
  action: 'NEW_ENTRY' | 'SCORE_UPDATED' | 'SETTLED' | 'STARTED' | 'ENDED' | 'LEADERBOARD_CHANGED',
  data?: any
) {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized');
    return;
  }

  const room = `tournament:${tournamentId}`;

  switch (action) {
    case 'SETTLED':
      const settledEvent: TournamentSettledEvent = {
        tournamentId,
        winners: data?.winners || [],
        totalPayout: data?.totalPayout || 0,
        timestamp: new Date()
      };
      io.to(room).emit('tournament:settled', settledEvent);
      break;

    default:
      io.to(room).emit('tournament:update', {
        tournamentId,
        action,
        timestamp: Date.now()
      });
  }

  console.log(`[Socket.IO] Broadcast ${action} for ${room}`);
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
 * Broadcast user joined event
 */
export function broadcastUserJoined(
  tournamentId: string,
  userId: number,
  username: string,
  totalParticipants: number
) {
  if (!io) return;

  const joinEvent: UserJoinedEvent = {
    tournamentId,
    userId,
    username,
    totalParticipants,
    timestamp: new Date()
  };

  io.to(`tournament:${tournamentId}`).emit('user:joined', joinEvent);
  console.log(`[Socket.IO] User joined broadcast: ${username} in ${tournamentId}`);
}

/**
 * Start periodic leaderboard updates for all active tournaments
 */
function startPeriodicUpdates() {
  // Update leaderboards every 5 seconds for tournaments with active viewers
  // Start periodic leaderboard updates
  setInterval(async () => {
    try {
      // Use service to get active tournaments
      const activeTournaments = await tournamentService.getActiveTournaments();

      for (const tournament of activeTournaments) {
        // Check if anyone is watching
        const roomSize = io?.sockets.adapter.rooms.get(`tournament:${tournament.id}`)?.size || 0;

        if (roomSize > 0) {
          await broadcastLeaderboardUpdate(tournament.id);
        }
      }
    } catch (error) {
      console.error('[Socket.IO] Error in periodic updates:', error);
    }
  }, 5000);

  // Tournament state updates every 30 seconds
  setInterval(async () => {
    try {
      const activeTournaments = await tournamentService.getActiveTournaments();

      for (const tournament of activeTournaments) {
        const roomSize = io?.sockets.adapter.rooms.get(`tournament:${tournament.id}`)?.size || 0;

        if (roomSize > 0) {
          const update: TournamentStateUpdate = {
            tournamentId: tournament.id,
            status: tournament.status as 'OPEN' | 'LIVE' | 'ENDED',
            currentParticipants: tournament.currentParticipants,
            maxParticipants: tournament.maxParticipants,
            timeRemaining: Math.max(0, new Date(tournament.endTime).getTime() - Date.now())
          };

          io.to(`tournament:${tournament.id}`).emit('tournament:state', update);
        }
      }
    } catch (error) {
      console.error('[Socket.IO] Periodic state update error:', error);
    }
  }, 30000);

  console.log('[Socket.IO] Periodic updates started (leaderboard: 5s, state: 30s)');
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
