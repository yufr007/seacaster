import { io, Socket } from 'socket.io-client';

// Types for Socket.IO events
interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string;
  pfpUrl: string | null;
  level: number;
  score: number;
  payout: number | null;
}

interface TournamentUpdate {
  tournamentId: string;
  action: 'NEW_ENTRY' | 'SCORE_UPDATED' | 'SETTLED' | 'STARTED' | 'ENDED';
  timestamp: number;
}

// Singleton Socket Service for real-time tournament updates
class SocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    // Use Vite environment variable for Socket.IO backend URL
    // @ts-expect-error - Vite injects import.meta.env at build time
    this.url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL)
      || 'http://localhost:3002';
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
    });
  }

  // ===== Tournament Room Management =====

  joinTournamentRoom(tournamentId: string): void {
    if (!this.socket) this.connect();
    this.socket?.emit('join:tournament', tournamentId);
    console.log(`[Socket.IO] Joining tournament room: ${tournamentId}`);
  }

  leaveTournamentRoom(tournamentId: string): void {
    this.socket?.emit('leave:tournament', tournamentId);
    console.log(`[Socket.IO] Leaving tournament room: ${tournamentId}`);
  }

  requestLeaderboard(tournamentId: string): void {
    this.socket?.emit('leaderboard:request', tournamentId);
  }

  // ===== Event Listeners =====

  onLeaderboardUpdate(callback: (data: LeaderboardEntry[]) => void): void {
    this.socket?.on('leaderboard:update', callback);
  }

  offLeaderboardUpdate(): void {
    this.socket?.off('leaderboard:update');
  }

  onTournamentUpdate(callback: (data: TournamentUpdate) => void): void {
    this.socket?.on('tournament:update', callback);
  }

  offTournamentUpdate(): void {
    this.socket?.off('tournament:update');
  }

  // ===== Connection Management =====

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[Socket.IO] Manually disconnected');
    }
  }
}

export const socketService = new SocketService();