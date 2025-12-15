import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Gift, X, Zap, Fish, Skull, Award } from 'lucide-react';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface DailyBaitBoxProps {
    onClose: () => void;
}

// Reward tables from blueprint
const FREE_REWARDS = [
    { day: 1, bait: 2, casts: 3, xp: 25, label: '2× Basic Bait' },
    { day: 2, bait: 3, casts: 4, xp: 30, label: '3× Basic Bait' },
    { day: 3, bait: 2, casts: 5, xp: 35, label: '2× Premium Shrimp' },
    { day: 4, bait: 3, casts: 5, xp: 40, label: '3× Premium Shrimp' },
    { day: 5, bait: 2, casts: 6, xp: 50, label: '2× Uncommon Lure' },
    { day: 6, bait: 3, casts: 7, xp: 60, label: '3× Uncommon Lure' },
    { day: 7, bait: 3, casts: 10, xp: 100, label: '🦈 Streak Chest!' },
];

const PREMIUM_REWARDS = [
    { day: 1, bait: 4, casts: 5, xp: 50, label: '4× Premium Shrimp' },
    { day: 2, bait: 5, casts: 6, xp: 60, label: '5× Premium Shrimp' },
    { day: 3, bait: 4, casts: 8, xp: 75, label: '4× Rare Squid' },
    { day: 4, bait: 5, casts: 10, xp: 90, label: '5× Rare Squid' },
    { day: 5, bait: 4, casts: 12, xp: 110, label: '4× Epic Chum' },
    { day: 6, bait: 5, casts: 15, xp: 140, label: '5× Epic Chum' },
    { day: 7, bait: 5, casts: 20, xp: 200, usdc: 1, label: '🐋 Premium Chest!' },
];

type KrakenPhase = 'hidden' | 'shaking' | 'emerging' | 'choice' | 'fighting' | 'win' | 'lose';

