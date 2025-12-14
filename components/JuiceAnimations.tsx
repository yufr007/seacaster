import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// COIN SHOWER - Rains coins on rewards
// ============================================
interface CoinShowerProps {
    isActive: boolean;
    coinCount?: number;
    duration?: number;
}

export const CoinShower: React.FC<CoinShowerProps> = ({
    isActive,
    coinCount = 20,
    duration = 2000,
}) => {
    const [coins, setCoins] = useState<number[]>([]);

    useEffect(() => {
        if (isActive) {
            setCoins(Array.from({ length: coinCount }, (_, i) => i));
            const timer = setTimeout(() => setCoins([]), duration);
            return () => clearTimeout(timer);
        }
    }, [isActive, coinCount, duration]);

    return (
        <div style={styles.showerContainer}>
            <AnimatePresence>
                {coins.map((id) => (
                    <motion.div
                        key={id}
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: -50,
                            rotate: 0,
                            scale: 0.5 + Math.random() * 0.5,
                        }}
                        animate={{
                            y: window.innerHeight + 50,
                            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 1.5 + Math.random() * 1,
                            ease: 'easeIn',
                            delay: Math.random() * 0.3,
                        }}
                        style={styles.coin}
                    >
                        💰
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// CONFETTI BURST - Celebration effect
// ============================================
interface ConfettiBurstProps {
    isActive: boolean;
    particleCount?: number;
    colors?: string[];
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
    isActive,
    particleCount = 50,
    colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'],
}) => {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        if (isActive) {
            const newParticles = Array.from({ length: particleCount }, (_, i) => ({
                id: i,
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                color: colors[i % colors.length],
                angle: (360 / particleCount) * i,
                speed: 5 + Math.random() * 10,
                size: 8 + Math.random() * 8,
                shape: Math.random() > 0.5 ? 'square' : 'circle',
            }));
            setParticles(newParticles);
            setTimeout(() => setParticles([]), 2000);
        }
    }, [isActive, particleCount, colors]);

    return (
        <div style={styles.showerContainer}>
            <AnimatePresence>
                {particles.map((p) => {
                    const radians = (p.angle * Math.PI) / 180;
                    const endX = p.x + Math.cos(radians) * p.speed * 30;
                    const endY = p.y + Math.sin(radians) * p.speed * 30 + 200;

                    return (
                        <motion.div
                            key={p.id}
                            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                            animate={{ x: endX, y: endY, opacity: 0, scale: 0.5 }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            style={{
                                ...styles.confetti,
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                borderRadius: p.shape === 'circle' ? '50%' : 2,
                            }}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// SPARKLE TRAIL - Follow cursor/touch
// ============================================
interface SparkleTrailProps {
    isActive: boolean;
}

export const SparkleTrail: React.FC<SparkleTrailProps> = ({ isActive }) => {
    const [sparkles, setSparkles] = useState<any[]>([]);

    useEffect(() => {
        if (!isActive) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;

            if (!clientX || !clientY) return;

            const newSparkle = {
                id: Date.now() + Math.random(),
                x: clientX,
                y: clientY,
                size: 10 + Math.random() * 10,
            };

            setSparkles(prev => [...prev.slice(-15), newSparkle]);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, [isActive]);

    return (
        <div style={styles.showerContainer}>
            <AnimatePresence>
                {sparkles.map((s) => (
                    <motion.div
                        key={s.id}
                        initial={{ x: s.x, y: s.y, opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 0, y: s.y - 20 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            ...styles.sparkle,
                            left: s.x - s.size / 2,
                            top: s.y - s.size / 2,
                            fontSize: s.size,
                        }}
                    >
                        ✨
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// FISH WIGGLE - Animated fish on catch
// ============================================
interface FishWiggleProps {
    emoji: string;
    size?: number;
    duration?: number;
}

export const FishWiggle: React.FC<FishWiggleProps> = ({
    emoji,
    size = 80,
    duration = 2,
}) => {
    return (
        <motion.div
            animate={{
                rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1, 1.05, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                repeatDelay: 1,
            }}
            style={{ fontSize: size, display: 'inline-block' }}
        >
            {emoji}
        </motion.div>
    );
};

// ============================================
// XP BAR FILL - Smooth animated fill
// ============================================
interface XPBarFillProps {
    progress: number; // 0-100
    showPulse?: boolean;
    height?: number;
}

export const XPBarFill: React.FC<XPBarFillProps> = ({
    progress,
    showPulse = false,
    height = 8,
}) => {
    return (
        <div style={{ ...styles.xpBarContainer, height }}>
            <motion.div
                style={styles.xpBarFill}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {showPulse && (
                <motion.div
                    style={styles.xpPulse}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}
        </div>
    );
};

// ============================================
// PULSING GLOW - For rare catches
// ============================================
interface PulsingGlowProps {
    color: string;
    intensity?: number;
    children: React.ReactNode;
}

export const PulsingGlow: React.FC<PulsingGlowProps> = ({
    color,
    intensity = 20,
    children,
}) => {
    return (
        <motion.div
            animate={{
                boxShadow: [
                    `0 0 ${intensity}px ${color}`,
                    `0 0 ${intensity * 2}px ${color}`,
                    `0 0 ${intensity}px ${color}`,
                ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ borderRadius: 16 }}
        >
            {children}
        </motion.div>
    );
};

// ============================================
// SQUASH STRETCH - Bouncy catch card entrance
// ============================================
interface SquashStretchProps {
    children: React.ReactNode;
    trigger: boolean;
}

export const SquashStretch: React.FC<SquashStretchProps> = ({ children, trigger }) => {
    return (
        <motion.div
            key={trigger ? 'triggered' : 'idle'}
            initial={{ scaleX: 0.5, scaleY: 1.5, opacity: 0 }}
            animate={{
                scaleX: [0.5, 1.2, 0.9, 1.05, 1],
                scaleY: [1.5, 0.8, 1.1, 0.95, 1],
                opacity: 1,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
};

// ============================================
// NUMBER COUNTER - Animated counting
// ============================================
interface NumberCounterProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
    value,
    duration = 1,
    prefix = '',
    suffix = '',
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        const startValue = displayValue;
        const diff = value - startValue;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            setDisplayValue(Math.round(startValue + diff * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span>
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
        </span>
    );
};

const styles: Record<string, React.CSSProperties> = {
    showerContainer: {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
    },
    coin: {
        position: 'absolute',
        fontSize: 32,
        pointerEvents: 'none',
    },
    confetti: {
        position: 'absolute',
        pointerEvents: 'none',
    },
    sparkle: {
        position: 'absolute',
        pointerEvents: 'none',
    },
    xpBarContainer: {
        width: '100%',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    xpBarFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #27AE60, #58D68D)',
        borderRadius: 4,
    },
    xpPulse: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        borderRadius: 4,
    },
};

export default {
    CoinShower,
    ConfettiBurst,
    SparkleTrail,
    FishWiggle,
    XPBarFill,
    PulsingGlow,
    SquashStretch,
    NumberCounter,
};
