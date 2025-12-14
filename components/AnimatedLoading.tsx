import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedLoadingProps {
    variant?: 'fish' | 'kraken' | 'tournament' | 'default';
    showTips?: boolean;
}

const LOADING_TIPS = [
    "💡 Legendary fish are 10x more likely during Boss Raids!",
    "🎣 Upgrade your rod to catch heavier fish",
    "⚡ Season Pass gives 2× XP on every catch",
    "🏆 Top 3 tournament finishers split 95% of the prize pool",
    "🔥 7-day streaks unlock bonus casts",
    "🐠 The Mythic Golden Megalodon has a 0.1% spawn rate",
    "💰 Marketplace sales have a 10% fee",
    "🎯 Faster reactions = higher catch rate",
];

const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
    variant = 'default',
    showTips = true,
}) => {
    const [tipIndex, setTipIndex] = React.useState(0);

    React.useEffect(() => {
        if (!showTips) return;
        const interval = setInterval(() => {
            setTipIndex(i => (i + 1) % LOADING_TIPS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [showTips]);

    const getMascot = () => {
        switch (variant) {
            case 'kraken': return { emoji: '🦑', name: 'Kraken Awakening...', color: '#9B59B6' };
            case 'tournament': return { emoji: '🏆', name: 'Loading Tournament...', color: '#F39C12' };
            case 'fish': return { emoji: '🐠', name: 'Casting Line...', color: '#3498DB' };
            default: return { emoji: '🎣', name: 'SeaCaster', color: '#5DADE2' };
        }
    };

    const mascot = getMascot();

    return (
        <div style={styles.container}>
            {/* Animated Background Waves */}
            <div style={styles.wavesContainer}>
                <motion.div
                    style={{ ...styles.wave, ...styles.wave1 }}
                    animate={{ x: [0, -100, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    style={{ ...styles.wave, ...styles.wave2 }}
                    animate={{ x: [0, 100, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    style={{ ...styles.wave, ...styles.wave3 }}
                    animate={{ x: [0, -50, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Animated Mascot */}
            <motion.div
                style={styles.mascotContainer}
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <motion.span
                    style={styles.mascotEmoji}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {mascot.emoji}
                </motion.span>
            </motion.div>

            {/* Bubbles */}
            <div style={styles.bubblesContainer}>
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            ...styles.bubble,
                            left: `${10 + i * 12}%`,
                            width: 8 + Math.random() * 16,
                            height: 8 + Math.random() * 16,
                        }}
                        animate={{
                            y: [0, -150 - Math.random() * 100],
                            opacity: [0, 0.7, 0],
                            scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: 'easeOut',
                        }}
                    />
                ))}
            </div>

            {/* Title */}
            <motion.h1
                style={{ ...styles.title, color: mascot.color }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {mascot.name}
            </motion.h1>

            {/* Loading Bar */}
            <motion.div
                style={styles.loadingBarContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div style={styles.loadingBarTrack}>
                    <motion.div
                        style={{ ...styles.loadingBarFill, backgroundColor: mascot.color }}
                        animate={{ width: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>
            </motion.div>

            {/* Tips */}
            {showTips && (
                <motion.div
                    key={tipIndex}
                    style={styles.tipContainer}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <p style={styles.tipText}>{LOADING_TIPS[tipIndex]}</p>
                </motion.div>
            )}

            {/* Swimming Fish */}
            <motion.div
                style={styles.swimmingFish}
                animate={{ x: ['-10%', '110%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
                🐟
            </motion.div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0D2137 0%, #071422 50%, #030810 100%)',
        zIndex: 9999,
        overflow: 'hidden',
    },
    wavesContainer: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: 0.15,
    },
    wave: {
        position: 'absolute',
        width: '200%',
        height: 100,
        borderRadius: '50%',
    },
    wave1: {
        bottom: '25%',
        background: 'linear-gradient(90deg, transparent, rgba(93, 173, 226, 0.5), transparent)',
    },
    wave2: {
        bottom: '35%',
        background: 'linear-gradient(90deg, transparent, rgba(46, 134, 193, 0.4), transparent)',
    },
    wave3: {
        bottom: '45%',
        background: 'linear-gradient(90deg, transparent, rgba(39, 174, 96, 0.3), transparent)',
    },
    mascotContainer: {
        marginBottom: 24,
    },
    mascotEmoji: {
        fontSize: 96,
        display: 'block',
        filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))',
    },
    bubblesContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        pointerEvents: 'none',
    },
    bubble: {
        position: 'absolute',
        bottom: 0,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
    },
    title: {
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: 6,
        textTransform: 'uppercase',
        margin: 0,
        marginBottom: 24,
        textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    },
    loadingBarContainer: {
        width: 200,
        marginBottom: 32,
    },
    loadingBarTrack: {
        height: 6,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    loadingBarFill: {
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 0 10px currentColor',
    },
    tipContainer: {
        position: 'absolute',
        bottom: 80,
        left: 24,
        right: 24,
        textAlign: 'center',
    },
    tipText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        margin: 0,
        lineHeight: 1.5,
    },
    swimmingFish: {
        position: 'absolute',
        bottom: 150,
        fontSize: 24,
        opacity: 0.5,
    },
};

export default AnimatedLoading;
