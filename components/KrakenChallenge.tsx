import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import confetti from 'canvas-confetti';

interface KrakenChallengeProps {
    isOpen: boolean;
    onComplete: (success: boolean, bonusEarned: boolean) => void;
    onClose: () => void;
}

const KrakenChallenge: React.FC<KrakenChallengeProps> = ({ isOpen, onComplete, onClose }) => {
    const { userStats, inventory } = useGameStore();
    const { addToast } = useUIStore();

    const [phase, setPhase] = useState<'intro' | 'fight' | 'result'>('intro');
    const [taps, setTaps] = useState(0);
    const [timeLeft, setTimeLeft] = useState(5);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tentacleShake, setTentacleShake] = useState(false);

    const REQUIRED_TAPS = 10;
    const TIME_LIMIT = 5;

    // Handle tap during fight
    const handleTap = useCallback(() => {
        if (phase !== 'fight') return;

        setTaps(prev => {
            const newTaps = prev + 1;

            // Shake tentacle on each tap
            setTentacleShake(true);
            setTimeout(() => setTentacleShake(false), 100);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            if (newTaps >= REQUIRED_TAPS) {
                setPhase('result');
                setIsSuccess(true);

                // Victory confetti!
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#F4D03F', '#27AE60', '#3498DB']
                });
            }

            return newTaps;
        });
    }, [phase]);

    // Countdown timer
    useEffect(() => {
        if (phase !== 'fight' || timeLeft <= 0) return;

        const timer = setTimeout(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setPhase('result');
                    setIsSuccess(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [phase, timeLeft]);

    // Start fight
    const startFight = () => {
        setPhase('fight');
        setTaps(0);
        setTimeLeft(TIME_LIMIT);
    };

    // Sacrifice bait (surrender option)
    const surrenderTribute = () => {
        // Just close and give the chest without bonus
        onComplete(true, false);
    };

    // Handle fight result
    const claimReward = () => {
        onComplete(true, isSuccess);
        if (isSuccess) {
            addToast('🦑 Kraken defeated! Legendary Bait earned!', 'success');
        }
    };

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setPhase('intro');
            setTaps(0);
            setTimeLeft(TIME_LIMIT);
            setIsSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <motion.div
            className="kraken-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Water background effect */}
            <div className="kraken-water-bg">
                <div className="water-wave wave1"></div>
                <div className="water-wave wave2"></div>
            </div>

            <AnimatePresence mode="wait">
                {/* Intro Phase */}
                {phase === 'intro' && (
                    <motion.div
                        key="intro"
                        className="kraken-content intro"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        {/* Tentacle animation */}
                        <motion.div
                            className="tentacle-wrap"
                            animate={{
                                rotate: [-3, 3, -3],
                                y: [0, -10, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="tentacle-emoji">🦑</span>
                        </motion.div>

                        <h1 className="kraken-title">THE KRAKEN<br />WANTS YOUR STREAK!</h1>

                        <p className="kraken-desc">
                            A giant tentacle emerges from the bait box!<br />
                            Will you fight to keep your treasure?
                        </p>

                        <div className="kraken-buttons">
                            <motion.button
                                className="btn-fight"
                                onClick={startFight}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="btn-icon">⚔️</span>
                                <span>FIGHT!</span>
                            </motion.button>

                            <motion.button
                                className="btn-surrender"
                                onClick={surrenderTribute}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="btn-icon">💀</span>
                                <span>Swim with the fishes</span>
                            </motion.button>
                        </div>

                        <p className="kraken-note">
                            Win: Chest + Bonus Legendary Bait<br />
                            Surrender: Just the chest (no bonus)
                        </p>
                    </motion.div>
                )}

                {/* Fight Phase */}
                {phase === 'fight' && (
                    <motion.div
                        key="fight"
                        className="kraken-content fight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="fight-timer">
                            <span className="timer-value">{timeLeft}</span>
                            <span className="timer-label">SECONDS</span>
                        </div>

                        <h2 className="fight-instruction">TAP TO FIGHT!</h2>

                        {/* Tap counter */}
                        <div className="tap-progress">
                            <div className="tap-bar">
                                <motion.div
                                    className="tap-fill"
                                    animate={{ width: `${(taps / REQUIRED_TAPS) * 100}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                            <span className="tap-count">{taps} / {REQUIRED_TAPS}</span>
                        </div>

                        {/* Giant tap button (the tentacle) */}
                        <motion.button
                            className="fight-tap-zone"
                            onClick={handleTap}
                            animate={tentacleShake ? {
                                x: [-10, 10, -10, 10, 0],
                                rotate: [-5, 5, -5, 5, 0]
                            } : {}}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.span
                                className="tentacle-target"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                🦑
                            </motion.span>
                            <span className="tap-text">TAP!</span>
                        </motion.button>

                        {/* Damage indicators */}
                        <AnimatePresence>
                            {taps > 0 && taps < REQUIRED_TAPS && (
                                <motion.div
                                    key={taps}
                                    className="damage-indicator"
                                    initial={{ opacity: 1, y: 0, scale: 1 }}
                                    animate={{ opacity: 0, y: -50, scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    💥
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Result Phase */}
                {phase === 'result' && (
                    <motion.div
                        key="result"
                        className="kraken-content result"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        {isSuccess ? (
                            <>
                                <motion.div
                                    className="result-icon success"
                                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    ⚔️
                                </motion.div>
                                <h1 className="result-title success">VICTORY!</h1>
                                <p className="result-desc">
                                    The Kraken retreats into the depths!<br />
                                    You earned a bonus reward!
                                </p>

                                <div className="bonus-reward">
                                    <span className="bonus-icon">👁️</span>
                                    <div className="bonus-info">
                                        <span className="bonus-name">Legendary Kraken Bait</span>
                                        <span className="bonus-effect">+50% Legendary Chance</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <motion.div
                                    className="result-icon fail"
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    🦑
                                </motion.div>
                                <h1 className="result-title fail">ESCAPED!</h1>
                                <p className="result-desc">
                                    The Kraken grabs your chest but<br />
                                    you still get the contents!
                                </p>

                                <p className="no-bonus">No bonus this time...</p>
                            </>
                        )}

                        <motion.button
                            className="btn-claim"
                            onClick={claimReward}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            OPEN CHEST
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .kraken-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 20, 40, 0.98);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          overflow: hidden;
        }

        .kraken-water-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .water-wave {
          position: absolute;
          bottom: 0;
          left: -50%;
          width: 200%;
          height: 30%;
          background: linear-gradient(180deg, rgba(30, 144, 255, 0.2) 0%, rgba(0, 80, 130, 0.4) 100%);
          border-radius: 40%;
        }

        .wave1 {
          animation: wave 6s ease-in-out infinite;
        }

        .wave2 {
          opacity: 0.5;
          animation: wave 8s ease-in-out infinite reverse;
          bottom: -10%;
        }

        @keyframes wave {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(3%) rotate(2deg); }
        }

        .kraken-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
          max-width: 340px;
        }

        /* Intro Phase */
        .tentacle-wrap {
          margin-bottom: 20px;
        }

        .tentacle-emoji {
          font-size: 100px;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
        }

        .kraken-title {
          font-family: 'Lilita One', cursive;
          font-size: 32px;
          color: #E74C3C;
          text-shadow: 3px 3px 0 #922B21, 0 0 20px rgba(231, 76, 60, 0.5);
          margin: 0 0 16px;
          line-height: 1.2;
        }

        .kraken-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 24px;
          line-height: 1.6;
        }

        .kraken-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .btn-fight {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 32px;
          background: linear-gradient(180deg, #E74C3C 0%, #C0392B 100%);
          border: 4px solid #922B21;
          border-radius: 14px;
          font-family: 'Lilita One', cursive;
          font-size: 24px;
          color: white;
          cursor: pointer;
          box-shadow: 0 6px 0 #6E1E15;
          text-shadow: 2px 2px 0 #922B21;
        }

        .btn-fight:active {
          transform: translateY(6px);
          box-shadow: none;
        }

        .btn-surrender {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(180deg, #5D6D7E 0%, #34495E 100%);
          border: 3px solid #2C3E50;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          box-shadow: 0 4px 0 #1A252F;
        }

        .btn-icon { font-size: 24px; }

        .kraken-note {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 20px;
          line-height: 1.6;
        }

        /* Fight Phase */
        .fight-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 16px;
        }

        .timer-value {
          font-family: 'Lilita One', cursive;
          font-size: 72px;
          color: ${timeLeft <= 2 ? '#E74C3C' : '#F4D03F'};
          text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
          line-height: 1;
        }

        .timer-label {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 3px;
        }

        .fight-instruction {
          font-family: 'Lilita One', cursive;
          font-size: 28px;
          color: white;
          text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
          margin: 0 0 20px;
        }

        .tap-progress {
          width: 100%;
          margin-bottom: 24px;
        }

        .tap-bar {
          width: 100%;
          height: 20px;
          background: linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%);
          border: 3px solid #0D0D0D;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .tap-fill {
          height: 100%;
          background: linear-gradient(180deg, #82E0AA 0%, #27AE60 50%, #1E8449 100%);
          border-radius: 8px;
        }

        .tap-count {
          font-family: 'Lilita One', cursive;
          font-size: 18px;
          color: white;
        }

        .fight-tap-zone {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: linear-gradient(180deg, #8E44AD 0%, #6C3483 100%);
          border: 6px solid #4A235A;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 
            0 8px 0 #2E1A3E,
            0 12px 30px rgba(0, 0, 0, 0.5),
            inset 0 4px 8px rgba(255, 255, 255, 0.2);
        }

        .fight-tap-zone:active {
          transform: translateY(8px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }

        .tentacle-target {
          font-size: 80px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }

        .tap-text {
          font-family: 'Lilita One', cursive;
          font-size: 24px;
          color: white;
          text-shadow: 2px 2px 0 #4A235A;
        }

        .damage-indicator {
          position: absolute;
          font-size: 48px;
          pointer-events: none;
        }

        /* Result Phase */
        .result-icon {
          font-size: 80px;
          margin-bottom: 16px;
        }

        .result-title {
          font-family: 'Lilita One', cursive;
          font-size: 48px;
          margin: 0 0 12px;
        }

        .result-title.success {
          color: #27AE60;
          text-shadow: 3px 3px 0 #1E8449, 0 0 20px rgba(39, 174, 96, 0.5);
        }

        .result-title.fail {
          color: #E74C3C;
          text-shadow: 3px 3px 0 #922B21;
        }

        .result-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 24px;
          line-height: 1.6;
        }

        .bonus-reward {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 24px;
          background: linear-gradient(180deg, #F4D03F 0%, #D4AC0D 100%);
          border: 4px solid #9A7D0A;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 0 #7D6608;
        }

        .bonus-icon {
          font-size: 40px;
        }

        .bonus-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .bonus-name {
          font-family: 'Lilita One', cursive;
          font-size: 16px;
          color: #5D4E0D;
        }

        .bonus-effect {
          font-size: 12px;
          color: #7D6608;
          font-weight: 600;
        }

        .no-bonus {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
        }

        .btn-claim {
          padding: 16px 48px;
          background: linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%);
          border: 4px solid #145A32;
          border-radius: 14px;
          font-family: 'Lilita One', cursive;
          font-size: 22px;
          color: white;
          text-shadow: 2px 2px 0 #145A32;
          cursor: pointer;
          box-shadow: 0 6px 0 #0B3D20;
        }

        .btn-claim:active {
          transform: translateY(6px);
          box-shadow: none;
        }
      `}</style>
        </motion.div>
    );
};

export default KrakenChallenge;
