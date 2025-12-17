import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fish, Rarity } from '../types';
import { Haptics, triggerHaptic } from '../utils/haptics';
import { useSound } from '../hooks/useSound';

interface ReelMiniGameProps {
    fish: Fish;
    onSuccess: () => void;
    onFail: () => void;
    isActive: boolean;
}

/**
 * Tug-of-War Reeling Mini-Game
 * 
 * - Fish pulls rod left/right randomly
 * - Player must swipe opposite direction to counter
 * - Tension bar: Too loose = escape, Too tight = line break
 * - Bigger/rarer fish = More violent patterns
 * - Perfect reel = Bonus XP/Coins
 */
const ReelMiniGame: React.FC<ReelMiniGameProps> = ({
    fish,
    onSuccess,
    onFail,
    isActive,
}) => {
    // Core state
    const [tension, setTension] = useState(50); // 0-100, ideal is 40-60
    const [fishPosition, setFishPosition] = useState(50); // Horizontal position %
    const [reelProgress, setReelProgress] = useState(0); // 0-100, 100 = caught
    const [fishPullDirection, setFishPullDirection] = useState<'left' | 'right' | 'none'>('none');
    const [isPulling, setIsPulling] = useState(false);
    const [showWarning, setShowWarning] = useState<'loose' | 'tight' | null>(null);
    const [combo, setCombo] = useState(0);
    const [showPerfect, setShowPerfect] = useState(false);

    const touchStartX = useRef<number | null>(null);
    const lastSwipeTime = useRef<number>(0);
    const { play } = useSound();

    // Fish difficulty based on rarity
    const getDifficulty = useCallback(() => {
        const difficulties = {
            [Rarity.COMMON]: { pullStrength: 3, pullSpeed: 800, reelSpeed: 15 },
            [Rarity.UNCOMMON]: { pullStrength: 5, pullSpeed: 600, reelSpeed: 12 },
            [Rarity.RARE]: { pullStrength: 8, pullSpeed: 500, reelSpeed: 10 },
            [Rarity.EPIC]: { pullStrength: 12, pullSpeed: 400, reelSpeed: 8 },
            [Rarity.LEGENDARY]: { pullStrength: 18, pullSpeed: 300, reelSpeed: 5 },
            [Rarity.MYTHIC]: { pullStrength: 25, pullSpeed: 250, reelSpeed: 3 },
        };
        return difficulties[fish.rarity] || difficulties[Rarity.COMMON];
    }, [fish.rarity]);

    // Fish AI - random pulls
    useEffect(() => {
        if (!isActive) return;

        const difficulty = getDifficulty();
        const pullInterval = setInterval(() => {
            // Random pull direction
            const rand = Math.random();
            if (rand < 0.35) {
                setFishPullDirection('left');
                setIsPulling(true);
                triggerHaptic(Haptics.light);
            } else if (rand < 0.7) {
                setFishPullDirection('right');
                setIsPulling(true);
                triggerHaptic(Haptics.light);
            } else {
                setFishPullDirection('none');
                setIsPulling(false);
            }

            // End pull after short duration
            setTimeout(() => {
                setFishPullDirection('none');
                setIsPulling(false);
            }, 300 + Math.random() * 200);
        }, difficulty.pullSpeed);

        return () => clearInterval(pullInterval);
    }, [isActive, getDifficulty]);

    // Apply fish pull force to tension and position
    useEffect(() => {
        if (!isActive) return;

        const difficulty = getDifficulty();
        const updateInterval = setInterval(() => {
            if (isPulling && fishPullDirection !== 'none') {
                setTension((prev) => {
                    const force = fishPullDirection === 'left' ? -difficulty.pullStrength : difficulty.pullStrength;
                    return Math.max(0, Math.min(100, prev + force * 0.3));
                });

                setFishPosition((prev) => {
                    const move = fishPullDirection === 'left' ? -2 : 2;
                    return Math.max(10, Math.min(90, prev + move));
                });
            }

            // Natural tension decay toward 50
            setTension((prev) => {
                if (prev < 45) return prev + 0.5;
                if (prev > 55) return prev - 0.5;
                return prev;
            });

            // Check win/lose conditions
            if (tension <= 5) {
                setShowWarning('loose');
                setTimeout(() => {
                    triggerHaptic(Haptics.heavy);
                    onFail();
                }, 500);
            } else if (tension >= 95) {
                setShowWarning('tight');
                setTimeout(() => {
                    triggerHaptic(Haptics.heavy);
                    onFail();
                }, 500);
            } else {
                setShowWarning(null);
            }
        }, 50);

        return () => clearInterval(updateInterval);
    }, [isActive, isPulling, fishPullDirection, tension, getDifficulty, onFail]);

    // Touch handlers for player reeling
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;

        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX.current;

        // Detect swipe direction
        if (Math.abs(deltaX) > 20) {
            const swipeDir = deltaX > 0 ? 'right' : 'left';
            const now = Date.now();

            // Rate limit swipes
            if (now - lastSwipeTime.current > 100) {
                lastSwipeTime.current = now;

                // Counter the fish pull
                if (swipeDir === fishPullDirection || fishPullDirection === 'none') {
                    // Successful counter or neutral reel
                    const difficulty = getDifficulty();
                    setReelProgress((prev) => Math.min(100, prev + difficulty.reelSpeed));
                    setTension((prev) => {
                        const adjust = swipeDir === 'left' ? -5 : 5;
                        return Math.max(0, Math.min(100, prev + adjust));
                    });

                    // Check for perfect timing (counter during fish pull)
                    if (swipeDir !== fishPullDirection && fishPullDirection !== 'none') {
                        setCombo((prev) => prev + 1);
                        if (combo >= 2) {
                            setShowPerfect(true);
                            triggerHaptic(Haptics.success);
                            setTimeout(() => setShowPerfect(false), 500);
                        }
                    }

                    triggerHaptic(Haptics.soft);
                    play('reel');
                } else {
                    // Wrong direction - fish gains ground
                    setCombo(0);
                    setReelProgress((prev) => Math.max(0, prev - 5));
                    triggerHaptic(Haptics.light);
                }
            }

            touchStartX.current = currentX;
        }
    };

    const handleTouchEnd = () => {
        touchStartX.current = null;
    };

    // Check for win condition
    useEffect(() => {
        if (reelProgress >= 100 && isActive) {
            triggerHaptic(Haptics.legendaryCatch);
            play('success');
            onSuccess();
        }
    }, [reelProgress, isActive, onSuccess, play]);

    const getRarityColor = () => {
        const colors = {
            [Rarity.COMMON]: '#9CA3AF',
            [Rarity.UNCOMMON]: '#10B981',
            [Rarity.RARE]: '#3B82F6',
            [Rarity.EPIC]: '#8B5CF6',
            [Rarity.LEGENDARY]: '#F59E0B',
            [Rarity.MYTHIC]: '#EC4899',
        };
        return colors[fish.rarity] || '#9CA3AF';
    };

    if (!isActive) return null;

    return (
        <motion.div
            className="reel-minigame"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background */}
            <div className="minigame-bg" />

            {/* Title */}
            <div className="minigame-title">
                <span>REEL IT IN!</span>
            </div>

            {/* Fish Display */}
            <motion.div
                className="fish-display"
                animate={{
                    x: `${fishPosition - 50}%`,
                    rotate: fishPullDirection === 'left' ? -15 : fishPullDirection === 'right' ? 15 : 0,
                }}
                transition={{ type: 'spring', damping: 15 }}
            >
                <img src={fish.image} alt={fish.name} className="fish-image" />
                <div className="fish-glow" style={{ backgroundColor: getRarityColor() }} />

                {/* Pull direction indicator */}
                <AnimatePresence>
                    {isPulling && (
                        <motion.div
                            className="pull-indicator"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                        >
                            {fishPullDirection === 'left' ? '👈' : '👉'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Tension Meter */}
            <div className="tension-container">
                <span className="tension-label">TENSION</span>
                <div className="tension-bar">
                    <div className="tension-zone tension-danger-low" />
                    <div className="tension-zone tension-safe" />
                    <div className="tension-zone tension-danger-high" />
                    <motion.div
                        className="tension-indicator"
                        animate={{ left: `${tension}%` }}
                        transition={{ type: 'spring', damping: 20 }}
                    />
                </div>
                <div className="tension-labels">
                    <span className="text-red-400">LOOSE</span>
                    <span className="text-green-400">PERFECT</span>
                    <span className="text-red-400">TIGHT</span>
                </div>
            </div>

            {/* Reel Progress */}
            <div className="progress-container">
                <span className="progress-label">CATCH PROGRESS</span>
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        animate={{ width: `${reelProgress}%` }}
                        style={{ backgroundColor: getRarityColor() }}
                    />
                </div>
                <span className="progress-percent">{Math.round(reelProgress)}%</span>
            </div>

            {/* Instructions */}
            <div className="instructions">
                <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    ← SWIPE TO COUNTER →
                </motion.span>
            </div>

            {/* Combo Display */}
            <AnimatePresence>
                {combo >= 3 && (
                    <motion.div
                        className="combo-display"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                    >
                        {combo}x COMBO!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Perfect Flash */}
            <AnimatePresence>
                {showPerfect && (
                    <motion.div
                        className="perfect-flash"
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        PERFECT!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Warning Overlays */}
            <AnimatePresence>
                {showWarning && (
                    <motion.div
                        className={`warning-overlay ${showWarning}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                    >
                        {showWarning === 'loose' ? 'LINE TOO LOOSE!' : 'LINE BREAKING!'}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .reel-minigame {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          touch-action: pan-y;
        }

        .minigame-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, 
            rgba(0, 50, 100, 0.95) 0%, 
            rgba(0, 30, 60, 0.98) 100%
          );
          backdrop-filter: blur(10px);
        }

        .minigame-title {
          position: relative;
          font-size: 32px;
          font-weight: 900;
          color: white;
          text-shadow: 0 4px 8px rgba(0,0,0,0.5);
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 4px;
        }

        .fish-display {
          position: relative;
          width: 150px;
          height: 150px;
          margin-bottom: 40px;
        }

        .fish-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .fish-glow {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          opacity: 0.4;
          filter: blur(30px);
          z-index: -1;
        }

        .pull-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 48px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        .tension-container {
          position: relative;
          width: 100%;
          max-width: 300px;
          margin-bottom: 30px;
        }

        .tension-label {
          display: block;
          text-align: center;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .tension-bar {
          position: relative;
          height: 20px;
          background: rgba(0,0,0,0.4);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          border: 2px solid rgba(255,255,255,0.2);
        }

        .tension-zone {
          height: 100%;
        }

        .tension-danger-low {
          width: 30%;
          background: linear-gradient(90deg, #E74C3C, #F39C12);
        }

        .tension-safe {
          width: 40%;
          background: linear-gradient(90deg, #27AE60, #27AE60);
        }

        .tension-danger-high {
          width: 30%;
          background: linear-gradient(90deg, #F39C12, #E74C3C);
        }

        .tension-indicator {
          position: absolute;
          top: -5px;
          width: 8px;
          height: 30px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transform: translateX(-50%);
        }

        .tension-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 600;
          margin-top: 6px;
          text-transform: uppercase;
        }

        .progress-container {
          position: relative;
          width: 100%;
          max-width: 300px;
          margin-bottom: 30px;
        }

        .progress-label {
          display: block;
          text-align: center;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .progress-bar {
          height: 24px;
          background: rgba(0,0,0,0.4);
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,0.2);
        }

        .progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.1s ease-out;
        }

        .progress-percent {
          display: block;
          text-align: center;
          color: white;
          font-size: 18px;
          font-weight: 800;
          margin-top: 8px;
        }

        .instructions {
          color: rgba(255,255,255,0.6);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 2px;
        }

        .combo-display {
          position: absolute;
          top: 20%;
          font-size: 36px;
          font-weight: 900;
          color: #F1C40F;
          text-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }

        .perfect-flash {
          position: absolute;
          font-size: 48px;
          font-weight: 900;
          color: #27AE60;
          text-shadow: 0 4px 16px rgba(39, 174, 96, 0.8);
        }

        .warning-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: white;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        .warning-overlay.loose {
          background: rgba(231, 76, 60, 0.5);
        }

        .warning-overlay.tight {
          background: rgba(231, 76, 60, 0.5);
        }
      `}</style>
        </motion.div>
    );
};

export default ReelMiniGame;
