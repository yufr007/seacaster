import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// ENHANCED XP COUNTER - Animated with Sparks
// ============================================

interface EnhancedXPCounterProps {
    current: number;
    max: number;
    level: number;
    showSparks?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const EnhancedXPCounter: React.FC<EnhancedXPCounterProps> = ({
    current,
    max,
    level,
    showSparks = false,
    size = 'md',
}) => {
    const [animatedValue, setAnimatedValue] = useState(current);
    const [sparks, setSparks] = useState<number[]>([]);
    const prevValue = useRef(current);

    // Animate value changes
    useEffect(() => {
        const diff = current - prevValue.current;
        if (diff > 0) {
            // Create sparks for XP gain
            setSparks([...Array(Math.min(diff / 5, 8))].map((_, i) => i));
            setTimeout(() => setSparks([]), 1000);
        }

        // Smooth count animation
        const duration = 600;
        const startTime = Date.now();
        const startValue = animatedValue;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedValue(Math.round(startValue + (current - startValue) * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
        prevValue.current = current;
    }, [current]);

    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const sizes = {
        sm: { height: 8, radius: 4, fontSize: 10, badge: 32 },
        md: { height: 12, radius: 6, fontSize: 12, badge: 48 },
        lg: { height: 16, radius: 8, fontSize: 14, badge: 64 },
    };
    const s = sizes[size];

    return (
        <div style={styles.xpContainer}>
            {/* Level Badge */}
            <motion.div
                style={{
                    ...styles.xpBadge,
                    width: s.badge,
                    height: s.badge,
                }}
                animate={showSparks ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
            >
                <span style={{ ...styles.xpBadgeText, fontSize: s.badge * 0.5 }}>
                    {level}
                </span>

                {/* Badge glow */}
                <motion.div
                    style={styles.badgeGlow}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>

            {/* XP Bar */}
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                    ...styles.xpTrack,
                    height: s.height,
                    borderRadius: s.radius,
                }}>
                    <motion.div
                        style={{
                            ...styles.xpFill,
                            borderRadius: s.radius,
                        }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />

                    {/* Shimmer effect */}
                    <motion.div
                        style={styles.xpShimmer}
                        animate={{ left: ['-50%', '150%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                </div>

                {/* XP Text */}
                <div style={{ ...styles.xpText, fontSize: s.fontSize }}>
                    <span style={styles.xpCurrent}>{animatedValue.toLocaleString()}</span>
                    <span style={styles.xpSeparator}>/</span>
                    <span style={styles.xpMax}>{max.toLocaleString()} XP</span>
                </div>
            </div>

            {/* Sparks */}
            <AnimatePresence>
                {sparks.map((id) => (
                    <motion.div
                        key={id}
                        style={{
                            ...styles.spark,
                            left: `${30 + Math.random() * 50}%`,
                        }}
                        initial={{ y: 0, opacity: 1, scale: 0 }}
                        animate={{
                            y: -40 - Math.random() * 30,
                            opacity: 0,
                            scale: 1,
                            x: (Math.random() - 0.5) * 40,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        ✨
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// RARITY FRAME - Glowing border for rare items
// ============================================

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface RarityFrameProps {
    rarity: Rarity;
    children: React.ReactNode;
    animate?: boolean;
}

const RARITY_COLORS: Record<Rarity, { primary: string; glow: string }> = {
    common: { primary: '#9CA3AF', glow: 'rgba(156, 163, 175, 0.3)' },
    uncommon: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
    rare: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)' },
    epic: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
    legendary: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.7)' },
    mythic: { primary: '#EC4899', glow: 'rgba(236, 72, 153, 0.8)' },
};

export const RarityFrame: React.FC<RarityFrameProps> = ({
    rarity,
    children,
    animate = true,
}) => {
    const colors = RARITY_COLORS[rarity];
    const isHighRarity = ['epic', 'legendary', 'mythic'].includes(rarity);

    return (
        <motion.div
            style={{
                position: 'relative',
                borderRadius: 16,
                padding: 4,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                boxShadow: isHighRarity ? `0 0 20px ${colors.glow}` : 'none',
            }}
            animate={animate && isHighRarity ? {
                boxShadow: [
                    `0 0 15px ${colors.glow}`,
                    `0 0 30px ${colors.glow}`,
                    `0 0 15px ${colors.glow}`,
                ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
        >
            <div style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a15 100%)',
                borderRadius: 12,
                overflow: 'hidden',
            }}>
                {children}
            </div>
        </motion.div>
    );
};

// ============================================
// REWARD POPUP - Shows gained items
// ============================================

interface RewardPopupProps {
    isVisible: boolean;
    rewards: Array<{
        icon: string;
        value: number;
        label: string;
        color: string;
    }>;
    onComplete?: () => void;
}

export const RewardPopup: React.FC<RewardPopupProps> = ({
    isVisible,
    rewards,
    onComplete,
}) => {
    useEffect(() => {
        if (isVisible && onComplete) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    style={styles.rewardOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        style={styles.rewardCard}
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                    >
                        <h3 style={styles.rewardTitle}>REWARDS!</h3>

                        <div style={styles.rewardItems}>
                            {rewards.map((reward, i) => (
                                <motion.div
                                    key={i}
                                    style={styles.rewardItem}
                                    initial={{ scale: 0, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
                                >
                                    <span style={styles.rewardIcon}>{reward.icon}</span>
                                    <span style={{ ...styles.rewardValue, color: reward.color }}>
                                        +{reward.value}
                                    </span>
                                    <span style={styles.rewardLabel}>{reward.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ============================================
// FLOATING PARTICLES - Background atmosphere
// ============================================

interface FloatingParticlesProps {
    count?: number;
    color?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
    count = 20,
    color = 'rgba(255, 255, 255, 0.3)',
}) => {
    const particles = [...Array(count)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 10 + Math.random() * 20,
        delay: Math.random() * 5,
    }));

    return (
        <div style={styles.particlesContainer}>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        borderRadius: '50%',
                        background: color,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: 'linear',
                    }}
                />
            ))}
        </div>
    );
};

// ============================================
// STYLES
// ============================================

const styles: Record<string, React.CSSProperties> = {
    // XP Counter
    xpContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
    },
    xpBadge: {
        position: 'relative',
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 50%, #1A5276 100%)',
        border: '4px solid #F4D03F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
      0 4px 0 #C19A00,
      0 8px 16px rgba(0,0,0,0.4),
      inset 0 2px 4px rgba(255,255,255,0.3)
    `,
    },
    xpBadgeText: {
        fontFamily: "'Lilita One', cursive",
        fontWeight: 900,
        color: 'white',
        textShadow: '0 2px 0 rgba(0,0,0,0.3)',
    },
    badgeGlow: {
        position: 'absolute',
        inset: -6,
        borderRadius: '50%',
        border: '2px solid rgba(244, 208, 63, 0.5)',
        pointerEvents: 'none',
    },
    xpTrack: {
        position: 'relative',
        background: 'rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    xpFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        background: 'linear-gradient(90deg, #27AE60 0%, #58D68D 50%, #82E0AA 100%)',
        boxShadow: '0 0 10px rgba(88, 214, 141, 0.5)',
    },
    xpShimmer: {
        position: 'absolute',
        top: 0,
        width: '50%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        pointerEvents: 'none',
    },
    xpText: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 4,
    },
    xpCurrent: {
        fontWeight: 800,
        color: '#58D68D',
    },
    xpSeparator: {
        color: 'rgba(255,255,255,0.4)',
    },
    xpMax: {
        color: 'rgba(255,255,255,0.6)',
    },
    spark: {
        position: 'absolute',
        top: 0,
        fontSize: 16,
        pointerEvents: 'none',
    },

    // Reward Popup
    rewardOverlay: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 100,
    },
    rewardCard: {
        background: 'linear-gradient(180deg, #4A6741 0%, #3D5335 100%)',
        border: '6px solid #5D4E37',
        borderRadius: 24,
        padding: 32,
        textAlign: 'center',
        boxShadow: '0 15px 0 #3D3426, 0 20px 50px rgba(0,0,0,0.6)',
        maxWidth: 320,
    },
    rewardTitle: {
        fontFamily: "'Lilita One', cursive",
        fontSize: 28,
        color: '#F4D03F',
        textShadow: '3px 3px 0 #B7950B',
        marginBottom: 24,
    },
    rewardItems: {
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    rewardItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        border: '2px solid rgba(255,255,255,0.1)',
    },
    rewardIcon: {
        fontSize: 32,
    },
    rewardValue: {
        fontFamily: "'Lilita One', cursive",
        fontSize: 24,
        fontWeight: 900,
    },
    rewardLabel: {
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'rgba(255,255,255,0.6)',
    },

    // Particles
    particlesContainer: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
};

export default {
    EnhancedXPCounter,
    RarityFrame,
    RewardPopup,
    FloatingParticles,
};
