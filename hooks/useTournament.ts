// hooks/useTournament.ts - Tournament hook with real API + fallback
// Uses React Query for API calls with Socket.IO for real-time updates

/// <reference types="vite/client" />

import { useState, useEffect, useCallback } from 'react';
import { Tournament, LeaderboardEntry } from '../types';
import { TOURNAMENT_CONFIG } from '../constants';
import { socketService } from '../services/socket';
import { useActiveTournaments, useEnterTournament, useTournamentRoom } from './useTournamentAPI';

// Feature flag for API mode - defaults to false if not set
const USE_REAL_API = typeof import.meta !== 'undefined'
  && import.meta.env?.VITE_USE_REAL_API === 'true';

// Fallback mock data generators
const generateMockLeaderboard = (count: number): LeaderboardEntry[] => {
  const entries: LeaderboardEntry[] = [];
  const names = ['0xShark', 'WhaleHunter', 'NemoFound', 'Poseidon', 'SaltyDog', 'CryptoFish', 'BaseBased', 'Warpcaster'];

  for (let i = 0; i < count; i++) {
    entries.push({
      fid: 1000 + i,
      username: names[i % names.length] + (i > 7 ? `_${i}` : ''),
      score: Math.floor(Math.random() * 500) + 100 - (i * 10),
      rank: i + 1,
      avatar: '',
    });
  }
  return entries.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
};

const generateMockTournaments = (): Tournament[] => [
  {
    id: TOURNAMENT_CONFIG.DAILY.id,
    title: TOURNAMENT_CONFIG.DAILY.title,
    prizePool: TOURNAMENT_CONFIG.DAILY.prizePool,
    entryFee: TOURNAMENT_CONFIG.DAILY.entryFee,
    timeLeft: '0',
    participants: 58,
    maxParticipants: TOURNAMENT_CONFIG.DAILY.maxParticipants,
    rank: 4,
    type: 'Daily',
    status: 'LIVE',
    endTime: Date.now() + (4 * 60 * 60 * 1000) + (12 * 60 * 1000)
  },
  {
    id: TOURNAMENT_CONFIG.WEEKLY.id,
    title: TOURNAMENT_CONFIG.WEEKLY.title,
    prizePool: TOURNAMENT_CONFIG.WEEKLY.prizePool,
    entryFee: TOURNAMENT_CONFIG.WEEKLY.entryFee,
    timeLeft: '0',
    participants: 45,
    maxParticipants: TOURNAMENT_CONFIG.WEEKLY.maxParticipants,
    rank: null,
    type: 'Weekly',
    status: 'OPEN',
    endTime: Date.now() + (2 * 24 * 60 * 60 * 1000)
  },
  {
    id: TOURNAMENT_CONFIG.BOSS.id,
    title: TOURNAMENT_CONFIG.BOSS.title,
    prizePool: TOURNAMENT_CONFIG.BOSS.prizePool,
    entryFee: TOURNAMENT_CONFIG.BOSS.entryFee,
    timeLeft: '0',
    participants: 28,
    maxParticipants: TOURNAMENT_CONFIG.BOSS.maxParticipants,
    rank: null,
    type: 'Boss',
    status: 'LIVE',
    endTime: Date.now() + (12 * 60 * 60 * 1000)
  },
  {
    id: TOURNAMENT_CONFIG.CHAMP.id,
    title: TOURNAMENT_CONFIG.CHAMP.title,
    prizePool: TOURNAMENT_CONFIG.CHAMP.prizePool,
    entryFee: TOURNAMENT_CONFIG.CHAMP.entryFee,
    timeLeft: '0',
    participants: 124,
    maxParticipants: TOURNAMENT_CONFIG.CHAMP.maxParticipants,
    rank: null,
    type: 'Champ',
    status: 'OPEN',
    endTime: Date.now() + (5 * 24 * 60 * 60 * 1000)
  },
];

/**
 * Main tournament hook - uses real API when available, falls back to mock data
 */
export const useTournament = () => {
  // API-based data (when enabled)
  const apiTournaments = useActiveTournaments();
  const enterMutation = useEnterTournament();

  // Local state for fallback mode
  const [mockTournaments, setMockTournaments] = useState<Tournament[]>(generateMockTournaments());
  const [mockLeaderboard, setMockLeaderboard] = useState<LeaderboardEntry[]>(generateMockLeaderboard(5));
  const [loading, setLoading] = useState(false);

  // Socket.IO real-time updates
  useEffect(() => {
    socketService.connect();

    socketService.onLeaderboardUpdate((data) => {
      console.log("[Socket.IO] Leaderboard update received:", data);
      if (Array.isArray(data)) {
        setMockLeaderboard(data.slice(0, 5).map((entry, i) => ({
          fid: entry.userId || entry.fid,
          username: entry.username || 'Anonymous',
          score: entry.score,
          rank: i + 1,
          avatar: entry.avatar || entry.pfpUrl || '',
        })));
      }
    });

    return () => {
      socketService.offLeaderboardUpdate();
      socketService.disconnect();
    };
  }, []);

  // Countdown timer for mock mode
  useEffect(() => {
    if (USE_REAL_API) return;

    const interval = setInterval(() => {
      setMockTournaments(prev => prev.map(t => {
        const now = Date.now();
        const end = t.endTime || now;
        const diff = Math.max(0, end - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeStr = "";
        if (days > 0) timeStr = `${days}d ${hours}h`;
        else if (hours > 0) timeStr = `${hours}h ${minutes}m`;
        else timeStr = `${minutes}m ${seconds}s`;

        // Simulate live participation changes
        if (t.status === 'LIVE' || t.status === 'OPEN') {
          const change = Math.random() > 0.9 ? 1 : 0;
          const newParticipants = Math.min(t.maxParticipants, t.participants + change);
          return { ...t, participants: newParticipants, timeLeft: timeStr };
        }
        return { ...t, timeLeft: timeStr };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Join tournament function
  const joinTournament = useCallback(async (id: string) => {
    if (USE_REAL_API) {
      try {
        await enterMutation.mutateAsync({ tournamentId: id, entryMethod: 'USDC' });
        return true;
      } catch (error) {
        console.error('[useTournament] Failed to join:', error);
        return false;
      }
    }

    // Fallback mock join
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMockTournaments(prev => prev.map(t =>
      t.id === id ? { ...t, participants: t.participants + 1, rank: t.participants + 1 } : t
    ));
    setLoading(false);
    return true;
  }, [enterMutation]);

  // Transform API data to match expected format
  const tournaments = USE_REAL_API && apiTournaments.data
    ? apiTournaments.data.map((t: any) => ({
      id: t.id,
      title: t.title,
      prizePool: t.prizePool,
      entryFee: t.entryFee,
      timeLeft: formatTimeLeft(t.timeRemaining || 0),
      participants: t.currentParticipants,
      maxParticipants: t.maxParticipants,
      rank: null,
      type: t.type,
      status: t.status,
      endTime: new Date(t.endTime).getTime(),
    }))
    : mockTournaments;

  return {
    tournaments,
    leaderboard: mockLeaderboard,
    joinTournament,
    loading: loading || enterMutation.isPending || apiTournaments.isLoading,
    isApiMode: USE_REAL_API,
  };
};

// Helper function
function formatTimeLeft(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${secs}s`;
}

// Re-export new hooks for direct use
export { useActiveTournaments, useEnterTournament, useTournamentRoom } from './useTournamentAPI';