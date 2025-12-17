import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LootDrop, RARITY_GLOW_COLORS, RARITY_PARTICLE_COUNT, COSMETIC_ITEMS } from '../lootSystem';
import { Rarity } from '../types';
import confetti from 'canvas-confetti';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface LootDropAnimationProps {
    drops: LootDrop[];
    isOpen: boolean;
    onComplete: () => void;
    chestType?: 'streak' | 'premium' | 'prestige' | 'catch';
}

const LootDropAnimation: React.FC<LootDropAnimationProps> = ({
    drops,
    isOpen,
    onComplete,
    chestType = 'catch'
}) => {
    const [currentDropIndex, setCurrentDropIndex] = useState(0);
    const [showDrop, setShowDrop] = useState(false);
    const [showChest, setShowChest] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            setCurrentDropIndex(0);
            setShowDrop(false);
            setShowChest(true);
            return;
        }

        // Chest opening animation
        const chestTimer = setTimeout(() => {
            setShowChest(false);
            setShowDrop(true);
            triggerHaptic(Haptics.medium);
        }, 1500);

        return () => clearTimeout(chestTimer);
    }, [isOpen]);

    useEffect(() => {
        if (!showDrop || currentDropIndex >= drops.length) return;

        const drop = drops[currentDropIndex];
        const rarity = drop.rarity || Rarity.COMMON;

        // Trigger effects based on rarity
        if (rarity === Rarity.LEGENDARY || rarity === Rarity.MYTHIC) {
            confetti({
                particleCount: RARITY_PARTICLE_COUNT[rarity],
                spread: 70,
                origin: { y: 0.5 },
                colors: [RARITY_GLOW_COLORS[rarity], '#FFD700', '#FFFFFF'],
            });
            triggerHaptic(Haptics.legendaryCatch);
        } else if (rarity === Rarity.EPIC || rarity === Rarity.RARE) {
            triggerHaptic(Haptics.success);
        }

        // Auto-advance to next drop
        const timer = setTimeout(() => {
            if (currentDropIndex < drops.length - 1) {
                setCurrentDropIndex((prev) => prev + 1);
            } else {
                setTimeout(onComplete, 1000);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [showDrop, currentDropIndex, drops, onComplete]);

    const getDropIcon = (drop: LootDrop): string => {
        switch (drop.type) {
            case 'coins':
                return '🪙';
            case 'xp':
                return '⭐';
            case 'bait':
                return getBaitIcon(drop.id || '');
            case 'cosmetic':
                return getCosmeticIcon(drop.id || '');
            case 'ticket':
                return '🎫';
            default:
                return '❓';
        }
    };

    const getBaitIcon = (baitId: string): string => {
        const baitIcons: Record<string, string> = {
            worm: '🪱',
            shrimp: '🦐',
            squid: '🦑',
            chum: '🥩',
            kraken_eye: '👁️',
        };
        return baitIcons[baitId] || '🎣';
    };

    const getCosmeticIcon = (cosmeticId: string): string => {
        const cosmetic = COSMETIC_ITEMS.find((c) => c.id === cosmeticId);
        if (!cosmetic) return '✨';

        switch (cosmetic.type) {
            case 'title':
                return '👑';
            case 'badge':
                return '🏅';
            case 'rod_skin':
                return '🎣';
            case 'bobber':
                return '🔴';
            case 'trail_effect':
                return '💫';
            default:
                return '✨';
        }
    };

    const getDropLabel = (drop: LootDrop): string => {
        switch (drop.type) {
            case 'coins':
                return `${drop.quantity} Coins`;
            case 'xp':
                return `${drop.quantity} XP`;
            case 'bait':
                return `${drop.quantity}x ${drop.id?.replace('_', ' ')}`;
            case 'cosmetic':
                const cosmetic = COSMETIC_ITEMS.find((c) => c.id === drop.id);
                return cosmetic?.name || 'Mystery Item';
            case 'ticket':
                return `${drop.id?.replace('_', ' ')} Ticket`;
            default:
                return 'Nothing';
        }
    };

    const currentDrop = drops[currentDropIndex];
    const rarity = currentDrop?.rarity || Rarity.COMMON;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="loot-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onComplete}
                >
                    {/* Chest Opening Animation */}
                    {showChest && (
                        <motion.div
                            className="chest-container"
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{
                                scale: [0.5, 1.2, 1],
                                y: [50, -20, 0],
                                rotate: [0, -5, 5, -3, 3, 0],
                            }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                        >
                            <img
                                src="/assets/ui/treasure_chest.png"
                                alt="Chest"
                                className="chest-image"
                            />
                            <motion.div
                                className="chest-glow"
                                animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            />
                            <span className="opening-text">Opening...</span>
                        </motion.div>
                    )}

                    {/* Drop Reveal Animation */}
                    {showDrop && currentDrop && (
                        <motion.div
                            key={currentDropIndex}
                            className="drop-reveal"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, y: -100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                        >
                            {/* Rarity Glow Background */}
                            <motion.div
                                className="rarity-glow"
                                style={{ backgroundColor: RARITY_GLOW_COLORS[rarity] }}
                                animate={{
                                    opacity: [0.3, 0.8, 0.3],
                                    scale: [1, 1.3, 1],
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />

                            {/* Particle Effects */}
                            <div className="particles">
                                {Array.from({ length: RARITY_PARTICLE_COUNT[rarity] }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="particle"
                                        style={{
                                            backgroundColor: RARITY_GLOW_COLORS[rarity],
                                        }}
                                        initial={{
                                            x: 0,
                                            y: 0,
                                            scale: 0,
                                            opacity: 1,
                                        }}
                                        animate={{
                                            x: (Math.random() - 0.5) * 200,
                                            y: (Math.random() - 0.5) * 200,
                                            scale: [0, 1, 0],
                                            opacity: [1, 1, 0],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            delay: Math.random() * 0.5,
                                            ease: 'easeOut',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Drop Icon */}
                            <motion.div
                                className="drop-icon"
                                animate={{
                                    y: [0, -10, 0],
                                }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <span className="icon-emoji">{getDropIcon(currentDrop)}</span>
                            </motion.div>

                            {/* Drop Info */}
                            <motion.div
                                className="drop-info"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <span
                                    className="drop-label"
                                    style={{ color: RARITY_GLOW_COLORS[rarity] }}
                                >
                                    {getDropLabel(currentDrop)}
                                </span>
                                <span className="rarity-label">{rarity}</span>
                            </motion.div>

                            {/* Progress dots */}
                            <div className="progress-dots">
                                {drops.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`dot ${i === currentDropIndex ? 'active' : ''} ${i < currentDropIndex ? 'completed' : ''}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <style>{`
            .loot-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.85);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100;
              backdrop-filter: blur(8px);
            }

            .chest-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
            }

            .chest-image {
              width: 200px;
              height: 200px;
              object-fit: contain;
              filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
            }

            .chest-glow {
              position: absolute;
              inset: -20px;
              background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
              border-radius: 50%;
            }

            .opening-text {
              color: #F4D03F;
              font-size: 24px;
              font-weight: 800;
              text-transform: uppercase;
              margin-top: 20px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }

            .drop-reveal {
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
              padding: 40px;
            }

            .rarity-glow {
              position: absolute;
              width: 250px;
              height: 250px;
              border-radius: 50%;
              filter: blur(60px);
              z-index: -1;
            }

            .particles {
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
            }

            .particle {
              position: absolute;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              left: 50%;
              top: 50%;
            }

            .drop-icon {
              width: 120px;
              height: 120px;
              background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-radius: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            }

            .icon-emoji {
              font-size: 64px;
            }

            .drop-info {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 24px;
              gap: 8px;
            }

            .drop-label {
              font-size: 28px;
              font-weight: 800;
              text-transform: uppercase;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }

            .rarity-label {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.6);
              text-transform: uppercase;
              letter-spacing: 2px;
            }

            .progress-dots {
              display: flex;
              gap: 8px;
              margin-top: 32px;
            }

            .dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.3);
              transition: all 0.3s ease;
            }

            .dot.active {
              background: #F4D03F;
              transform: scale(1.3);
            }

            .dot.completed {
              background: #27AE60;
            }
          `}</style>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};

export default LootDropAnimation;
