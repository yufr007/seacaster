import { useState, useEffect } from 'react';
import { Tournament, LeaderboardEntry } from '../types';
import { TOURNAMENT_CONFIG } from '../constants';
import { socketService } from '../services/socket';

// Mock Data Generators for Fallback
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
  return entries.sort((a, b) => b.score - a.score).map((e, i) => ({...e, rank: i + 1}));
};

export const useTournament = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([
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
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(generateMockLeaderboard(5));
  const [loading, setLoading] = useState(false);

  // Socket & Countdown Logic
  useEffect(() => {
    // Init Socket
    socketService.connect();
    
    // Real-time leaderboard updates via Socket.IO
    socketService.onLeaderboardUpdate((data) => {
        console.log("[Socket.IO] Leaderboard update received:", data);
        if (Array.isArray(data)) {
          setLeaderboard(data.slice(0, 5)); // Top 5 entries
        }
    });

    const interval = setInterval(() => {
      // Countdown Logic
      setTournaments(prev => prev.map(t => {
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
      
      // Fallback local simulation for leaderboard if no socket data
      setLeaderboard(prev => {
        const newEntries = [...prev];
        const idx = Math.floor(Math.random() * newEntries.length);
        if (newEntries[idx]) {
          newEntries[idx] = { ...newEntries[idx], score: newEntries[idx].score + Math.floor(Math.random() * 5) };
        }
        return newEntries.sort((a, b) => b.score - a.score).map((e, i) => ({...e, rank: i + 1})).slice(0, 5);
      });

    }, 1000);

    return () => {
      clearInterval(interval);
      socketService.disconnect();
    };
  }, []);

  const joinTournament = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, participants: t.participants + 1, rank: t.participants + 1 } : t));
    setLoading(false);
  };

  return { tournaments, leaderboard, joinTournament, loading };
};