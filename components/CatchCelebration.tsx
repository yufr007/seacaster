// components/CatchCelebration.tsx
// AAA-quality catch celebration with fish reveal, XP popup, coins
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fish, Rarity } from '../types';
import { triggerHaptic, Haptics } from '../utils/haptics';
import { useSound } from '../hooks/useSound';
import { SparkleBurst, ConfettiExplosion } from './ParticleEffects';

interface CatchCelebrationProps {
    fish: Fish;
    xpGained: number;
    coinsGained: number;
    isOpen: boolean;
    onComplete: () => void;
}

const RARITY_COLORS: Record<Rarity, string> = {
    [Rarity.COMMON]: '#9CA3AF',
    [Rarity.UNCOMMON]: '#10B981',
    [Rarity.RARE]: '#3B82F6',
    [Rarity.EPIC]: '#8B5CF6',
    [Rarity.LEGENDARY]: '#F59E0B',
    [Rarity.MYTHIC]: '#EC4899',
};

const RARITY_GLOW: Record<Rarity, string> = {
    [Rarity.COMMON]: '0 0 20px rgba(156, 163, 175, 0.3)',
    [Rarity.UNCOMMON]: '0 0 30px rgba(16, 185, 129, 0.4)',
    [Rarity.RARE]: '0 0 40px rgba(59, 130, 246, 0.5)',
    [Rarity.EPIC]: '0 0 50px rgba(139, 92, 246, 0.6)',
    [Rarity.LEGENDARY]: '0 0 60px rgba(245, 158, 11, 0.7)',
    [Rarity.MYTHIC]: '0 0 80px rgba(236, 72, 153, 0.8)',
};

const CatchCelebration: React.FC<CatchCelebrationProps> = ({
    fish,
    xpGained,
    coinsGained,
    isOpen,
    onComplete,
}) => {
    const [phase, setPhase] = useState<'reveal' | 'stats' | 'done'>('reveal');
    const [showSparkles, setShowSparkles] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const { play } = useSound();

    const isRare = [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHIC].includes(fish.rarity);

    useEffect(() => {
        if (!isOpen) {
            setPhase('reveal');
            return;
        }

        // Trigger haptic based on rarity
        if (fish.rarity === Rarity.LEGENDARY || fish.rarity === Rarity.MYTHIC) {
            triggerHaptic(Haptics.legendaryCatch);
        } else if (fish.rarity === Rarity.EPIC) {
            triggerHaptic(Haptics.heavy);
        } else {
            triggerHaptic(Haptics.success);
        }

        // Play sound
        play('success');

        // Show sparkles after initial reveal
        const sparkleTimer = setTimeout(() => {
            setShowSparkles(true);
            if (isRare) {
                setShowConfetti(true);
            }
        }, 300);

        // Transition to stats phase
        const statsTimer = setTimeout(() => {
            setPhase('stats');
        }, 800);

        // Auto-complete after delay
        const completeTimer = setTimeout(() => {
            setPhase('done');
            onComplete();
        }, 3500);

        return () => {
            clearTimeout(sparkleTimer);
            clearTimeout(statsTimer);
            clearTimeout(completeTimer);
        };
    }, [isOpen, fish.rarity, isRare, play, onComplete]);

    if (!isOpen) return null;

    return (
        <motion.div
            className="catch-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
        >
            {/* Backdrop */}
            <motion.div
                className="celebration-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            />

            {/* Rarity glow burst */}
            <motion.div
                className="rarity-burst"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 3, opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.8 }}
                style={{ background: `radial-gradient(circle, ${RARITY_COLORS[fish.rarity]}40, transparent 70%)` }}
            />

            {/* Fish Card Reveal */}
            <motion.div
                className="fish-card"
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{
                    type: 'spring',
                    damping: 15,
                    stiffness: 200,
                    delay: 0.1
                }}
                style={{
                    borderColor: RARITY_COLORS[fish.rarity],
                    boxShadow: RARITY_GLOW[fish.rarity],
                }}
            >
                {/* Rarity Badge */}
                <motion.div
                    className="rarity-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    style={{ backgroundColor: RARITY_COLORS[fish.rarity] }}
                >
                    {fish.rarity.toUpperCase()}
                </motion.div>

                {/* Fish Image */}
                <motion.img
                    src={fish.image}
                    alt={fish.name}
                    className="fish-image"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                />

                {/* Fish Name */}
                <motion.h2
                    className="fish-name"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {fish.name}
                </motion.h2>

                {/* Weight */}
                <motion.div
                    className="fish-weight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    ⚖️ {fish.weight.toFixed(1)} kg
                </motion.div>
            </motion.div>

            {/* Stats Popups */}
            <AnimatePresence>
                {phase === 'stats' && (
                    <>
                        {/* XP Popup */}
                        <motion.div
                            className="xp-popup"
                            initial={{ y: 50, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 12 }}
                        >
                            <span className="xp-icon">⭐</span>
                            <span className="xp-value">+{xpGained} XP</span>
                        </motion.div>

                        {/* Coins Popup */}
                        <motion.div
                            className="coins-popup"
                            initial={{ y: 50, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 12, delay: 0.15 }}
                        >
                            <span className="coin-icon">🪙</span>
                            <span className="coin-value">+{coinsGained}</span>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sparkle Effects */}
            {showSparkles && (
                <SparkleBurst x={50} y={40} color={RARITY_COLORS[fish.rarity]} />
            )}

            {/* Confetti for rare+ */}
            {showConfetti && (
                <ConfettiExplosion x={50} y={30} />
            )}

            {/* Tap to continue */}
            <motion.div
                className="tap-continue"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
            >
                Tap to continue
            </motion.div>

            <style>{`
                .catch-celebration {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    perspective: 1000px;
                }

                .celebration-bg {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%);
                    backdrop-filter: blur(8px);
                }

                .rarity-burst {
                    position: absolute;
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    pointer-events: none;
                }

                .fish-card {
                    position: relative;
                    background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%);
                    border-radius: 20px;
                    border: 4px solid;
                    padding: 24px;
                    text-align: center;
                    min-width: 200px;
                    max-width: 280px;
                    transform-style: preserve-3d;
                }

                .rarity-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 800;
                    color: white;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }

                .fish-image {
                    width: 140px;
                    height: 140px;
                    object-fit: contain;
                    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
                    margin: 16px 0;
                }

                .fish-name {
                    color: white;
                    font-size: 24px;
                    font-weight: 800;
                    margin: 8px 0 4px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }

                .fish-weight {
                    color: rgba(255,255,255,0.7);
                    font-size: 16px;
                    font-weight: 600;
                }

                .xp-popup, .coins-popup {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 30px;
                    font-weight: 800;
                    font-size: 20px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
                }

                .xp-popup {
                    bottom: 35%;
                    left: 20%;
                    background: linear-gradient(135deg, #27AE60 0%, #1E8449 100%);
                    color: white;
                }

                .coins-popup {
                    bottom: 25%;
                    right: 20%;
                    background: linear-gradient(135deg, #F1C40F 0%, #D4AC0D 100%);
                    color: #1a1a1a;
                }

                .xp-icon, .coin-icon {
                    font-size: 24px;
                }

                .tap-continue {
                    position: absolute;
                    bottom: 10%;
                    color: rgba(255,255,255,0.6);
                    font-size: 14px;
                    font-weight: 500;
                }
            `}</style>
        </motion.div>
    );
};

export default CatchCelebration;
