import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { LEVEL_BASE_XP, LEVEL_EXPONENT, BAITS } from '../constants';
import { Coins, Zap, MapPin, CircleUser, Gift } from 'lucide-react';
import DailyStreak from './DailyStreak';
import BaitSelector from './BaitSelector';

interface GameHUDProps {
  onOpenProfile: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ onOpenProfile }) => {
  const { userStats, inventory, openChest } = useGameStore();
  const { addToast } = useUIStore();
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isBaitOpen, setIsBaitOpen] = useState(false);

  const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
  const progressPercent = Math.min(100, (userStats.xp / nextLevelXp) * 100);
  const activeBait = BAITS[inventory.activeBaitId];

  const handleOpenChest = () => {
    const msg = openChest();
    addToast(msg, 'success');
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 z-40 pointer-events-none">
        <div className="flex justify-between items-start">

          {/* Top Left: Level & Progress */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button onClick={onOpenProfile} className="flex items-center gap-3 bg-ocean-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl active:scale-95 transition-transform">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-black text-white border border-blue-400 text-lg shadow-inner relative">
                {userStats.level}
                {userStats.premium && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600 shadow-sm"></div>
                )}
              </div>
              <div className="flex flex-col w-24">
                <div className="flex justify-between text-[10px] text-sky-200 font-bold uppercase tracking-wider mb-1">
                  <span>XP</span>
                  <span>{Math.floor(progressPercent)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
              <div className="pl-1">
                <CircleUser size={20} className="text-white/50" />
              </div>
            </button>

            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full w-fit">
              <MapPin size={12} className="text-white/60" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Base Mainnet</span>
            </div>
          </div>

          {/* Top Right: Currency & Streak */}
          <div className="flex flex-col gap-2 items-end pointer-events-auto">
            <div className="flex items-center gap-2 bg-ocean-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl text-gold">
              <Coins size={16} className="fill-yellow-500 stroke-yellow-600" />
              <span className="font-bold text-sm tracking-wide">{userStats.coins.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setIsStreakOpen(true)}
              className="text-[10px] font-bold text-white/90 uppercase tracking-wide bg-gradient-to-r from-orange-600 to-red-600 px-3 py-1 rounded-lg shadow-lg active:scale-95 transition-transform border border-white/10"
            >
              Streak: {userStats.streak} 🔥
            </button>

            {/* Prestige Chest Button */}
            {userStats.pendingChests > 0 && (
              <button
                onClick={handleOpenChest}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-purple-500/30 animate-pulse active:scale-95 transition-all"
              >
                <Gift size={16} className="fill-white" />
                <span className="font-bold text-xs">OPEN CHEST ({userStats.pendingChests})</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Area: Controls (Casts & Bait) */}
        <div className="absolute top-[520px] left-0 w-full px-5 flex justify-between items-end pointer-events-auto">
          {/* Casts */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${userStats.castsRemaining === 0 && !userStats.premium ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-ocean-900/80 border-white/10'}`}>
            <Zap size={20} className={userStats.premium ? "text-yellow-400 fill-yellow-400" : "text-sky-400 fill-sky-400"} />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-white/50 font-bold uppercase">Energy</span>
              <span className="font-black text-lg text-white">
                {userStats.premium ? "∞" : `${userStats.castsRemaining}/${userStats.maxCasts}`}
              </span>
            </div>
          </div>

          {/* Active Bait */}
          <button
            onClick={() => setIsBaitOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/10 bg-ocean-900/80 backdrop-blur-md shadow-lg active:scale-95 transition-transform hover:bg-ocean-800"
          >
            <div className="text-2xl drop-shadow-md">{activeBait?.icon || '🪱'}</div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-[10px] text-white/50 font-bold uppercase">Bait</span>
              <span className="font-black text-lg text-white">
                {inventory.baits[inventory.activeBaitId] >= 999 ? "∞" : inventory.baits[inventory.activeBaitId]}
              </span>
            </div>
          </button>
        </div>
      </div>

      <DailyStreak isOpen={isStreakOpen} onClose={() => setIsStreakOpen(false)} />
      <BaitSelector isOpen={isBaitOpen} onClose={() => setIsBaitOpen(false)} />
    </>
  );
};

export default GameHUD;