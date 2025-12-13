import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
    message?: string;
    variant?: 'default' | 'fish' | 'kraken' | 'tournament';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...',
    variant = 'default'
}) => {
    const getContent = () => {
        switch (variant) {
            case 'fish':
                return { emoji: '🐠', title: 'SEACASTER', subtitle: 'Reeling in data...' };
            case 'kraken':
                return { emoji: '🦑', title: 'BOSS RAID', subtitle: 'The Kraken awakens...' };
            case 'tournament':
                return { emoji: '🏆', title: 'TOURNAMENT', subtitle: 'Loading leaderboards...' };
            default:
                return { emoji: '🎣', title: 'SEACASTER', subtitle: message };
        }
    };

    const content = getContent();

    return (
        <div style={styles.container}>
            {/* Animated Background */}
            <div style={styles.background}>
                <motion.div
                    style={styles.wave1}
                    animate={{ x: [0, -200, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    style={styles.wave2}
                    animate={{ x: [0, 200, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Main Content */}
            <motion.div
                style={styles.content}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Animated Icon */}
                <motion.div
                    style={styles.iconContainer}
                    animate={{
                        y: [0, -15, 0],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <span style={styles.emoji}>{content.emoji}</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                    style={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {content.title}
                </motion.h1>

                {/* Loading Bar */}
                <motion.div
                    style={styles.loadingBarContainer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div style={styles.loadingBarTrack}>
                        <motion.div
                            style={styles.loadingBar}
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    style={styles.subtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {content.subtitle}
                </motion.p>

                {/* Floating Particles */}
                <div style={styles.particles}>
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            style={{
                                ...styles.particle,
                                left: `${15 + i * 15}%`,
                            }}
                            animate={{
                                y: [0, -20, 0],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: i * 0.3,
                            }}
                        >
                            {['✨', '🫧', '💎', '⭐', '🌊', '🐟'][i]}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0A3A52 0%, #0D2137 50%, #071422 100%)',
        zIndex: 9999,
    },
    background: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: 0.3,
    },
    wave1: {
        position: 'absolute',
        bottom: '20%',
        left: 0,
        width: '200%',
        height: 100,
        background: 'linear-gradient(90deg, transparent, rgba(93, 173, 226, 0.3), transparent)',
        borderRadius: '50%',
        transform: 'scaleX(2)',
    },
    wave2: {
        position: 'absolute',
        bottom: '30%',
        left: 0,
        width: '200%',
        height: 80,
        background: 'linear-gradient(90deg, transparent, rgba(46, 134, 193, 0.2), transparent)',
        borderRadius: '50%',
        transform: 'scaleX(2)',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        textAlign: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 20,
    },
    emoji: {
        fontSize: 72,
        display: 'block',
        filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))',
    },
    title: {
        fontSize: 28,
        fontWeight: 900,
        color: '#5DADE2',
        letterSpacing: 8,
        textTransform: 'uppercase',
        margin: 0,
        marginBottom: 24,
        textShadow: '0 2px 10px rgba(93, 173, 226, 0.5)',
    },
    loadingBarContainer: {
        width: 200,
        marginBottom: 24,
    },
    loadingBarTrack: {
        height: 4,
        borderRadius: 2,
        background: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    loadingBar: {
        height: '100%',
        background: 'linear-gradient(90deg, #5DADE2, #27AE60)',
        borderRadius: 2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 3,
        margin: 0,
    },
    particles: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
    },
    particle: {
        position: 'absolute',
        fontSize: 16,
        opacity: 0.5,
    },
};

export default LoadingScreen;
