import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// SWIPE TRAIL - Sparkle trail on casting swipe
// ============================================

interface SwipeTrailProps {
    isActive: boolean;
    color?: string;
}

interface TrailPoint {
    id: number;
    x: number;
    y: number;
    size: number;
}

export const SwipeTrail: React.FC<SwipeTrailProps> = ({
    isActive,
    color = '#5DADE2',
}) => {
    const [points, setPoints] = useState<TrailPoint[]>([]);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const idCounter = useRef(0);

    useEffect(() => {
        if (!isActive) {
            setPoints([]);
            lastPointRef.current = null;
            return;
        }

        const handleMove = (e: TouchEvent | MouseEvent) => {
            const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;

            if (!clientX || !clientY) return;

            // Only add point if moved enough distance
            if (lastPointRef.current) {
                const dx = clientX - lastPointRef.current.x;
                const dy = clientY - lastPointRef.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 8) return;
            }

            const newPoint: TrailPoint = {
                id: idCounter.current++,
                x: clientX,
                y: clientY,
                size: 8 + Math.random() * 8,
            };

            lastPointRef.current = { x: clientX, y: clientY };

            setPoints(prev => [...prev.slice(-20), newPoint]);
        };

        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mousemove', handleMove);

        return () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mousemove', handleMove);
        };
    }, [isActive]);

    // Clean up old points
    useEffect(() => {
        if (points.length === 0) return;

        const cleanup = setTimeout(() => {
            setPoints(prev => prev.slice(1));
        }, 100);

        return () => clearTimeout(cleanup);
    }, [points]);

    return (
        <div style={styles.trailContainer}>
            <AnimatePresence>
                {points.map((point) => (
                    <motion.div
                        key={point.id}
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 0, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            ...styles.trailPoint,
                            left: point.x - point.size / 2,
                            top: point.y - point.size / 2,
                            width: point.size,
                            height: point.size,
                            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                            boxShadow: `0 0 ${point.size}px ${color}`,
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// CAST POWER METER - Swipe strength indicator
// ============================================

interface CastPowerMeterProps {
    power: number; // 0-100
    isVisible: boolean;
}

export const CastPowerMeter: React.FC<CastPowerMeterProps> = ({
    power,
    isVisible,
}) => {
    const clampedPower = Math.min(100, Math.max(0, power));

    const getPowerColor = () => {
        if (clampedPower < 30) return '#3498DB'; // Blue - weak
        if (clampedPower < 60) return '#27AE60'; // Green - good
        if (clampedPower < 85) return '#F39C12'; // Orange - strong
        return '#E74C3C'; // Red - max power!
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    style={styles.powerMeterContainer}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                >
                    <div style={styles.powerMeterTrack}>
                        <motion.div
                            style={{
                                ...styles.powerMeterFill,
                                backgroundColor: getPowerColor(),
                                boxShadow: `0 0 15px ${getPowerColor()}`,
                            }}
                            animate={{ height: `${clampedPower}%` }}
                            transition={{ duration: 0.05 }}
                        />
                    </div>

                    {/* Power zones */}
                    <div style={styles.powerZones}>
                        <div style={{ ...styles.powerZone, bottom: '85%', color: '#E74C3C' }}>MAX</div>
                        <div style={{ ...styles.powerZone, bottom: '60%', color: '#F39C12' }}>STRONG</div>
                        <div style={{ ...styles.powerZone, bottom: '30%', color: '#27AE60' }}>GOOD</div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ============================================
// WATER SPLASH EFFECT - On line entry
// ============================================

interface WaterSplashProps {
    position: { x: number; y: number };
    isActive: boolean;
}

export const WaterSplash: React.FC<WaterSplashProps> = ({
    position,
    isActive,
}) => {
    const [ripples, setRipples] = useState<number[]>([]);
    const [droplets, setDroplets] = useState<any[]>([]);

    useEffect(() => {
        if (isActive) {
            // Create ripples
            setRipples([1, 2, 3]);

            // Create droplets
            const newDroplets = [...Array(8)].map((_, i) => ({
                id: i,
                angle: (360 / 8) * i + Math.random() * 30,
                distance: 30 + Math.random() * 30,
                size: 4 + Math.random() * 6,
            }));
            setDroplets(newDroplets);

            setTimeout(() => {
                setRipples([]);
                setDroplets([]);
            }, 1000);
        }
    }, [isActive]);

    return (
        <div style={{ ...styles.splashContainer, left: position.x, top: position.y }}>
            {/* Ripples */}
            <AnimatePresence>
                {ripples.map((id) => (
                    <motion.div
                        key={id}
                        style={styles.ripple}
                        initial={{ scale: 0.2, opacity: 0.8 }}
                        animate={{ scale: 2 + id, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, delay: id * 0.1 }}
                    />
                ))}
            </AnimatePresence>

            {/* Droplets */}
            <AnimatePresence>
                {droplets.map((d) => {
                    const radians = (d.angle * Math.PI) / 180;
                    const endX = Math.cos(radians) * d.distance;
                    const endY = Math.sin(radians) * d.distance - 20;

                    return (
                        <motion.div
                            key={d.id}
                            style={{
                                ...styles.droplet,
                                width: d.size,
                                height: d.size,
                            }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{ x: endX, y: endY, opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// FISH BITE INDICATOR - Tension building
// ============================================

interface FishBiteIndicatorProps {
    intensity: number; // 0-100
    isActive: boolean;
}

export const FishBiteIndicator: React.FC<FishBiteIndicatorProps> = ({
    intensity,
    isActive,
}) => {
    if (!isActive) return null;

    const size = 60 + (intensity / 100) * 40;
    const opacity = 0.3 + (intensity / 100) * 0.7;

    return (
        <motion.div
            style={{
                ...styles.biteIndicator,
                width: size,
                height: size,
                opacity,
            }}
            animate={{
                scale: [1, 1.2, 1],
                borderColor: intensity > 50
                    ? ['rgba(231, 76, 60, 0.5)', 'rgba(231, 76, 60, 1)', 'rgba(231, 76, 60, 0.5)']
                    : ['rgba(241, 196, 15, 0.5)', 'rgba(241, 196, 15, 1)', 'rgba(241, 196, 15, 0.5)'],
            }}
            transition={{
                duration: intensity > 70 ? 0.2 : 0.5,
                repeat: Infinity,
            }}
        >
            <span style={styles.biteText}>!</span>
        </motion.div>
    );
};

// ============================================
// STYLES
// ============================================

const styles: Record<string, React.CSSProperties> = {
    trailContainer: {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
    },
    trailPoint: {
        position: 'absolute',
        borderRadius: '50%',
        pointerEvents: 'none',
    },

    powerMeterContainer: {
        position: 'fixed',
        left: 20,
        top: '30%',
        height: '40%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 50,
    },
    powerMeterTrack: {
        width: 20,
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.2)',
        position: 'relative',
    },
    powerMeterFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 8,
        transition: 'background-color 0.1s',
    },
    powerZones: {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
    },
    powerZone: {
        position: 'absolute',
        left: 28,
        fontSize: 10,
        fontWeight: 800,
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    },

    splashContainer: {
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
    },
    ripple: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: '3px solid rgba(93, 173, 226, 0.6)',
        transform: 'translate(-50%, -50%)',
    },
    droplet: {
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(93, 173, 226, 0.8)',
        transform: 'translate(-50%, -50%)',
    },

    biteIndicator: {
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        border: '4px solid rgba(241, 196, 15, 0.8)',
        background: 'rgba(241, 196, 15, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    biteText: {
        fontSize: 32,
        fontWeight: 900,
        color: '#F1C40F',
        textShadow: '0 0 10px rgba(241, 196, 15, 0.8)',
    },
};

export default {
    SwipeTrail,
    CastPowerMeter,
    WaterSplash,
    FishBiteIndicator,
};
