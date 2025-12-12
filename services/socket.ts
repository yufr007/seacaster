import { io, Socket } from 'socket.io-client';

// Singleton Socket Service
class SocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    // Use Vite environment variable for Socket.IO backend URL
    this.url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
  }

  connect() {
    if (this.socket) return;

    this.socket = io(this.url, {
      path: '/api/socket',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  joinTournamentRoom(tournamentId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('join_tournament', { tournamentId });
  }

  leaveTournamentRoom(tournamentId: string) {
    this.socket?.emit('leave_tournament', { tournamentId });
  }

  onLeaderboardUpdate(callback: (data: any) => void) {
    this.socket?.on('leaderboard_update', callback);
  }

  offLeaderboardUpdate() {
    this.socket?.off('leaderboard_update');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();