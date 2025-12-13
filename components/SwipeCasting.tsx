import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { BAITS } from '../constants';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface SwipeCastingProps {
    onCast: () => void;
    disabled?: boolean;
}

interface SwipeState {
    startY: number;
    currentY: number;
    isDragging: boolean;
    power: number;
}

const SwipeCasting: React.FC<SwipeCastingProps> = ({ onCast, disabled }) => {
    const { userStats, inventory, phase } = useGameStore();
    const [swipe, setSwipe] = useState<SwipeState>({
        startY: 0,
        currentY: 0,
        isDragging: false,
        power: 0,
    });
    const [showArc, setShowArc] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeBait = BAITS[inventory.activeBaitId];
    const canCast = (userStats.castsRemaining > 0 || userStats.premium) && phase === GamePhase.IDLE;

    // Calculate power from swipe distance
    const calculatePower = useCallback((startY: number, currentY: number) => {
        const delta = startY - currentY;
        const maxSwipe = 200; // pixels for full power
        return Math.max(0, Math.min(100, (delta / maxSwipe) * 100));
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!canCast || disabled) return;
        const touch = e.touches[0];
        setSwipe({
            startY: touch.clientY,
            currentY: touch.clientY,
            isDragging: true,
            power: 0,
        });
        triggerHaptic(Haptics.soft);
    }, [canCast, disabled]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!swipe.isDragging) return;
        const touch = e.touches[0];
        const power = calculatePower(swipe.startY, touch.clientY);

        setSwipe(prev => ({
            ...prev,
            currentY: touch.clientY,
            power,
        }));

        // Haptic feedback at power thresholds
        if (power >= 25 && swipe.power < 25) triggerHaptic(Haptics.soft);
        if (power >= 50 && swipe.power < 50) triggerHaptic(Haptics.medium);
        if (power >= 75 && swipe.power < 75) triggerHaptic(Haptics.heavy);
    }, [swipe, calculatePower]);

    const handleTouchEnd = useCallback(() => {
        if (!swipe.isDragging) return;

        if (swipe.power >= 30) {
            // Successful cast
            setShowArc(true);
            triggerHaptic(Haptics.success);

            setTimeout(() => {
                onCast();
                setShowArc(false);
            }, 800);
        } else {
            // Not enough power
            triggerHaptic(Haptics.error);
        }

        setSwipe({
            startY: 0,
            currentY: 0,
            isDragging: false,
            power: 0,
        });
    }, [swipe, onCast]);

    // Power bar color
    const getPowerColor = () => {
        if (swipe.power < 30) return '#E74C3C';
        if (swipe.power < 60) return '#F39C12';
        if (swipe.power < 85) return '#27AE60';
        return '#9B59B6';
    };

    // Arc trajectory points
    const generateArcPath = (power: number) => {
        const maxDistance = 120;
        const distance = (power / 100) * maxDistance;
        const height = (power / 100) * 80;

        return `M 50 90 Q 50 ${90 - height} ${50 + distance * 0.5} ${90 - height * 0.3}`;
    };

    return (
        <div
            ref={containerRef}
            style={styles.container}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Cast instruction */}
            <AnimatePresence>
                {phase === GamePhase.IDLE && !swipe.isDragging && !showArc && (
                    <motion.div
                        style={styles.instruction}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <span style={styles.swipeArrow}>☝️</span>
                        </motion.div>
                        <span style={styles.swipeText}>SWIPE UP TO CAST</span>
                        <span style={styles.baitInfo}>
                            {activeBait?.icon} {activeBait?.name}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Power meter during swipe */}
            <AnimatePresence>
                {swipe.isDragging && (
                    <motion.div
                        style={styles.powerMeter}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={styles.powerTrack}>
                            <motion.div
                                style={{
                                    ...styles.powerFill,
                                    height: `${swipe.power}%`,
                                    background: getPowerColor(),
                                }}
                                animate={{ height: `${swipe.power}%` }}
                                transition={{ duration: 0.05 }}
                            />

                            {/* Zone markers */}
                            <div style={{ ...styles.powerZone, bottom: '30%' }}>
                                <span style={styles.zoneLabel}>MIN</span>
                            </div>
                            <div style={{ ...styles.powerZone, bottom: '60%' }}>
                                <span style={styles.zoneLabel}>GOOD</span>
                            </div>
                            <div style={{ ...styles.powerZone, bottom: '85%' }}>
                                <span style={styles.zoneLabel}>MAX</span>
                            </div>
                        </div>

                        <span style={styles.powerValue}>{Math.round(swipe.power)}%</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Arc trajectory preview */}
            <AnimatePresence>
                {(swipe.isDragging || showArc) && (
                    <motion.svg
                        style={styles.arcSvg}
                        viewBox="0 0 100 100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.path
                            d={generateArcPath(showArc ? 100 : swipe.power)}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.6)"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: showArc ? 0.5 : 0.1 }}
                        />

                        {/* Bobber at end */}
                        <motion.circle
                            cx={50 + (showArc ? 60 : (swipe.power / 100) * 60)}
                            cy={90 - (showArc ? 20 : (swipe.power / 100) * 25)}
                            r="4"
                            fill="#E74C3C"
                            stroke="white"
                            strokeWidth="1"
                            animate={showArc ? {
                                y: [0, 30],
                                opacity: [1, 0],
                            } : {}}
                            transition={{ duration: 0.8 }}
                        />
                    </motion.svg>
                )}
            </AnimatePresence>

            {/* Splash effect */}
            <AnimatePresence>
                {showArc && (
                    <motion.div
                        style={styles.splash}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        💦
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Energy depleted overlay */}
            {!canCast && phase === GamePhase.IDLE && (
                <div style={styles.disabledOverlay}>
                    <span style={styles.disabledText}>⚡ Out of Energy</span>
                    <span style={styles.disabledSub}>Wait or buy more in Shop</span>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        zIndex: 20,
    },
    instruction: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 20,
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    swipeArrow: {
        fontSize: 40,
    },
    swipeText: {
        fontSize: 16,
        fontWeight: 800,
        color: 'white',
        letterSpacing: 2,
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    baitInfo: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: 600,
    },
    powerMeter: {
        position: 'absolute',
        left: 20,
        top: '20%',
        bottom: '20%',
        width: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
    },
    powerTrack: {
        flex: 1,
        width: 30,
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        border: '2px solid rgba(255, 255, 255, 0.2)',
    },
    powerFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 13,
        transition: 'background 0.2s',
    },
    powerZone: {
        position: 'absolute',
        left: '100%',
        marginLeft: 4,
        width: 40,
    },
    zoneLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
    },
    powerValue: {
        fontSize: 18,
        fontWeight: 900,
        color: 'white',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    arcSvg: {
        position: 'absolute',
        bottom: '45%',
        left: '10%',
        width: '80%',
        height: 100,
        pointerEvents: 'none',
    },
    splash: {
        position: 'absolute',
        top: '30%',
        right: '15%',
        fontSize: 48,
    },
    disabledOverlay: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 16,
    },
    disabledText: {
        fontSize: 18,
        fontWeight: 800,
        color: '#E74C3C',
    },
    disabledSub: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
    },
};

export default SwipeCasting;