const DailyBaitBox: React.FC<DailyBaitBoxProps> = ({ onClose }) => {
    const { userStats, addXP, addCasts } = useGameStore();

    // Streak state
    const [currentStreak, setCurrentStreak] = useState(1);
    const [canClaim, setCanClaim] = useState(true);
    const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
    const [showReward, setShowReward] = useState(false);
    const [claimedReward, setClaimedReward] = useState<typeof FREE_REWARDS[0] | null>(null);
    const [streakBroken, setStreakBroken] = useState(false);

    // Kraken mini-game state
    const [krakenPhase, setKrakenPhase] = useState<KrakenPhase>('hidden');
    const [tapCount, setTapCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(5);
    const TAP_GOAL = 30;

    // Load streak from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('seacaster_streak');
        if (saved) {
            const data = JSON.parse(saved);
            const lastClaim = new Date(data.lastClaimDate);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Same day = already claimed
            if (lastClaim.toDateString() === today.toDateString()) {
                setCanClaim(false);
                setCurrentStreak(data.streak);
                setLastClaimDate(data.lastClaimDate);
            }
            // Yesterday = continue streak
            else if (lastClaim.toDateString() === yesterday.toDateString()) {
                setCurrentStreak(data.streak);
                setLastClaimDate(data.lastClaimDate);
            }
            // Older = streak broken
            else {
                setStreakBroken(true);
                setCurrentStreak(1);
            }
        }
    }, []);

    const rewards = userStats.premium ? PREMIUM_REWARDS : FREE_REWARDS;
    const todayReward = rewards[(currentStreak - 1) % 7];
    const isDay7 = currentStreak % 7 === 0 || (canClaim && (currentStreak % 7 === 6 || currentStreak === 7));

    const handleClaim = useCallback(() => {
        if (!canClaim) return;

        triggerHaptic(Haptics.success);

        // Day 7 triggers Kraken!
        if ((currentStreak + 1) % 7 === 0 || currentStreak === 6) {
            setKrakenPhase('shaking');
            setTimeout(() => setKrakenPhase('emerging'), 1500);
            setTimeout(() => setKrakenPhase('choice'), 3000);
            return;
        }

        // Normal claim
        completeReward();
    }, [canClaim, currentStreak]);

    const completeReward = () => {
        const reward = rewards[currentStreak % 7];
        const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;

        // Apply rewards
        addXP(reward.xp);
        addCasts(reward.casts);

        // Save to localStorage
        const saveData = {
            streak: nextStreak,
            lastClaimDate: new Date().toISOString(),
        };
        localStorage.setItem('seacaster_streak', JSON.stringify(saveData));

        setClaimedReward(reward);
        setShowReward(true);
        setCanClaim(false);
        setCurrentStreak(nextStreak);

        setTimeout(() => setShowReward(false), 3000);
    };

    // Kraken choice handlers
    const handleFight = () => {
        setKrakenPhase('fighting');
        setTapCount(0);
        setTimeLeft(5);
        triggerHaptic(Haptics.hook);
    };

    const handleSwim = () => {
        // Lose 1 bait, skip challenge
        triggerHaptic(Haptics.fail);
        setKrakenPhase('lose');
        setTimeout(() => {
            completeReward();
            setKrakenPhase('hidden');
        }, 2000);
    };

    // Kraken tap game
    const handleTap = () => {
        if (krakenPhase !== 'fighting') return;

        triggerHaptic(Haptics.soft);
        setTapCount(prev => {
            const newCount = prev + 1;
            if (newCount >= TAP_GOAL) {
                triggerHaptic(Haptics.success);
                setKrakenPhase('win');
                // Bonus legendary bait!
                setTimeout(() => {
                    completeReward();
                    setKrakenPhase('hidden');
                }, 2500);
            }
            return newCount;
        });
    };

    // Kraken timer
    useEffect(() => {
        if (krakenPhase !== 'fighting') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (tapCount < TAP_GOAL) {
                        setKrakenPhase('lose');
                        triggerHaptic(Haptics.fail);
                        setTimeout(() => {
                            completeReward();
                            setKrakenPhase('hidden');
                        }, 2000);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [krakenPhase, tapCount]);

    return (
        <motion.div
            className="bait-box-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bait-box-container"
                initial={{ y: 100, scale: 0.8 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 100, scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Title */}
                <div className="box-title">
                    <Gift className="title-icon" />
                    <h2>Daily Bait Box</h2>
                </div>

                {/* Streak Counter */}
                <div className="streak-counter">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div
                            key={day}
                            className={`streak-day ${day <= (currentStreak % 7 || 7) ? 'claimed' : ''} ${day === 7 ? 'special' : ''}`}
                        >
                            {day === 7 ? '🦈' : day}
                        </div>
                    ))}
                </div>

                {/* Streak Broken Warning */}
                <AnimatePresence>
                    {streakBroken && (
                        <motion.div
                            className="streak-broken"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <Skull className="skull-icon" />
                            <span>Your streak died...</span>
                            <div className="skeleton-fish">🐟💀</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bait Box Visual */}
                <motion.div
                    className={`bait-box ${krakenPhase === 'shaking' ? 'shaking' : ''}`}
                    animate={krakenPhase === 'shaking' ? {
                        rotate: [-5, 5, -5, 5, 0],
                        transition: { repeat: Infinity, duration: 0.3 }
                    } : {}}
                >
                    <div className="box-lid" />
                    <div className="box-body">
                        <div className="box-lock" />
                    </div>

                    {/* Kraken Tentacle */}
                    <AnimatePresence>
                        {(krakenPhase === 'emerging' || krakenPhase === 'choice' || krakenPhase === 'fighting') && (
                            <motion.div
                                className="kraken-tentacle"
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: -30, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                            >
                                🦑
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Today's Reward Preview */}
                {krakenPhase === 'hidden' && (
                    <div className="reward-preview">
                        <div className="reward-day">Day {currentStreak % 7 || 7}</div>
                        <div className="reward-label">{todayReward.label}</div>
                        <div className="reward-details">
                            <span><Zap size={14} /> +{todayReward.xp} XP</span>
                            <span><Fish size={14} /> +{todayReward.casts} casts</span>
                        </div>
                    </div>
                )}

                {/* Kraken Choice Modal */}
                <AnimatePresence>
                    {krakenPhase === 'choice' && (
                        <motion.div
                            className="kraken-choice"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <h3>🦑 THE KRAKEN APPEARS!</h3>
                            <p>Will you fight for Legendary Bait?</p>
                            <div className="choice-buttons">
                                <button className="btn-fight" onClick={handleFight}>
                                    ⚔️ FIGHT!
                                </button>
                                <button className="btn-swim" onClick={handleSwim}>
                                    🏊 Swim away
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Kraken Tap Game */}
                <AnimatePresence>
                    {krakenPhase === 'fighting' && (
                        <motion.div
                            className="kraken-game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleTap}
                        >
                            <div className="game-timer">{timeLeft}s</div>
                            <div className="game-progress">
                                <motion.div
                                    className="progress-fill"
                                    animate={{ width: `${(tapCount / TAP_GOAL) * 100}%` }}
                                />
                            </div>
                            <div className="tap-counter">{tapCount}/{TAP_GOAL}</div>
                            <motion.div
                                className="tap-zone"
                                animate={{ scale: [1, 0.95, 1] }}
                                transition={{ duration: 0.1, repeat: Infinity }}
                            >
                                TAP FAST! 🦑
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Win/Lose Results */}
                <AnimatePresence>
                    {krakenPhase === 'win' && (
                        <motion.div
                            className="result-screen win"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        >
                            <Award size={60} />
                            <h3>VICTORY!</h3>
                            <p>+1 Legendary Kraken Bait! 🦑</p>
                        </motion.div>
                    )}
                    {krakenPhase === 'lose' && (
                        <motion.div
                            className="result-screen lose"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        >
                            <Skull size={60} />
                            <h3>ESCAPED...</h3>
                            <p>The Kraken retreats... for now</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Claim Button */}
                {krakenPhase === 'hidden' && (
                    <motion.button
                        className={`claim-btn ${!canClaim ? 'disabled' : ''} ${userStats.premium ? 'premium' : ''}`}
                        onClick={handleClaim}
                        disabled={!canClaim}
                        whileTap={{ scale: canClaim ? 0.95 : 1 }}
                    >
                        {canClaim ? 'OPEN BOX!' : 'Come Back Tomorrow!'}
                    </motion.button>
                )}

                {/* Reward Popup */}
                <AnimatePresence>
                    {showReward && claimedReward && (
                        <motion.div
                            className="reward-popup"
                            initial={{ y: 50, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                        >
                            <div className="reward-icon">🎁</div>
                            <div className="reward-text">{claimedReward.label}</div>
                            <div className="reward-xp">+{claimedReward.xp} XP</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <style>{`
        .bait-box-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .bait-box-container {
          position: relative;
          width: 100%;
          max-width: 380px;
          background: linear-gradient(180deg, #2C3E50 0%, #1A252F 100%);
          border-radius: 24px;
          padding: 24px;
          border: 3px solid #5D4E37;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .box-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .box-title h2 {
          color: #F4D03F;
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .title-icon {
          color: #F4D03F;
          width: 28px;
          height: 28px;
        }

        /* Streak Counter */
        .streak-counter {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .streak-day {
          width: 36px;
          height: 36px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 700;
          font-size: 14px;
        }

        .streak-day.claimed {
          background: linear-gradient(180deg, #27AE60 0%, #1E8449 100%);
          border-color: #2ECC71;
          color: white;
          box-shadow: 0 2px 8px rgba(46, 204, 113, 0.4);
        }

        .streak-day.special {
          background: linear-gradient(180deg, #9B59B6 0%, #8E44AD 100%);
          border-color: #A569BD;
          font-size: 18px;
        }

        .streak-day.special.claimed {
          background: linear-gradient(180deg, #F39C12 0%, #D68910 100%);
          border-color: #F4D03F;
          box-shadow: 0 2px 12px rgba(243, 156, 18, 0.5);
        }

        /* Streak Broken */
        .streak-broken {
          background: rgba(231, 76, 60, 0.2);
          border: 2px solid #E74C3C;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          text-align: center;
          color: #E74C3C;
        }

        .skull-icon {
          width: 24px;
          height: 24px;
          margin-bottom: 4px;
        }

        .skeleton-fish {
          font-size: 24px;
          margin-top: 8px;
          animation: decay 3s ease-out forwards;
        }

        @keyframes decay {
          0% { opacity: 1; filter: none; }
          100% { opacity: 0.3; filter: grayscale(1); }
        }

        /* Bait Box */
        .bait-box {
          position: relative;
          width: 120px;
          height: 100px;
          margin: 0 auto 24px;
        }

        .bait-box.shaking {
          animation: boxShake 0.3s infinite;
        }

        @keyframes boxShake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        .box-lid {
          position: absolute;
          top: 0;
          left: 5px;
          right: 5px;
          height: 25px;
          background: linear-gradient(180deg, #8B5A2B 0%, #6B4423 100%);
          border: 3px solid #5D4E37;
          border-radius: 8px 8px 0 0;
          box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.2);
        }

        .box-body {
          position: absolute;
          top: 22px;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #A0522D 0%, #8B4513 100%);
          border: 3px solid #5D4E37;
          border-radius: 4px 4px 12px 12px;
          box-shadow: inset 0 -5px 15px rgba(0, 0, 0, 0.3);
        }

        .box-lock {
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 24px;
          background: linear-gradient(180deg, #DAA520 0%, #B8860B 100%);
          border-radius: 4px 4px 8px 8px;
          border: 2px solid #8B6914;
        }

        .box-lock::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 12px;
          border: 3px solid #DAA520;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
        }

        /* Kraken Tentacle */
        .kraken-tentacle {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 50px;
          z-index: 10;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }

        /* Reward Preview */
        .reward-preview {
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .reward-day {
          color: #F4D03F;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .reward-label {
          color: white;
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .reward-details {
          display: flex;
          justify-content: center;
          gap: 20px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .reward-details span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Kraken Choice */
        .kraken-choice {
          text-align: center;
          padding: 20px;
        }

        .kraken-choice h3 {
          color: #E74C3C;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .kraken-choice p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
        }

        .choice-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-fight {
          flex: 1;
          padding: 14px 20px;
          background: linear-gradient(180deg, #E74C3C 0%, #C0392B 100%);
          border: 3px solid #922B21;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 0 #7B241C;
        }

        .btn-swim {
          flex: 1;
          padding: 14px 20px;
          background: linear-gradient(180deg, #3498DB 0%, #2980B9 100%);
          border: 3px solid #1F618D;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 0 #154360;
        }

        /* Kraken Tap Game */
        .kraken-game {
          text-align: center;
          padding: 20px;
        }

        .game-timer {
          font-size: 48px;
          font-weight: 800;
          color: #E74C3C;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          margin-bottom: 16px;
        }

        .game-progress {
          height: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #E74C3C 0%, #F39C12 100%);
          border-radius: 8px;
        }

        .tap-counter {
          color: white;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .tap-zone {
          background: linear-gradient(180deg, #9B59B6 0%, #8E44AD 100%);
          border: 4px solid #7D3C98;
          border-radius: 20px;
          padding: 40px;
          font-size: 24px;
          font-weight: 800;
          color: white;
          cursor: pointer;
          user-select: none;
          box-shadow: 0 6px 0 #5B2C6F, 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .tap-zone:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #5B2C6F;
        }

        /* Result Screens */
        .result-screen {
          text-align: center;
          padding: 30px;
        }

        .result-screen.win {
          color: #F4D03F;
        }

        .result-screen.lose {
          color: #E74C3C;
        }

        .result-screen h3 {
          font-size: 28px;
          margin: 16px 0 8px;
        }

        .result-screen p {
          font-size: 16px;
          opacity: 0.9;
        }

        /* Claim Button */
        .claim-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(180deg, #27AE60 0%, #1E8449 100%);
          border: 3px solid #196F3D;
          border-radius: 14px;
          color: white;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 0 #145A32, 0 8px 20px rgba(0, 0, 0, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .claim-btn:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 #145A32;
        }

        .claim-btn.premium {
          background: linear-gradient(180deg, #F39C12 0%, #D68910 100%);
          border-color: #B7950B;
          box-shadow: 0 4px 0 #9A7D0A, 0 8px 20px rgba(243, 156, 18, 0.3);
        }

        .claim-btn.disabled {
          background: linear-gradient(180deg, #5D6D7E 0%, #4D5656 100%);
          border-color: #424949;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Reward Popup */
        .reward-popup {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(180deg, #F4D03F 0%, #D4AC0D 100%);
          border: 4px solid #B7950B;
          border-radius: 20px;
          padding: 24px 40px;
          text-align: center;
          z-index: 20;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .reward-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }

        .reward-text {
          color: #1A252F;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .reward-xp {
          color: #27AE60;
          font-size: 24px;
          font-weight: 800;
        }
      `}</style>
        </motion.div>
    );
};

export default DailyBaitBox;
