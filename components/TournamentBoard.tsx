import React, { useEffect } from 'react';
import { useTournament } from '../hooks/useTournament';
import { useContracts } from '../hooks/useContracts';
import { useUIStore } from '../store/uiStore';
import { useAccount } from 'wagmi';
import { Trophy, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TournamentCard } from './TournamentCard';

interface TournamentBoardProps {
  onBack: () => void;
}

const TournamentBoard: React.FC<TournamentBoardProps> = ({ onBack }) => {
  const { tournaments, leaderboard, joinTournament: mockJoin, loading: mockLoading } = useTournament();
  const { enterTournament, isPending, isConfirming, isConfirmed, error } = useContracts();
  const { addToast } = useUIStore();
  const { isConnected } = useAccount();

  // Handle Transaction Feedback
  useEffect(() => {
    if (isConfirmed) {
      addToast('Tournament Entry Confirmed! Good luck!', 'success');
      mockJoin('1'); // Refresh mock state
    }
    if (error) {
      addToast(`Transaction Failed: ${error.message.slice(0, 20)}...`, 'error');
    }
  }, [isConfirmed, error, addToast, mockJoin]);

  const handleJoin = async (id: string, fee: number) => {
    if (!isConnected) {
      addToast('Connect Wallet in Profile to join!', 'warning');
      return;
    }

    try {
      await enterTournament(id, fee);
      mockJoin(id);
    } catch (e) {
      console.error(e);
    }
  };

  const isProcessing = isPending || isConfirming;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg via-dark-bg to-dark-card pb-32">
      {/* Header with blur effect */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-dark-bg/80 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Game</span>
            </button>

            {/* Status Indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-ocean-400 font-bold animate-pulse bg-ocean-500/10 px-3 py-1 rounded-full border border-ocean-500/20">
                <Loader2 size={12} className="animate-spin" /> Processing Transaction...
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display flex items-center gap-3">
            <Trophy className="text-yellow-400 fill-yellow-600 w-10 h-10 md:w-16 md:h-16" /> Tournaments
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
            Compete in real-time tournaments, climb the leaderboards, and win USDC prizes on Base.
          </p>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-card/50 backdrop-blur rounded-xl p-4 border border-gray-800/50">
              <p className="text-sm text-gray-400 mb-1">Total Prize Pool</p>
              <p className="text-xl md:text-2xl font-bold text-white">$10,427.69</p>
            </div>
            <div className="bg-dark-card/50 backdrop-blur rounded-xl p-4 border border-gray-800/50">
              <p className="text-sm text-gray-400 mb-1">Active Players</p>
              <p className="text-xl md:text-2xl font-bold text-white">1,247</p>
            </div>
            <div className="bg-dark-card/50 backdrop-blur rounded-xl p-4 border border-gray-800/50">
              <p className="text-sm text-gray-400 mb-1">Live Events</p>
              <p className="text-xl md:text-2xl font-bold text-white">{tournaments.length}</p>
            </div>
            <div className="bg-dark-card/50 backdrop-blur rounded-xl p-4 border border-gray-800/50">
              <p className="text-sm text-gray-400 mb-1">Your Rank</p>
              <p className="text-xl md:text-2xl font-bold text-ocean-400">#156</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Live Leaderboard Widget */}
        <div className="bg-dark-card/80 backdrop-blur rounded-2xl p-6 border border-gray-800/50 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <AlertCircle size={20} className="text-ocean-400" /> LIVE STANDINGS
            </h3>
            <span className="text-xs text-ocean-400 animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-ocean-400 rounded-full"></span> Updating Real-time
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="username"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val.substring(0, 8)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {leaderboard.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.username === 'You' ? '#38b2ac' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tournament Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 font-display">Active Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournaments.map(t => (
              <TournamentCard
                key={t.id}
                title={t.title}
                prizePool={t.prizePool}
                entryFee={t.entryFee}
                timeRemaining={t.timeLeft}
                participants={t.participants}
                maxParticipants={t.maxParticipants}
                status={t.status === 'LIVE' ? 'live' : 'upcoming'}
                isBossRaid={t.type === 'Boss'}
                isChampionship={t.type === 'Champ'}
                onJoin={() => handleJoin(t.id, t.entryFee)}
                disabled={isProcessing || mockLoading || !!t.rank || t.participants >= t.maxParticipants}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TournamentBoard;
