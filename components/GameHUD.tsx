import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { LEVEL_BASE_XP, LEVEL_EXPONENT, BAITS } from '../constants';
import { Coins, Zap, MapPin, CircleUser, Gift, Flame, ChevronDown, Sparkles } from 'lucide-react';
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
  const [isChestOpening, setIsChestOpening] = useState(false);

  const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
  const progressPercent = Math.min(100, (userStats.xp / nextLevelXp) * 100);
  const activeBait = BAITS[inventory.activeBaitId];

  const handleOpenChest = async () => {
    setIsChestOpening(true);
    // Add delay for animation
    await new Promise(resolve => setTimeout(resolve, 800));
    const msg = openChest();
    addToast(msg, 'success');
    setIsChestOpening(false);
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-3 z-40 pointer-events-none">
        <div className="flex justify-between items-start gap-3">

          {/* Top Left: Level & Progress */}
          <motion.div
            className="flex flex-col gap-2 pointer-events-auto"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={onOpenProfile}
              className="flex items-center gap-3 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Level Badge */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 rounded-xl flex items-center justify-center font-black text-white border-2 border-blue-400/50 text-xl shadow-lg shadow-blue-500/30">
                  {userStats.level}
                </div>
                {userStats.premium && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full border-2 border-yellow-300 shadow-lg flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles size={10} className="text-white" />
                  </motion.div>
                )}
              </div>

              {/* XP Bar */}
              <div className="flex flex-col w-28">
                <div className="flex justify-between text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-1">
                  <span>XP</span>
                  <span className="text-white">{Math.floor(progressPercent)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                  {/* Glow effect */}
                  <div
                    className="absolute top-0 h-full w-4 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"
                    style={{ left: `calc(${progressPercent}% - 8px)` }}
                  />
                </div>
              </div>

              <CircleUser size={18} className="text-white/40 hover:text-white/70 transition-colors" />
            </motion.button>

            {/* Network Badge */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 backdrop-blur-sm rounded-full border border-emerald-500/30 w-fit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Base Mainnet</span>
            </motion.div>
          </motion.div>

          {/* Top Right: Currency & Streak */}
          <motion.div
            className="flex flex-col gap-2 items-end pointer-events-auto"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Coins */}
            <motion.div
              className="flex items-center gap-2 bg-gradient-to-r from-amber-900/80 to-yellow-900/60 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/20"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Coins size={18} className="text-yellow-400 drop-shadow-lg" />
              </motion.div>
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                {userStats.coins.toLocaleString()}
              </span>
            </motion.div>

            {/* Streak Button */}
            <motion.button
              onClick={() => setIsStreakOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 px-4 py-2 rounded-xl shadow-lg shadow-orange-500/30 border border-orange-400/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Flame size={16} className="text-yellow-300 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {userStats.streak} Day{userStats.streak !== 1 ? 's' : ''}
              </span>
            </motion.button>

            {/* Prestige Chest Button */}
            <AnimatePresence>
              {userStats.pendingChests > 0 && (
                <motion.button
                  onClick={handleOpenChest}
                  disabled={isChestOpening}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-purple-500/40 border border-purple-400/30 relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={isChestOpening ? { rotate: [0, -10, 10, -10, 0] } : {}}
                    transition={{ duration: 0.3, repeat: isChestOpening ? Infinity : 0 }}
                  >
                    <Gift size={18} />
                  </motion.div>
                  <span className="font-bold text-sm">
                    {isChestOpening ? 'OPENING...' : `OPEN (${userStats.pendingChests})`}
                  </span>

                  {/* Sparkle effects */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        animate={{
                          x: [0, Math.random() * 100 - 50],
                          y: [0, Math.random() * 50 - 25],
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                        style={{
                          left: `${30 + i * 20}%`,
                          top: '50%'
                        }}
                      />
                    ))}
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom Area: Controls (Casts & Bait) */}
        <motion.div
          className="absolute bottom-24 left-0 w-full px-4 flex justify-between items-end pointer-events-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Casts */}
          <motion.div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-xl border transition-all ${userStats.castsRemaining === 0 && !userStats.premium
                ? 'bg-gradient-to-r from-red-900/90 to-red-800/80 border-red-500/50 animate-pulse'
                : 'bg-gradient-to-r from-slate-900/90 to-slate-800/80 border-white/10'
              }`}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={userStats.premium ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap size={22} className={`${userStats.premium
                  ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                  : userStats.castsRemaining === 0
                    ? "text-red-400 fill-red-400"
                    : "text-cyan-400 fill-cyan-400"
                }`} />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Energy</span>
              <span className="font-black text-xl text-white">
                {userStats.premium ? (
                  <span className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">∞</span>
                ) : (
                  `${userStats.castsRemaining}/${userStats.maxCasts}`
                )}
              </span>
            </div>
          </motion.div>

          {/* Active Bait */}
          <motion.button
            onClick={() => setIsBaitOpen(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 to-slate-800/80 backdrop-blur-xl shadow-xl group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="text-3xl drop-shadow-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.3 }}
            >
              {activeBait?.icon || '🪱'}
            </motion.div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Bait</span>
              <span className="font-black text-xl text-white">
                {inventory.baits[inventory.activeBaitId] >= 999 ? "∞" : inventory.baits[inventory.activeBaitId]}
              </span>
            </div>
            <ChevronDown size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
          </motion.button>
        </motion.div>
      </div>

      <DailyStreak isOpen={isStreakOpen} onClose={() => setIsStreakOpen(false)} />
      <BaitSelector isOpen={isBaitOpen} onClose={() => setIsBaitOpen(false)} />

      {/* Add shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default GameHUD;