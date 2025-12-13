import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { RARITY_COLORS, RARITY_BG } from '../constants';
import { Star, Share2, Check, Sparkles, Trophy, Scale } from 'lucide-react';

const FishModal: React.FC = () => {
  const { phase, lastCatch, collectReward, isNewCatch } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);

  const isRare = lastCatch && ['Rare', 'Epic', 'Legendary', 'Mythic'].includes(lastCatch.rarity);

  useEffect(() => {
    if (phase === GamePhase.REWARD && isRare) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [phase, isRare]);

  if (phase !== GamePhase.REWARD || !lastCatch) return null;

  const getRarityGlow = () => {
    switch (lastCatch.rarity) {
      case 'Mythic': return 'shadow-[0_0_60px_20px_rgba(236,72,153,0.4)]';
      case 'Legendary': return 'shadow-[0_0_50px_15px_rgba(251,191,36,0.4)]';
      case 'Epic': return 'shadow-[0_0_40px_12px_rgba(168,85,247,0.4)]';
      case 'Rare': return 'shadow-[0_0_30px_10px_rgba(59,130,246,0.3)]';
      default: return 'shadow-2xl';
    }
  };

  const getRarityBorder = () => {
    switch (lastCatch.rarity) {
      case 'Mythic': return 'border-pink-500/60';
      case 'Legendary': return 'border-yellow-500/60';
      case 'Epic': return 'border-purple-500/60';
      case 'Rare': return 'border-blue-500/60';
      default: return 'border-slate-600/60';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti for rare catches */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeIn"
                }}
                style={{
                  background: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          className={`w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 border-2 ${getRarityBorder()} rounded-3xl p-6 ${getRarityGlow()} relative overflow-hidden flex flex-col items-center gap-5 text-center`}
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 50, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        >

          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient shine */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Radial glow from fish */}
            {isRare && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${lastCatch.rarity === 'Mythic' ? 'rgba(236,72,153,0.2)' :
                      lastCatch.rarity === 'Legendary' ? 'rgba(251,191,36,0.2)' :
                        lastCatch.rarity === 'Epic' ? 'rgba(168,85,247,0.2)' :
                          'rgba(59,130,246,0.2)'
                    } 0%, transparent 70%)`
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          {/* New Catch Badge */}
          <AnimatePresence>
            {isNewCatch && (
              <motion.div
                className="absolute top-6 -left-10 rotate-[-35deg] bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs py-1.5 px-12 shadow-lg z-20"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                ✨ NEW!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            className="space-y-1 z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={16} className={RARITY_COLORS[lastCatch.rarity]?.split(' ')[0] || 'text-slate-400'} />
              <h3 className={`text-sm uppercase tracking-[0.2em] font-bold ${RARITY_COLORS[lastCatch.rarity]?.split(' ')[0] || 'text-slate-400'}`}>
                {lastCatch.rarity} Catch
              </h3>
              <Sparkles size={16} className={RARITY_COLORS[lastCatch.rarity]?.split(' ')[0] || 'text-slate-400'} />
            </div>
            <motion.h2
              className="text-3xl font-black text-white drop-shadow-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
            >
              {lastCatch.name}
            </motion.h2>
          </motion.div>

          {/* Fish Display */}
          <motion.div
            className={`relative w-36 h-36 ${RARITY_BG[lastCatch.rarity]} rounded-full flex items-center justify-center text-7xl z-10`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
          >
            {/* Outer ring animation */}
            <motion.div
              className="absolute inset-[-8px] rounded-full border-2 border-white/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[-16px] rounded-full border border-white/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            {/* Fish emoji with bounce */}
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {lastCatch.image}
            </motion.span>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-2 gap-4 w-full z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-4 rounded-2xl flex flex-col items-center border border-slate-600/50 backdrop-blur-sm">
              <Scale size={18} className="text-blue-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Weight</span>
              <span className="text-2xl font-black text-white">{lastCatch.weight} <span className="text-sm font-medium text-slate-400">lbs</span></span>
            </div>
            <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-4 rounded-2xl flex flex-col items-center border border-slate-600/50 backdrop-blur-sm">
              <Trophy size={18} className="text-green-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Experience</span>
              <motion.span
                className="text-2xl font-black text-green-400"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                +{lastCatch.xp}
              </motion.span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex w-full gap-3 mt-2 z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 border border-blue-400/30"
              onClick={collectReward}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Check size={22} strokeWidth={3} />
              <span className="text-lg">Collect</span>
            </motion.button>
            <motion.button
              className="w-14 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center shadow-lg border border-slate-600/50"
              onClick={() => alert("Simulating Farcaster cast sharing...")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={22} />
            </motion.button>
          </motion.div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FishModal;