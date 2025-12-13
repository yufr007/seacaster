import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { LEVEL_BASE_XP, LEVEL_EXPONENT, BAITS } from '../constants';
import { Zap, Settings, Gift, Home, ChevronDown } from 'lucide-react';
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
    await new Promise(resolve => setTimeout(resolve, 800));
    const msg = openChest();
    addToast(msg, 'success');
    setIsChestOpening(false);
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-3 z-40 pointer-events-none">
        <div className="flex justify-between items-start gap-2">

          {/* Left Side: Level & XP */}
          <motion.div
            className="flex items-center gap-2 pointer-events-auto"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Level Badge - CoC Style */}
            <motion.button
              onClick={onOpenProfile}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 50%, #1A5276 100%)',
                  border: '4px solid #F4D03F',
                  boxShadow: '0 4px 0 #C19A00, 0 6px 10px rgba(0,0,0,0.4)'
                }}
              >
                <span
                  className="text-2xl font-black text-white"
                  style={{
                    fontFamily: "'Lilita One', cursive",
                    textShadow: '2px 2px 0 #1A5276'
                  }}
                >
                  {userStats.level}
                </span>
              </div>

              {/* Premium Crown */}
              {userStats.premium && (
                <motion.div
                  className="absolute -top-2 -right-1 text-lg"
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  👑
                </motion.div>
              )}
            </motion.button>

            {/* XP Bar - CoC Style */}
            <div className="flex flex-col gap-1">
              <div
                className="w-24 h-4 rounded-lg overflow-hidden relative"
                style={{
                  background: 'linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)',
                  border: '2px solid #0D0D0D',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                <motion.div
                  className="h-full rounded"
                  style={{
                    background: 'linear-gradient(180deg, #82E0AA 0%, #27AE60 50%, #1E8449 100%)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1 }}
                />
                {/* Shine effect */}
                <div
                  className="absolute top-0.5 left-1 right-1 h-1.5 rounded"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
                    width: `${Math.max(0, progressPercent - 8)}%`
                  }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}
                >
                  {Math.floor(progressPercent)}%
                </span>
              </div>
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">XP</span>
            </div>
          </motion.div>

          {/* Right Side: Resources */}
          <motion.div
            className="flex flex-col gap-2 items-end pointer-events-auto"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Coins - CoC Style Pill */}
            <div
              className="flex items-center gap-1 px-2 py-1.5 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%)',
                border: '3px solid #1A1A1A',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
              }}
            >
              <motion.span
                className="text-xl"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}
              >
                🪙
              </motion.span>
              <span
                className="text-base font-black text-white min-w-[50px] text-center"
                style={{
                  fontFamily: "'Lilita One', cursive",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                {userStats.coins.toLocaleString()}
              </span>
              <button
                className="w-5 h-5 rounded flex items-center justify-center text-white text-sm font-black"
                style={{
                  background: 'linear-gradient(180deg, #58D68D 0%, #27AE60 100%)',
                  border: '2px solid #1E8449',
                  boxShadow: '0 2px 0 #145A32',
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)'
                }}
              >
                +
              </button>
            </div>

            {/* Streak Button */}
            <motion.button
              onClick={() => setIsStreakOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: 'linear-gradient(180deg, #F5B041 0%, #E67E22 100%)',
                border: '3px solid #AF601A',
                boxShadow: '0 3px 0 #7E4510'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 3 }}
            >
              <motion.span
                className="text-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                🔥
              </motion.span>
              <span
                className="text-sm font-black text-white"
                style={{
                  fontFamily: "'Lilita One', cursive",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {userStats.streak}
              </span>
            </motion.button>

            {/* Chest Button */}
            <AnimatePresence>
              {userStats.pendingChests > 0 && (
                <motion.button
                  onClick={handleOpenChest}
                  disabled={isChestOpening}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: 'linear-gradient(180deg, #BB8FCE 0%, #9B59B6 50%, #6C3483 100%)',
                    border: '3px solid #4A235A',
                    boxShadow: '0 4px 0 #2E1A3E, 0 6px 12px rgba(0,0,0,0.4)'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 4 }}
                >
                  <motion.div
                    animate={isChestOpening ? {
                      rotate: [-10, 10, -10, 10, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.5, repeat: isChestOpening ? Infinity : 0 }}
                  >
                    <Gift size={18} className="text-white" />
                  </motion.div>
                  <span
                    className="text-xs font-black text-white"
                    style={{ fontFamily: "'Lilita One', cursive" }}
                  >
                    {isChestOpening ? 'OPENING...' : `OPEN (${userStats.pendingChests})`}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom Controls */}
        <motion.div
          className="absolute bottom-24 left-0 w-full px-3 flex justify-between items-end pointer-events-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Energy - CoC Style */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: userStats.castsRemaining === 0 && !userStats.premium
                ? 'linear-gradient(180deg, #EC7063 0%, #E74C3C 100%)'
                : 'linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%)',
              border: userStats.castsRemaining === 0 && !userStats.premium
                ? '3px solid #B03A2E'
                : '3px solid #1A1A1A',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)'
            }}
          >
            <motion.div
              animate={userStats.premium ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap
                size={22}
                className={userStats.premium ? "text-yellow-400 fill-yellow-400" : "text-cyan-400 fill-cyan-400"}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-white/50 font-bold uppercase">Energy</span>
              <span
                className="text-xl font-black text-white"
                style={{ fontFamily: "'Lilita One', cursive" }}
              >
                {userStats.premium ? (
                  <span className="text-yellow-400">∞</span>
                ) : (
                  `${userStats.castsRemaining}/${userStats.maxCasts}`
                )}
              </span>
            </div>
          </div>

          {/* Bait Selector - CoC Style */}
          <motion.button
            onClick={() => setIsBaitOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #4A6741 0%, #3D5335 100%)',
              border: '3px solid #2E4228',
              boxShadow: '0 4px 0 #1D2A19, 0 6px 12px rgba(0,0,0,0.4)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 4 }}
          >
            <motion.div
              className="text-2xl"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              whileHover={{ rotate: [-10, 10, 0] }}
            >
              {activeBait?.icon || '🪱'}
            </motion.div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-[10px] text-white/50 font-bold uppercase">Bait</span>
              <span
                className="text-xl font-black text-white"
                style={{ fontFamily: "'Lilita One', cursive" }}
              >
                {inventory.baits[inventory.activeBaitId] >= 999 ? "∞" : inventory.baits[inventory.activeBaitId]}
              </span>
            </div>
            <ChevronDown size={16} className="text-white/50" />
          </motion.button>
        </motion.div>

        {/* Home Button */}
        <motion.button
          className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%)',
            border: '4px solid #1A5276',
            boxShadow: '0 4px 0 #0E3A5E, 0 6px 12px rgba(0,0,0,0.4)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, y: 4 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <Home size={24} className="text-white mx-auto" />
        </motion.button>
      </div>

      <DailyStreak isOpen={isStreakOpen} onClose={() => setIsStreakOpen(false)} />
      <BaitSelector isOpen={isBaitOpen} onClose={() => setIsBaitOpen(false)} />
    </>
  );
};

export default GameHUD;