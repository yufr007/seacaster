// backend/src/sockets/types.ts

/**
 * Socket.IO Event Types for SeaCaster
 * All real-time game events
 */

export interface TournamentSocket {
    tournamentId: string;
    userId: number;
    username: string;
    fid: number;
}

export interface ScoreUpdate {
    tournamentId: string;
    userId: number;
    username: string;
    score: number;
    rank: number;
    timestamp: Date;
}

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    score: number;
    avatar?: string;
}

export interface LeaderboardUpdate {
    tournamentId: string;
    entries: LeaderboardEntry[];
    totalEntries: number;
}

export interface TournamentStateUpdate {
    tournamentId: string;
    status: 'OPEN' | 'LIVE' | 'ENDED';
    currentParticipants: number;
    maxParticipants: number;
    timeRemaining: number;
    nextUpdate?: Date;
}

export interface UserJoinedEvent {
    tournamentId: string;
    userId: number;
    username: string;
    totalParticipants: number;
    timestamp: Date;
}

export interface UserLeftEvent {
    tournamentId: string;
    userId: number;
    username: string;
    totalParticipants: number;
    timestamp: Date;
}

export interface TournamentSettledEvent {
    tournamentId: string;
    winners: Array<{
        rank: number;
        fid: number;
        username: string;
        score: number;
        payout: number;
    }>;
    totalPayout: number;
    timestamp: Date;
}

export interface ErrorEvent {
    code: string;
    message: string;
    recoverable: boolean;
}

// Socket.IO client-to-server events
export interface ClientToServerEvents {
    'join:tournament': (data: { tournamentId: string }, callback: (response: { success?: boolean; error?: string }) => void) => void;
    'leave:tournament': (data: { tournamentId: string }, callback: (response: { success?: boolean; error?: string }) => void) => void;
    'score:update': (data: { tournamentId: string; score: number; newRank: number }, callback: (response: { success?: boolean; error?: string }) => void) => void;
    'leaderboard:fetch': (data: { tournamentId: string; limit?: number }, callback: (response: LeaderboardUpdate | { error: string }) => void) => void;
    'leaderboard:request': (tournamentId: string) => void;
    'ping': (callback: (response: { pong: boolean; timestamp: number }) => void) => void;
}

// Socket.IO server-to-client events
export interface ServerToClientEvents {
    'tournament:state': (data: TournamentStateUpdate) => void;
    'tournament:update': (data: { tournamentId: string; action: string; timestamp: number }) => void;
    'tournament:settled': (data: TournamentSettledEvent) => void;
    'leaderboard:update': (data: LeaderboardUpdate | LeaderboardEntry[]) => void;
    'leaderboard:updated': (data: { tournamentId: string; type: string; timestamp: Date }) => void;
    'score:changed': (data: ScoreUpdate) => void;
    'user:joined': (data: UserJoinedEvent) => void;
    'user:left': (data: UserLeftEvent) => void;
    'error': (data: ErrorEvent) => void;
}

// Socket data stored on each connection
export interface SocketData {
    fid: number;
    username: string;
}
