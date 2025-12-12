
import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import { Haptics, triggerHaptic } from '../utils/haptics';

// Lazy load 3D scene for performance
const ThreeFishingScene = lazy(() => import('./ThreeFishingScene'));

/**
 * Fishing Scene Wrapper
 * Toggles between 2D (Framer Motion) and 3D (Three.js) based on feature flag
 */
const FishingScene: React.FC = () => {
  const { userStats } = useGameStore();

  // Feature flag: Enable 3D for all users (can be changed to level-based)
  const use3D = userStats.level >= 1; // Change to >= 50 for L50+ only

  if (use3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ThreeFishingScene />
      </Suspense>
    );
  }

  return <FishingScene2D />;
};

/**
 * Loading fallback while 3D scene loads
 */
const LoadingFallback: React.FC = () => (
  <div className="relative w-full h-full bg-gradient-to-b from-sky-400 via-sky-600 to-ocean-800 flex items-center justify-center">
    <div className="text-white text-xl font-bold animate-pulse">Loading 3D Scene...</div>
  </div>
);

/**
 * Original 2D Fishing Scene (Framer Motion)
 * Kept as fallback for compatibility and A/B testing
 */
const FishingScene2D: React.FC = () => {
  const { phase, castLine, attemptCatch, userStats, finishCatchAnimation } = useGameStore();
  const touchStartY = useRef<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const { play } = useSound();

  // Rod Visual Logic
  const hasHandle = userStats.level >= 10;
  const hasCarbon = userStats.level >= 20;
  const hasHook = userStats.level >= 30;
  const hasReel = userStats.level >= 40;
  const hasEffect = userStats.level >= 50;

  useEffect(() => {
    if (phase !== GamePhase.IDLE) setShowSwipeHint(false);
    else setTimeout(() => setShowSwipeHint(true), 1000);

    // Sound Triggers based on phase changes
    if (phase === GamePhase.CASTING) {
      play('cast');
    } else if (phase === GamePhase.HOOKED) {
      play('splash');
    } else if (phase === GamePhase.REWARD) {
      play('success');
    }
  }, [phase, play]);

  // Handle L50 Animation Completion
  useEffect(() => {
    if (phase === GamePhase.ANIMATING_CATCH) {
      // Sequence: Ship Arrives (0.8s) -> Cannon Fire (1.0s) -> Fish Lands (2.5s)
      setTimeout(() => {
        play('cast'); // Cannon boom sound (reusing cast for now)
        triggerHaptic(Haptics.heavy);
      }, 800);

      setTimeout(() => {
        play('success'); // Land in basket
        triggerHaptic(Haptics.success);
        finishCatchAnimation();
      }, 2500);
    }
  }, [phase, finishCatchAnimation, play]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (phase === GamePhase.IDLE) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (phase === GamePhase.IDLE && touchStartY.current !== null) {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchEndY - touchStartY.current;

      // Swipe Up (negative delta) - Tuned for responsiveness
      if (deltaY < -50) {
        castLine();
        triggerHaptic([20, 50]); // Tension -> Snap
      }
      touchStartY.current = null;
    }
  };

  const handleTap = () => {
    if (phase === GamePhase.HOOKED) {
      play('reelSpin');
      triggerHaptic(Haptics.hook);
      attemptCatch();
    }
  };

  return (
    <div
      className="relative w-full h-full bg-gradient-to-b from-sky-400 via-sky-600 to-ocean-800 overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* --- SKY & AMBIANCE --- */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200 rounded-full blur-[60px] opacity-40 animate-pulse"></div>

      {/* Cloud animation - only during active gameplay */}
      {(phase === GamePhase.IDLE || phase === GamePhase.WAITING || phase === GamePhase.CASTING) && (
        <motion.div
          initial={{ x: -100 }} animate={{ x: 400 }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-12 left-0 w-48 h-12 bg-white/10 rounded-full blur-xl"
        />
      )}

      {/* --- WATER SURFACE --- */}
      <div className="absolute top-[52%] w-full h-[48%] bg-ocean-700 opacity-95 backdrop-blur-sm z-10 border-t border-sky-300/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* --- FISH SHADOWS --- */}
      <AnimatePresence>
        {phase === GamePhase.WAITING && (
          <>
            {/* Shadow 1: The Investigator */}
            <motion.div
              initial={{ x: -100, y: 50, opacity: 0, rotate: 10 }}
              animate={{
                x: [0, 180, 400],
                y: [0, -40, 120],
                opacity: [0, 0.25, 0],
                rotate: [10, 0, 25]
              }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
              className="absolute top-[60%] left-[0%] w-28 h-8 bg-black/20 rounded-full blur-md z-10"
            />

            {/* Shadow 2: Deep Lurker */}
            <motion.div
              initial={{ x: 400, y: 120, opacity: 0 }}
              animate={{
                x: -200,
                opacity: [0, 0.15, 0]
              }}
              transition={{ duration: 15, ease: "linear", repeat: Infinity, delay: 1 }}
              className="absolute top-[65%] left-[0%] w-48 h-12 bg-black/10 rounded-full blur-lg z-0"
            />

            {/* Shadow 3: The Nibbler */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.2, 0],
                scale: [0.8, 1.0, 0.9],
                x: [0, 20, -10],
                y: [0, -5, 5]
              }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatDelay: 5, delay: 2 }}
              className="absolute top-[58%] left-[45%] w-14 h-5 bg-indigo-900/30 rounded-full blur-[3px] z-10"
            />

            {/* Shadow 4: Schooling Formation */}
            {[
              { ox: 0, oy: 0 },
              { ox: -25, oy: 15 },
              { ox: -25, oy: -15 },
              { ox: -50, oy: 30 },
              { ox: -50, oy: -30 }
            ].map((offset, i) => (
              <motion.div
                key={`school-${i}`}
                initial={{
                  x: 250 + offset.ox,
                  y: 200 + offset.oy,
                  opacity: 0,
                  rotate: -40
                }}
                animate={{
                  x: [-250 + offset.ox],
                  y: [-200 + offset.oy],
                  opacity: [0, 0.15, 0]
                }}
                transition={{
                  duration: 12,
                  ease: "linear",
                  repeat: Infinity,
                  repeatDelay: 15,
                  delay: 2 // Offset start to avoid clash with other shadows
                }}
                className="absolute top-[55%] left-[50%] w-10 h-3 bg-black/10 rounded-full blur-[1px] z-0"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* --- PIER --- */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-[#3e2723] z-20 flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_19px,#000_20px)]"></div>
      </div>

      {/* --- ROD & LINE --- */}
      <motion.div
        className="absolute bottom-[-40px] right-[-40px] w-64 h-[450px] z-30 pointer-events-none"
        style={{ transformOrigin: 'bottom right' }}
        animate={
          phase === GamePhase.CASTING ? {
            // Physics: Idle -> Windup (Right) -> Snap (Left/Forward) -> Recoil -> Settle
            rotate: [0, 45, -60, -10, 0],
            skewX: [0, 10, -30, 5, 0],
            x: [0, 50, -20, 0, 0]
          } :
            phase === GamePhase.HOOKED ? { rotate: [0, -8, 0, -5], transition: { repeat: Infinity, duration: 0.15 } } :
              phase === GamePhase.ANIMATING_CATCH ? { rotate: -50, transition: { duration: 0.5 } } :
                { rotate: 0, skewX: 0, x: 0 }
        }
        transition={
          phase === GamePhase.CASTING
            ? { duration: 3.0, times: [0, 0.3, 0.45, 0.7, 1], ease: "easeInOut" }
            : { type: "spring", stiffness: 80, damping: 15 }
        }
      >
        {/* Rod Body - L20 Barnacle/Driftwood or Standard */}
        <div className={`w-3 h-full rounded-full relative shadow-2xl border-r border-white/10 ${hasCarbon ? 'bg-[#5D4037]' : 'bg-gradient-to-t from-amber-900 to-amber-700'}`}>
          {/* L20 Texture Overlay (Barnacles/Moss) */}
          {hasCarbon && (
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 mix-blend-overlay"></div>
              <div className="absolute top-1/4 left-0 w-full h-12 bg-green-900/40 blur-[1px]"></div> {/* Moss */}
              <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-300 rounded-full shadow-sm"></div> {/* Barnacle */}
              <div className="absolute top-1/3 -right-1 w-1.5 h-1.5 bg-gray-300 rounded-full shadow-sm"></div>
            </>
          )}

          {/* L10 Kraken Handle */}
          {hasHandle && (
            <div className="absolute bottom-0 left-[-3px] w-5 h-36 bg-gradient-to-b from-purple-900 via-purple-950 to-black rounded-lg border-l border-purple-800 flex flex-col items-center justify-around py-2 z-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-purple-600/50 shadow-inner border border-purple-800/50"></div>
              ))}
            </div>
          )}

          {/* L40 Spyglass Reel */}
          <div className={`absolute bottom-36 -left-5 w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center z-20 ${hasReel ? 'bg-yellow-700 border-yellow-500' : 'bg-gray-700 border-gray-500'}`}>
            {hasReel && <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,#000_100%)] opacity-30"></div>}
            <div className={`w-12 h-1.5 bg-gray-300 rotate-45 rounded-full ${hasReel ? 'bg-yellow-200 shadow-[0_0_10px_gold]' : ''}`}></div>
            {hasReel && <div className="absolute w-10 h-10 rounded-full border-2 border-yellow-900/50"></div>}
          </div>

          {/* Guides / L30 Anchor Hook */}
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((pos, i) => (
            <div key={i} className={`absolute -left-1 w-2.5 h-2.5 rounded-full z-10 ${hasHook ? 'border-2 border-yellow-500 bg-yellow-900' : 'border border-yellow-600'}`} style={{ top: `${pos * 100}%` }}>
              {hasHook && i === 0 && (
                <div className="absolute -left-4 top-0 text-lg rotate-90 filter drop-shadow-md">⚓</div>
              )}
            </div>
          ))}

          {/* L50 Effect */}
          {hasEffect && (
            <div className="absolute top-0 left-0 w-full h-full animate-pulse opacity-30 bg-gradient-to-t from-transparent via-purple-500 to-transparent mix-blend-color-dodge"></div>
          )}
        </div>
      </motion.div>

      {/* --- LINE & BOBBER --- */}
      {phase !== GamePhase.IDLE && phase !== GamePhase.ANIMATING_CATCH && (
        <>
          <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
            <motion.line
              initial={{ x1: "82%", y1: "65%", x2: "82%", y2: "65%" }}
              animate={
                phase === GamePhase.CASTING
                  ? {
                    // Tip Tracking (Matches Rod Rotation Stages)
                    // 0: Idle, 0.3: Windup (Down/Right), 0.45: Snap (Up/Left), 0.7: Recoil, 1: Idle
                    x1: ["82%", "98%", "35%", "75%", "82%"],
                    y1: ["65%", "85%", "35%", "60%", "65%"],

                    // Bobber Connection Tracking
                    // 0: Idle, 0.3: With Rod, 0.45: Launching, 0.7: Landed, 1: Settle
                    x2: ["82%", "98%", "40%", "50%", "50%"],
                    y2: ["65%", "85%", "25%", "55%", "55%"],
                    opacity: [0, 1, 1, 1, 1]
                  }
                  : { x1: "82%", y1: "65%", x2: "50%", y2: "55%", opacity: 1 }
              }
              transition={
                phase === GamePhase.CASTING
                  ? {
                    default: { duration: 1.0, ease: "easeInOut", times: [0, 0.3, 0.45, 0.7, 1] }
                  }
                  : { duration: 0.5 }
              }
              stroke={hasCarbon ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)"}
              strokeWidth="1.5"
            />
          </svg>

          <motion.div
            className="absolute z-20 pointer-events-none"
            initial={{ top: "60%", left: "80%", scale: 1, opacity: 0 }}
            animate={
              phase === GamePhase.CASTING
                ? {
                  // Flight Path
                  top: ["60%", "85%", "25%", "55%", "55%"], // Deep arc
                  left: ["80%", "98%", "40%", "50%", "50%"],

                  // Depth Simulation (Close -> Far)
                  scale: [1, 0.9, 1.2, 0.6, 0.6],
                  opacity: [0, 1, 1, 1, 1],
                  rotate: [0, 45, -45, 180, 0]
                }
                : phase === GamePhase.WAITING
                  ? { top: "55%", left: "50%", scale: 0.6, opacity: 1, y: [0, 4, 0] }
                  : phase === GamePhase.HOOKED
                    ? { top: "60%", left: "50%", scale: 0.7, opacity: 1, rotate: [0, 15, -15, 0] }
                    : { top: "55%", left: "50%", scale: 0.6, opacity: 1 }
            }
            transition={
              phase === GamePhase.CASTING
                ? { duration: 3.0, times: [0, 0.3, 0.45, 0.7, 1], ease: "easeInOut" }
                : phase === GamePhase.WAITING
                  ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
                  : { duration: 0.4 }
            }
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2 group">
              <div className="w-6 h-6 bg-red-600 rounded-t-full border border-black/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-1 left-1 w-2 h-1 bg-white/40 rounded-full"></div>
              </div>
              <div className="w-6 h-6 bg-white rounded-b-full border border-black/20 shadow-lg"></div>
              {phase === GamePhase.HOOKED && (
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="absolute -inset-4 bg-white rounded-full z-[-1]"
                />
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* --- UI HINTS --- */}
      <AnimatePresence>
        {phase === GamePhase.IDLE && showSwipeHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-[35%] w-full flex flex-col items-center pointer-events-none z-40"
          >
            <div className="text-white font-black text-2xl tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] stroke-black uppercase">Swipe Up</div>
            <motion.div
              animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-2 text-4xl filter drop-shadow-lg"
            >
              👆
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === GamePhase.HOOKED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none bg-red-500/10">
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.2, repeat: Infinity }}
            className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_4px_0px_rgba(0,0,0,1)] stroke-black"
          >
            TAP!
          </motion.div>
          <div className="mt-8 w-48 h-12 border-4 border-white rounded-full overflow-hidden relative shadow-2xl bg-black/40">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 1, ease: "linear" }}
              className="h-full bg-gradient-to-r from-green-500 to-green-300"
            />
          </div>
        </div>
      )}

      {/* --- L50 PRESTIGE ANIMATION --- */}
      <AnimatePresence>
        {phase === GamePhase.ANIMATING_CATCH && (
          <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">

            {/* 1. Pirate Ship Slides In from Right */}
            <motion.div
              initial={{ x: '100vw', opacity: 0 }}
              animate={{ x: '20%', opacity: 1 }}
              exit={{ x: '100vw', opacity: 0 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="absolute bottom-32 right-0 w-80 h-80 z-10"
            >
              <div className="text-[200px] drop-shadow-2xl transform -scale-x-100">⛵</div>
            </motion.div>

            {/* 2. Muzzle Flash (Explosion) */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0] }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="absolute bottom-48 right-[10%] w-32 h-32 bg-yellow-400 rounded-full blur-md z-20 mix-blend-screen"
            >
              <div className="absolute inset-0 bg-white rounded-full animate-ping"></div>
            </motion.div>

            {/* 3. Cannon Ball / Fish Flight (Ballistic Arc) */}
            <motion.div
              initial={{ x: 150, y: 150, scale: 0, rotate: 0 }}
              animate={{
                x: [150, -100],
                y: [150, -300, 200], // Up then Down
                scale: [0.5, 1.5, 1],
                rotate: [0, 360, 720, 1080]
              }}
              transition={{ duration: 1.5, delay: 0.9, ease: "easeInOut" }} // Match explosion
              className="absolute z-30"
            >
              <div className="text-7xl filter drop-shadow-lg">🐟</div>
              {/* Trail */}
              <motion.div
                animate={{ opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full blur-sm"
              />
            </motion.div>

            {/* 4. Basket Catch Impact */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }} // Appears before fish lands
              className="absolute bottom-10 left-[calc(50%-50px)] text-8xl z-20"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                transition={{ delay: 2.3, duration: 0.4 }} // Impact time
              >
                🧺
              </motion.div>
            </motion.div>

            {/* Impact Dust */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [1, 2, 3] }}
              transition={{ delay: 2.3, duration: 0.5 }}
              className="absolute bottom-10 left-[calc(50%-50px)] w-24 h-24 bg-orange-100 rounded-full blur-xl z-10"
            />
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default FishingScene;
