import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { RARITY_COLORS, RARITY_BG } from '../constants';
import { Check, Share2, Star, Trophy, Scale } from 'lucide-react';
import ShareModal from './ShareModal';

const FishModal: React.FC = () => {
  const { phase, lastCatch, collectReward, isNewCatch } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isRare = lastCatch && ['Rare', 'Epic', 'Legendary', 'Mythic'].includes(lastCatch.rarity);

  useEffect(() => {
    if (phase === GamePhase.REWARD && isRare) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [phase, isRare]);

  if (phase !== GamePhase.REWARD || !lastCatch) return null;

  const getRarityGradient = () => {
    switch (lastCatch.rarity) {
      case 'Mythic': return 'from-pink-500 via-purple-500 to-pink-600';
      case 'Legendary': return 'from-yellow-400 via-amber-500 to-orange-500';
      case 'Epic': return 'from-purple-400 via-purple-500 to-purple-600';
      case 'Rare': return 'from-blue-400 via-blue-500 to-blue-600';
      case 'Uncommon': return 'from-green-400 via-green-500 to-green-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = () => {
    switch (lastCatch.rarity) {
      case 'Mythic': return '#EC4899';
      case 'Legendary': return '#F59E0B';
      case 'Epic': return '#8B5CF6';
      case 'Rare': return '#3B82F6';
      case 'Uncommon': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.9)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm"
                initial={{
                  x: '50%',
                  y: '40%',
                  rotate: 0,
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${100 + Math.random() * 20}%`,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5]
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.3,
                  ease: "easeOut"
                }}
                style={{
                  width: `${8 + Math.random() * 8}px`,
                  height: `${8 + Math.random() * 8}px`,
                  background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        )}

        {/* CoC Style Modal */}
        <motion.div
          className="w-full max-w-sm relative"
          initial={{ scale: 0.5, y: 100, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 100, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        >
          {/* Main Panel */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #5A7A52 0%, #4A6741 50%, #3D5335 100%)',
              border: `6px solid #5D4E37`,
              boxShadow: '0 10px 0 #3D3426, 0 15px 40px rgba(0,0,0,0.6)'
            }}
          >
            {/* Header */}
            <div
              className="text-center py-4 px-6"
              style={{
                background: 'linear-gradient(180deg, #8B7355 0%, #5D4E37 100%)',
                borderBottom: '4px solid #3D3426'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <h3
                  className={`text-sm uppercase tracking-[0.2em] font-bold bg-gradient-to-r ${getRarityGradient()} bg-clip-text text-transparent`}
                >
                  {lastCatch.rarity} Catch!
                </h3>
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
              </div>
              <motion.h2
                className="text-3xl font-black text-white"
                style={{
                  fontFamily: "'Lilita One', cursive",
                  textShadow: '3px 3px 0 rgba(0,0,0,0.4)'
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {lastCatch.name}
              </motion.h2>
            </div>

            {/* New Badge */}
            {isNewCatch && (
              <motion.div
                className="absolute top-12 -left-8 rotate-[-35deg] py-2 px-12 text-black font-black text-xs z-20"
                style={{
                  background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                ✨ NEW!
              </motion.div>
            )}

            {/* Content */}
            <div className="p-5 flex flex-col items-center gap-4">

              {/* Fish Display - CoC Card Style */}
              <motion.div
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", bounce: 0.4 }}
              >
                {/* Glow Ring */}
                <motion.div
                  className="absolute inset-[-12px] rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${getRarityBorder()}40 0%, transparent 70%)`
                  }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Fish Circle */}
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(180deg, #3D5335 0%, #2E4228 100%)',
                    border: `5px solid ${getRarityBorder()}`,
                    boxShadow: `0 6px 0 ${getRarityBorder()}80, 0 10px 20px rgba(0,0,0,0.4)`
                  }}
                >
                  <motion.span
                    className="text-6xl"
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {lastCatch.image}
                  </motion.span>
                </div>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                className="grid grid-cols-2 gap-3 w-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {/* Weight */}
                <div
                  className="flex flex-col items-center p-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(180deg, #3D5335 0%, #2E4228 100%)',
                    border: '3px solid #1D2A19',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <Scale size={20} className="text-blue-400 mb-1" />
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Weight</span>
                  <span
                    className="text-2xl font-black text-white"
                    style={{ fontFamily: "'Lilita One', cursive" }}
                  >
                    {lastCatch.weight} <span className="text-sm font-medium text-gray-400">lbs</span>
                  </span>
                </div>

                {/* XP */}
                <div
                  className="flex flex-col items-center p-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(180deg, #3D5335 0%, #2E4228 100%)',
                    border: '3px solid #1D2A19',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <Trophy size={20} className="text-green-400 mb-1" />
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Experience</span>
                  <motion.span
                    className="text-2xl font-black text-green-400"
                    style={{ fontFamily: "'Lilita One', cursive" }}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    +{lastCatch.xp}
                  </motion.span>
                </div>
              </motion.div>

              {/* Action Buttons - CoC Style */}
              <motion.div
                className="flex w-full gap-3 mt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                {/* Collect Button */}
                <motion.button
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-lg text-white relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%)',
                    border: '4px solid #145A32',
                    boxShadow: '0 5px 0 #0B3D20, 0 8px 15px rgba(0,0,0,0.4)',
                    fontFamily: "'Lilita One', cursive",
                    textShadow: '2px 2px 0 #145A32'
                  }}
                  onClick={collectReward}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, y: 5, boxShadow: '0 0 0 #0B3D20' }}
                >
                  <Check size={24} strokeWidth={3} />
                  <span>COLLECT</span>

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                </motion.button>

                {/* Share Button */}
                <motion.button
                  className="w-16 flex items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%)',
                    border: '4px solid #1A5276',
                    boxShadow: '0 5px 0 #0E3A5E, 0 8px 15px rgba(0,0,0,0.4)'
                  }}
                  onClick={() => setShowShare(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 5 }}
                >
                  <Share2 size={24} className="text-white" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          fish={lastCatch}
          isNewCatch={isNewCatch}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FishModal;