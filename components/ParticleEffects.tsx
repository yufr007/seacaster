import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// PARTICLE EFFECTS SYSTEM
// AAA-grade visual effects for SeaCaster
// ============================================

export type ParticleType = 'splash' | 'bubbles' | 'sparkle' | 'confetti' | 'ripple';

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    rotation: number;
    lifetime: number;
    maxLifetime: number;
}

// ============================================
// Water Splash Effect (on cast)
// ============================================
interface SplashProps {
    x: number;
    y: number;
    onComplete?: () => void;
}

export const WaterSplash: React.FC<SplashProps> = ({ x, y, onComplete }) => {
    const droplets = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * Math.PI * 2,
        distance: 30 + Math.random() * 40,
        size: 4 + Math.random() * 6,
        delay: Math.random() * 0.1,
    }));

    return (
        <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
            {/* Central splash ring */}
            <motion.div
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 80, height: 80, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onAnimationComplete={onComplete}
                style={{
                    position: 'absolute',
                    borderRadius: '50%',
                    border: '3px solid rgba(135, 206, 250, 0.8)',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Droplets */}
            {droplets.map((drop) => (
                <motion.div
                    key={drop.id}
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                    }}
                    animate={{
                        x: Math.cos(drop.angle) * drop.distance,
                        y: Math.sin(drop.angle) * drop.distance - 20,
                        opacity: 0,
                        scale: 0.5,
                    }}
                    transition={{
                        duration: 0.5,
                        delay: drop.delay,
                        ease: 'easeOut',
                    }}
                    style={{
                        position: 'absolute',
                        width: drop.size,
                        height: drop.size * 1.5,
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        background: 'linear-gradient(180deg, rgba(135, 206, 250, 0.9), rgba(70, 130, 180, 0.7))',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                />
            ))}
        </div>
    );
};

// ============================================
// Bubble Trail Effect (during wait)
// ============================================
interface BubbleTrailProps {
    active: boolean;
    x: number;
    y: number;
}

export const BubbleTrail: React.FC<BubbleTrailProps> = ({ active, x, y }) => {
    const [bubbles, setBubbles] = React.useState<Array<{ id: number; x: number; size: number; delay: number }>>([]);
    const idRef = useRef(0);

    useEffect(() => {
        if (!active) {
            setBubbles([]);
            return;
        }

        const interval = setInterval(() => {
            const newBubble = {
                id: idRef.current++,
                x: x + (Math.random() - 0.5) * 30,
                size: 4 + Math.random() * 8,
                delay: Math.random() * 0.2,
            };
            setBubbles(prev => [...prev.slice(-10), newBubble]);
        }, 300);

        return () => clearInterval(interval);
    }, [active, x]);

    return (
        <AnimatePresence>
            {bubbles.map((bubble) => (
                <motion.div
                    key={bubble.id}
                    initial={{ y: y, x: bubble.x, opacity: 0.8, scale: 1 }}
                    animate={{ y: y - 100, opacity: 0, scale: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, delay: bubble.delay, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        width: bubble.size,
                        height: bubble.size,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(135,206,250,0.4))',
                        border: '1px solid rgba(255,255,255,0.5)',
                        pointerEvents: 'none',
                    }}
                />
            ))}
        </AnimatePresence>
    );
};

// ============================================
// Sparkle Burst Effect (on catch)
// ============================================
interface SparkleBurstProps {
    x: number;
    y: number;
    color?: string;
    count?: number;
    onComplete?: () => void;
}

