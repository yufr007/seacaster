import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase, Rarity } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import { Haptics, triggerHaptic } from '../utils/haptics';
import { ChevronLeft, Zap } from 'lucide-react';

interface FishingSceneProps {
  onBack?: () => void;
}

/**
 * Improved 2D Fishing Scene with visible rod, fish, and synchronized haptics
 * Replaces previous off-screen rod implementation
 */
const FishingScene: React.FC<FishingSceneProps> = ({ onBack }) => {
  const {
    phase,
    castLine,
    attemptCatch,
    failCatch,
    userStats,
    hookedFish,
    finishCatchAnimation
  } = useGameStore();

  const touchStartY = useRef<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [castPower, setCastPower] = useState(0);
  const [isCasting, setIsCasting] = useState(false);
  const { play } = useSound();

  // Rod animation state
  const [rodAngle, setRodAngle] = useState(0);

  // Fish animation state
  const [fishBounce, setFishBounce] = useState(0);
  const [showFish, setShowFish] = useState(false);

  // Screen shake for impact
  const [screenShake, setScreenShake] = useState(false);

  // Cast splash effect
  const [showSplash, setShowSplash] = useState(false);

  // Hide swipe hint when not idle
  useEffect(() => {
    if (phase !== GamePhase.IDLE) {
      setShowSwipeHint(false);
    } else {
      const timer = setTimeout(() => setShowSwipeHint(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Sound effects based on phase
  useEffect(() => {
    if (phase === GamePhase.CASTING) {
      play('cast');
    } else if (phase === GamePhase.HOOKED) {
      play('splash');
    } else if (phase === GamePhase.REWARD) {
      play('success');
    }
  }, [phase, play]);

  // Rod animation during casting with screen shake
  useEffect(() => {
    if (phase === GamePhase.CASTING) {
      // Dramatic casting animation sequence
      const timeline = [
        { angle: -35, time: 0 },      // Big wind up
        { angle: 60, time: 150 },     // Power swing forward
        { angle: 45, time: 250 },     // Follow through
        { angle: 30, time: 400 },     // Cast release
        { angle: 15, time: 600 },     // Settling
        { angle: 10, time: 1000 },    // Rest during cast
      ];

      timeline.forEach(({ angle, time }) => {
        setTimeout(() => setRodAngle(angle), time);
      });

      // Screen shake on release
      setTimeout(() => {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
      }, 150);

      // Splash effect when bobber hits water
      setTimeout(() => {
        setShowSplash(true);
        setTimeout(() => setShowSplash(false), 800);
      }, 600);

      return () => setRodAngle(0);
    } else if (phase === GamePhase.WAITING) {
      // Gentle idle sway
      setRodAngle(12);
    } else if (phase === GamePhase.HOOKED) {
      // Rod bends dramatically when fish is hooked
      setRodAngle(-25);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    } else {
      setRodAngle(0);
    }
  }, [phase]);

  // Fish appearance and bounce when hooked
  useEffect(() => {
    if (phase === GamePhase.HOOKED && hookedFish) {
      setShowFish(true);

      // Fish bounce animation synchronized with haptics
      let bounceCount = 0;
      const maxBounces = 20;

      const bounceInterval = setInterval(() => {
        bounceCount++;
        const bounceValue = Math.sin(bounceCount * 0.4) * 15;
        setFishBounce(bounceValue);

        // Synchronized haptic feedback
        if (bounceCount % 2 === 0) {
          triggerHaptic(Haptics.bite);
        }

        if (bounceCount >= maxBounces) {
          clearInterval(bounceInterval);
        }
      }, 150);

      return () => {
        clearInterval(bounceInterval);
        setFishBounce(0);
      };
    } else {
      setShowFish(false);
      setFishBounce(0);
    }
  }, [phase, hookedFish]);

  // Auto-finish prestige animation
  useEffect(() => {
    if (phase === GamePhase.ANIMATING_CATCH) {
      triggerHaptic(Haptics.heavy);
      setTimeout(() => {
        play('success');
        triggerHaptic(Haptics.success);
        finishCatchAnimation();
      }, 2000);
    }
  }, [phase, finishCatchAnimation, play]);

  // Touch handlers for swipe-to-cast
  const handleTouchStart = (e: React.TouchEvent) => {
    if (phase === GamePhase.IDLE && userStats.castsRemaining > 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsCasting(true);
      setCastPower(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (phase === GamePhase.IDLE && touchStartY.current !== null) {
      const deltaY = touchStartY.current - e.touches[0].clientY;
      const power = Math.min(100, Math.max(0, (deltaY / 150) * 100));
      setCastPower(power);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsCasting(false);

    if (phase === GamePhase.IDLE && touchStartY.current !== null) {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY;

      // Swipe up triggers cast
      if (deltaY > 40) {
        castLine();
        triggerHaptic(Haptics.castRelease);
      }
      touchStartY.current = null;
      setCastPower(0);
    }
  };

  // Tap to catch when hooked
  const handleTap = () => {
    if (phase === GamePhase.HOOKED) {
      play('reelSpin');
      triggerHaptic(Haptics.hook);
      attemptCatch();
    }
  };

  // Cut line (fail catch)
  const handleCutLine = () => {
    if (phase === GamePhase.HOOKED) {
      triggerHaptic(Haptics.fail);
      failCatch();
    }
  };

  // Get rarity color
  const getRarityColor = (rarity: Rarity): string => {
    const colors: Record<Rarity, string> = {
      [Rarity.COMMON]: '#95A5A6',
      [Rarity.UNCOMMON]: '#27AE60',
      [Rarity.RARE]: '#3498DB',
      [Rarity.EPIC]: '#9B59B6',
      [Rarity.LEGENDARY]: '#F39C12',
      [Rarity.MYTHIC]: '#E74C3C'
    };
    return colors[rarity] || '#95A5A6';
  };

  return (
    <div
      className={`fishing-scene ${screenShake ? 'screen-shake' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Header Bar */}
      <div className="fishing-header">
        {onBack && (
          <button className="back-btn" onClick={(e) => { e.stopPropagation(); onBack(); }}>
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Energy Counter */}
        <div className="energy-counter">
          <Zap size={16} className="energy-icon" />
          <span className="energy-text">
            {userStats.premium ? '∞' : userStats.castsRemaining}/{userStats.maxCasts}
          </span>
        </div>
      </div>

      {/* Main Scene */}
      <div className="fishing-main">
        {/* Sky */}
        <div className="sky-gradient" />

        {/* Water Surface */}
        <div className="water-surface">
          <div className="water-waves" />

          {/* Splash Effect */}
          <AnimatePresence>
            {showSplash && (
              <motion.div
                className="splash-container"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div className="splash-ring ring-1" animate={{ scale: [1, 2.5], opacity: [0.8, 0] }} transition={{ duration: 0.6 }} />
                <motion.div className="splash-ring ring-2" animate={{ scale: [1, 2], opacity: [0.6, 0] }} transition={{ duration: 0.5, delay: 0.1 }} />
                <motion.div className="splash-ring ring-3" animate={{ scale: [1, 1.5], opacity: [0.4, 0] }} transition={{ duration: 0.4, delay: 0.15 }} />
                {/* Water droplets */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="splash-droplet"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(i * 45 * Math.PI / 180) * 60,
                      y: Math.sin(i * 45 * Math.PI / 180) * 60 - 40,
                      opacity: 0
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ transform: `rotate(${i * 45}deg)` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Underwater */}
        <div className="underwater">
          {/* Fish Shadows during WAITING */}
          <AnimatePresence>
            {phase === GamePhase.WAITING && (
              <>
                <motion.div
                  className="fish-shadow"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{
                    x: [0, 150, 300],
                    y: [0, -20, 40],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, repeatDelay: 2 }}
                />
                <motion.div
                  className="fish-shadow fish-shadow-2"
                  initial={{ x: 350, opacity: 0 }}
                  animate={{
                    x: [-100],
                    opacity: [0, 0.2, 0]
                  }}
                  transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* FISHING ROD - VISIBLE AND CENTERED */}
        <motion.div
          className={`rod-wrapper ${userStats.premium ? 'premium' : ''}`}
          animate={{ rotate: rodAngle }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          {/* Rod Handle */}
          <div className="rod-handle">
            <div className="handle-grip" />
            <div className="reel">
              <div className="reel-inner" />
            </div>
          </div>

          {/* Rod Shaft */}
          <div className="rod-shaft">
            <div className="rod-tip" />
          </div>

          {/* Fishing Line */}
          {phase !== GamePhase.IDLE && (
            <motion.div
              className="fishing-line"
              initial={{ height: 0 }}
              animate={{
                height: phase === GamePhase.CASTING ? 180 : 120,
                opacity: 1
              }}
              transition={{ duration: 0.5 }}
            >
              {/* Bobber */}
              <motion.div
                className="bobber"
                animate={
                  phase === GamePhase.WAITING
                    ? { y: [0, 5, 0] }
                    : phase === GamePhase.HOOKED
                      ? { y: [0, -10, 5, -8], scale: [1, 1.2, 1, 1.1] }
                      : {}
                }
                transition={{
                  duration: phase === GamePhase.HOOKED ? 0.3 : 2,
                  repeat: Infinity,
                  ease: phase === GamePhase.HOOKED ? 'easeOut' : 'easeInOut'
                }}
              >
                <div className="bobber-top" />
                <div className="bobber-bottom" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* HOOKED FISH */}
        <AnimatePresence>
          {showFish && hookedFish && (
            <motion.div
              className="fish-container"
              initial={{ opacity: 0, y: 50, scale: 0.5 }}
              animate={{
                opacity: 1,
                y: fishBounce,
                scale: 1,
                x: Math.sin(fishBounce * 0.2) * 10
              }}
              exit={{ opacity: 0, y: 100, scale: 0.3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="fish-card" data-rarity={hookedFish.rarity}>
                <div className="fish-image">
                  {hookedFish.image.startsWith('/') ? (
                    <img
                      src={hookedFish.image}
                      alt={hookedFish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span className="fish-emoji">{hookedFish.image}</span>
                  )}
                </div>
                <div className="fish-name">{hookedFish.name}</div>
                <div
                  className="fish-rarity"
                  style={{
                    borderColor: getRarityColor(hookedFish.rarity),
                    color: getRarityColor(hookedFish.rarity)
                  }}
                >
                  {hookedFish.rarity}
                </div>
              </div>

              {/* Bubbles */}
              <motion.div className="bubble b1" animate={{ y: -80, opacity: 0 }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.div className="bubble b2" animate={{ y: -100, opacity: 0 }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }} />
              <motion.div className="bubble b3" animate={{ y: -70, opacity: 0 }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.6 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cast Power Meter */}
        {isCasting && castPower > 10 && (
          <motion.div
            className="power-meter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="power-bar">
              <div className="power-fill" style={{ height: `${castPower}%` }} />
            </div>
            <span className="power-label">POWER</span>
          </motion.div>
        )}

        {/* Swipe Hint */}
        <AnimatePresence>
          {phase === GamePhase.IDLE && showSwipeHint && userStats.castsRemaining > 0 && (
            <motion.div
              className="swipe-hint"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="swipe-icon"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                👆
              </motion.div>
              <span className="swipe-text">SWIPE UP TO CAST</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Casting Indicator */}
        {phase === GamePhase.CASTING && (
          <motion.div
            className="phase-indicator casting"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="indicator-bar">
              <motion.div
                className="indicator-fill"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
              />
            </div>
            <span>Casting...</span>
          </motion.div>
        )}

        {/* Waiting Indicator */}
        {phase === GamePhase.WAITING && (
          <motion.div
            className="phase-indicator waiting"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎣 Waiting for bite...
          </motion.div>
        )}

        {/* Hooked Actions */}
        <AnimatePresence>
          {phase === GamePhase.HOOKED && (
            <motion.div
              className="hooked-ui"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <motion.div
                className="tap-prompt"
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 0.25, repeat: Infinity }}
              >
                TAP TO CATCH!
              </motion.div>

              <div className="catch-timer">
                <motion.div
                  className="timer-fill"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: hookedFish?.catchWindow || 2, ease: 'linear' }}
                />
              </div>

              <div className="action-buttons">
                <button
                  className="btn-catch"
                  onClick={(e) => { e.stopPropagation(); handleTap(); }}
                >
                  🎯 REEL IN
                </button>
                <button
                  className="btn-cut"
                  onClick={(e) => { e.stopPropagation(); handleCutLine(); }}
                >
                  ✂️ CUT LINE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Casts Available */}
        {phase === GamePhase.IDLE && userStats.castsRemaining <= 0 && !userStats.premium && (
          <div className="no-casts">
            <span className="no-casts-icon">⏳</span>
            <span className="no-casts-text">No energy left!</span>
            <span className="no-casts-hint">Refills over time</span>
          </div>
        )}
      </div>

      {/* Bottom HUD */}
      <div className="fishing-hud">
        <div className="hud-item">
          <span className="hud-label">Bait</span>
          <span className="hud-value">🪱</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Level</span>
          <span className="hud-value">{userStats.level}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Streak</span>
          <span className="hud-value">🔥 {userStats.streak}</span>
        </div>
      </div>

      <style>{`
        .fishing-scene {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Nunito', -apple-system, sans-serif;
          touch-action: none;
          user-select: none;
        }

        .fishing-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          padding-top: max(12px, env(safe-area-inset-top));
        }

        .back-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%);
          border: 3px solid #1A5276;
          border-radius: 10px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 3px 0 #0E3A5E;
        }

        .energy-counter {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 8px 14px;
        }

        .energy-icon {
          color: #F4D03F;
          fill: #F4D03F;
        }

        .energy-text {
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .fishing-main {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        /* Sky */
        .sky-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 45%;
          background: linear-gradient(180deg, #1A365D 0%, #2C5282 40%, #4299E1 100%);
        }

        /* Water */
        .water-surface {
          position: absolute;
          top: 42%;
          left: 0;
          right: 0;
          height: 8%;
          background: linear-gradient(180deg, #4299E1 0%, #2B6CB0 50%, #1E4E8C 100%);
          z-index: 5;
        }

        .water-waves {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 60'%3E%3Cpath d='M0,30 Q300,0 600,30 T1200,30' stroke='%23ffffff' stroke-width='2' fill='none' opacity='0.3'/%3E%3C/svg%3E") repeat-x;
          background-size: 400px 30px;
          animation: waveMove 4s linear infinite;
        }

        @keyframes waveMove {
          0% { background-position: 0 0; }
          100% { background-position: 400px 0; }
        }

        .underwater {
          position: absolute;
          top: 48%;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #1E4E8C 0%, #0D3B66 30%, #051F40 100%);
          z-index: 4;
        }

        .fish-shadow {
          position: absolute;
          top: 20%;
          left: 10%;
          width: 80px;
          height: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          filter: blur(4px);
        }

        .fish-shadow-2 {
          top: 40%;
          width: 120px;
          height: 30px;
        }

        /* ROD STYLES - LARGE AND PROMINENT */
        .rod-wrapper {
          position: absolute;
          bottom: 18%;
          right: 10%;
          width: 260px;
          height: 420px;
          transform-origin: bottom right;
          z-index: 20;
          pointer-events: none;
        }

        .rod-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 30px;
          height: 70px;
          background: linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
          border-radius: 4px;
          border: 2px solid #654321;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
        }

        .handle-grip {
          position: absolute;
          inset: 4px;
          background: linear-gradient(90deg, #D2B48C 0%, #8B7355 50%, #D2B48C 100%);
          border-radius: 2px;
          opacity: 0.7;
        }

        .reel {
          position: absolute;
          top: -10px;
          left: -15px;
          width: 35px;
          height: 35px;
          background: radial-gradient(circle, #C0C0C0 0%, #707070 100%);
          border-radius: 50%;
          border: 2px solid #404040;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .reel-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: #505050;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .rod-shaft {
          position: absolute;
          bottom: 70px;
          right: 14px;
          width: 10px;
          height: 340px;
          background: linear-gradient(90deg, #4A4A4A 0%, #6B6B6B 50%, #4A4A4A 100%);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .rod-tip {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 10px;
          background: #FF4500;
          border-radius: 50%;
        }

        /* Fishing Line */
        .fishing-line {
          position: absolute;
          top: 5px;
          right: 15px;
          width: 2px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%);
          transform-origin: top;
        }

        .bobber {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 30px;
        }

        .bobber-top {
          width: 20px;
          height: 15px;
          background: #E74C3C;
          border-radius: 50% 50% 0 0;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        .bobber-bottom {
          width: 20px;
          height: 15px;
          background: white;
          border-radius: 0 0 50% 50%;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        /* FISH DISPLAY */
        .fish-container {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          text-align: center;
        }

        .fish-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
        }

        .fish-emoji {
          font-size: 48px;
          animation: fishWiggle 0.4s ease-in-out infinite alternate;
        }

        @keyframes fishWiggle {
          0% { transform: scaleX(1) rotate(-5deg); }
          100% { transform: scaleX(-1) rotate(5deg); }
        }

        .fish-name {
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        .fish-rarity {
          font-size: 10px;
          padding: 2px 8px;
          border: 2px solid;
          border-radius: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bubble {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .b1 { left: 0; bottom: -20px; }
        .b2 { left: 30px; bottom: -15px; }
        .b3 { left: 60px; bottom: -25px; }

        /* Power Meter */
        .power-meter {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 40;
        }

        .power-bar {
          width: 20px;
          height: 120px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column-reverse;
        }

        .power-fill {
          width: 100%;
          background: linear-gradient(0deg, #27AE60 0%, #F1C40F 50%, #E74C3C 100%);
          border-radius: 8px;
          transition: height 0.1s;
        }

        .power-label {
          color: white;
          font-size: 10px;
          font-weight: 700;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* Swipe Hint */
        .swipe-hint {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 35;
          pointer-events: none;
        }

        .swipe-icon {
          font-size: 48px;
        }

        .swipe-text {
          color: white;
          font-size: 16px;
          font-weight: 800;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          letter-spacing: 1px;
        }

        /* Phase Indicators */
        .phase-indicator {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 35;
          color: white;
          font-weight: 700;
          font-size: 14px;
          text-align: center;
        }

        .phase-indicator.casting {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .indicator-bar {
          width: 150px;
          height: 8px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 4px;
          overflow: hidden;
        }

        .indicator-fill {
          height: 100%;
          background: linear-gradient(90deg, #27AE60 0%, #58D68D 100%);
          box-shadow: 0 0 10px rgba(88, 214, 141, 0.5);
        }

        /* Hooked UI */
        .hooked-ui {
          position: absolute;
          bottom: 15%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          z-index: 40;
        }

        .tap-prompt {
          font-size: 28px;
          font-weight: 900;
          color: white;
          text-shadow: 3px 3px 0 #C0392B, 0 0 20px rgba(231, 76, 60, 0.8);
          letter-spacing: 2px;
        }

        .catch-timer {
          width: 180px;
          height: 12px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .timer-fill {
          height: 100%;
          background: linear-gradient(90deg, #27AE60 0%, #F1C40F 50%, #E74C3C 100%);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-catch, .btn-cut {
          padding: 12px 20px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 0;
        }

        .btn-catch {
          background: linear-gradient(180deg, #58D68D 0%, #27AE60 100%);
          color: white;
          box-shadow: 0 4px 0 #145A32;
        }

        .btn-cut {
          background: linear-gradient(180deg, #E74C3C 0%, #C0392B 100%);
          color: white;
          box-shadow: 0 4px 0 #922B21;
        }

        /* No Casts */
        .no-casts {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 35;
        }

        .no-casts-icon {
          font-size: 48px;
        }

        .no-casts-text {
          color: white;
          font-weight: 700;
          font-size: 18px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        .no-casts-hint {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        /* Bottom HUD */
        .fishing-hud {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.9) 100%);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 20px;
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          z-index: 45;
        }

        .hud-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .hud-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hud-value {
          font-size: 16px;
          color: white;
          font-weight: 700;
        }

        /* Mobile Optimization */
        @media (max-height: 700px) {
          .rod-wrapper {
            height: 280px;
          }

          .rod-shaft {
            height: 220px;
          }

          .tap-prompt {
            font-size: 22px;
          }
        }

        /* SCREEN SHAKE */
        .screen-shake {
          animation: shakeIt 0.3s ease-in-out;
        }

        @keyframes shakeIt {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-8px, -5px); }
          20% { transform: translate(8px, 5px); }
          30% { transform: translate(-6px, 3px); }
          40% { transform: translate(6px, -3px); }
          50% { transform: translate(-4px, 4px); }
          60% { transform: translate(4px, -2px); }
          70% { transform: translate(-3px, 2px); }
          80% { transform: translate(2px, -1px); }
          90% { transform: translate(-1px, 1px); }
        }

        /* SPLASH EFFECTS */
        .splash-container {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          z-index: 20;
        }

        .splash-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 15px;
          border: 3px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          background: transparent;
        }

        .ring-1 { border-width: 4px; }
        .ring-2 { border-width: 3px; }
        .ring-3 { border-width: 2px; }

        .splash-droplet {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, #87CEEB 100%);
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, -50%);
        }

        /* FISH IMAGE STYLES */
        .fish-image {
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .fish-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
          animation: fishWiggle 0.4s ease-in-out infinite alternate;
        }

        /* RARITY GLOW EFFECTS */
        .fish-card[data-rarity="LEGENDARY"] .fish-image img,
        .fish-card[data-rarity="MYTHIC"] .fish-image img {
          filter: drop-shadow(0 0 20px #F39C12) drop-shadow(0 0 40px rgba(243, 156, 18, 0.5));
        }

        .fish-card[data-rarity="MYTHIC"] .fish-image img {
          filter: drop-shadow(0 0 25px #E74C3C) drop-shadow(0 0 50px rgba(231, 76, 60, 0.6));
          animation: fishWiggle 0.4s ease-in-out infinite alternate, mythicPulse 2s ease-in-out infinite;
        }

        @keyframes mythicPulse {
          0%, 100% { filter: drop-shadow(0 0 25px #E74C3C) drop-shadow(0 0 50px rgba(231, 76, 60, 0.6)); }
          50% { filter: drop-shadow(0 0 35px #9B59B6) drop-shadow(0 0 70px rgba(155, 89, 182, 0.8)); }
        }

        /* ENHANCED ROD - PIRATE STYLE */
        .rod-wrapper.premium .rod-handle {
          background: linear-gradient(90deg, #8B4513 0%, #DAA520 50%, #8B4513 100%);
          border-color: #B8860B;
        }

        .rod-wrapper.premium .rod-shaft {
          background: linear-gradient(90deg, #5C4033 0%, #8B4513 50%, #5C4033 100%);
        }

        .rod-wrapper.premium::before {
          content: '☠️';
          position: absolute;
          bottom: 5px;
          right: 8px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default FishingScene;