export const SparkleBurst: React.FC<SparkleBurstProps> = ({
    x, y,
    color = '#F4D03F',
    count = 16,
    onComplete
}) => {
    const sparkles = Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.3,
        distance: 40 + Math.random() * 60,
        size: 6 + Math.random() * 10,
        duration: 0.4 + Math.random() * 0.3,
        delay: Math.random() * 0.15,
    }));

    return (
        <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
            {sparkles.map((spark, i) => (
                <motion.div
                    key={spark.id}
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        rotate: 0,
                    }}
                    animate={{
                        x: Math.cos(spark.angle) * spark.distance,
                        y: Math.sin(spark.angle) * spark.distance,
                        opacity: 0,
                        scale: 0,
                        rotate: 180,
                    }}
                    transition={{
                        duration: spark.duration,
                        delay: spark.delay,
                        ease: 'easeOut',
                    }}
                    onAnimationComplete={i === 0 ? onComplete : undefined}
                    style={{
                        position: 'absolute',
                        width: spark.size,
                        height: spark.size,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {/* 4-point star shape */}
                    <svg viewBox="0 0 24 24" fill={color} style={{ width: '100%', height: '100%' }}>
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                    </svg>
                </motion.div>
            ))}

            {/* Central flash */}
            <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                    position: 'absolute',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}, transparent)`,
                    transform: 'translate(-50%, -50%)',
                }}
            />
        </div>
    );
};

// ============================================
// Rarity Glow Effect (around fish)
// ============================================
interface RarityGlowProps {
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
    children: React.ReactNode;
}

const RARITY_GLOW_COLORS: Record<string, { color: string; intensity: string }> = {
    Common: { color: '#9CA3AF', intensity: '0 0 15px' },
    Uncommon: { color: '#4ADE80', intensity: '0 0 20px' },
    Rare: { color: '#60A5FA', intensity: '0 0 25px' },
    Epic: { color: '#A78BFA', intensity: '0 0 30px' },
    Legendary: { color: '#FBBF24', intensity: '0 0 40px' },
    Mythic: { color: '#F472B6', intensity: '0 0 50px' },
};

export const RarityGlow: React.FC<RarityGlowProps> = ({ rarity, children }) => {
    const glow = RARITY_GLOW_COLORS[rarity] || RARITY_GLOW_COLORS.Common;
    const isHighRarity = ['Epic', 'Legendary', 'Mythic'].includes(rarity);

    return (
        <motion.div
            animate={isHighRarity ? {
                boxShadow: [
                    `${glow.intensity} ${glow.color}`,
                    `${glow.intensity} ${glow.color}88`,
                    `${glow.intensity} ${glow.color}`,
                ],
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
                boxShadow: `${glow.intensity} ${glow.color}`,
                borderRadius: 16,
            }}
        >
            {children}
        </motion.div>
    );
};

// ============================================
// Ripple Effect (on tap)
// ============================================
interface RippleProps {
    x: number;
    y: number;
    color?: string;
}

export const Ripple: React.FC<RippleProps> = ({ x, y, color = 'rgba(255,255,255,0.4)' }) => {
    return (
        <motion.div
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 120, height: 120, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                borderRadius: '50%',
                border: `2px solid ${color}`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
            }}
        />
    );
};

// ============================================
// Confetti Explosion (celebratory)
// ============================================
interface ConfettiProps {
    x: number;
    y: number;
    colors?: string[];
    count?: number;
}

export const ConfettiExplosion: React.FC<ConfettiProps> = ({
    x, y,
    colors = ['#F4D03F', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6'],
    count = 30
}) => {
    const pieces = Array.from({ length: count }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
        distance: 80 + Math.random() * 80,
        rotation: Math.random() * 720,
        size: 6 + Math.random() * 8,
        duration: 0.8 + Math.random() * 0.4,
        type: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    return (
        <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
            {pieces.map((piece) => (
                <motion.div
                    key={piece.id}
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                        rotate: 0,
                    }}
                    animate={{
                        x: Math.cos(piece.angle) * piece.distance,
                        y: Math.sin(piece.angle) * piece.distance + 60, // gravity
                        opacity: 0,
                        rotate: piece.rotation,
                    }}
                    transition={{
                        duration: piece.duration,
                        ease: [0.25, 0.46, 0.45, 0.94], // custom easing
                    }}
                    style={{
                        position: 'absolute',
                        width: piece.size,
                        height: piece.type === 'rect' ? piece.size * 0.4 : piece.size,
                        borderRadius: piece.type === 'circle' ? '50%' : 2,
                        background: piece.color,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
        </div>
    );
};

// ============================================
// Screen Shake Hook
// ============================================
export const useScreenShake = () => {
    const [shake, setShake] = React.useState(false);
    const [intensity, setIntensity] = React.useState(0);

    const triggerShake = React.useCallback((power: 'light' | 'medium' | 'heavy' = 'medium') => {
        const intensities = { light: 3, medium: 6, heavy: 12 };
        setIntensity(intensities[power]);
        setShake(true);
        setTimeout(() => setShake(false), 300);
    }, []);

    const shakeStyle: React.CSSProperties = shake ? {
        animation: `shake-${intensity} 0.3s ease-in-out`,
    } : {};

    return { triggerShake, shakeStyle, isShaking: shake };
};

// Inject shake keyframes
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
    @keyframes shake-3 {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-3px); }
      75% { transform: translateX(3px); }
    }
    @keyframes shake-6 {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px) rotate(-0.5deg); }
      40% { transform: translateX(5px) rotate(0.5deg); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    @keyframes shake-12 {
      0%, 100% { transform: translateX(0); }
      10% { transform: translateX(-12px) rotate(-1deg); }
      20% { transform: translateX(10px) rotate(1deg); }
      30% { transform: translateX(-8px) rotate(-0.5deg); }
      40% { transform: translateX(6px) rotate(0.5deg); }
      50% { transform: translateX(-4px); }
      60% { transform: translateX(3px); }
      70% { transform: translateX(-2px); }
      80% { transform: translateX(1px); }
    }
  `;
    document.head.appendChild(style);
}

export default {
    WaterSplash,
    BubbleTrail,
    SparkleBurst,
    RarityGlow,
    Ripple,
    ConfettiExplosion,
    useScreenShake,
};
