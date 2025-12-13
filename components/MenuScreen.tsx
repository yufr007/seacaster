import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, ShoppingBag, Zap, Settings, Crown, Users, Gift, Fish, Anchor } from 'lucide-react';

interface MenuScreenProps {
    onCompete: () => void;
    onShop: () => void;
    onConnect: () => void;
    xp: number;
    coins: number;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
    onCompete,
    onShop,
    onConnect,
    xp,
    coins,
}) => {
    const { userStats } = useGameStore();

    // XP calculation
    const LEVEL_BASE_XP = 100;
    const LEVEL_EXPONENT = 1.5;
    const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
    const currentLevelXp = userStats.level > 1
        ? Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level - 1))
        : 0;
    const xpProgress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    const xpPercentage = Math.max(0, Math.min(100, xpProgress));

    return (
        <div style={styles.container}>
            {/* Ocean Background */}
            <div style={styles.background}>
                <div style={styles.sky} />
                <div style={styles.ocean} />
                <div style={styles.waves} />
            </div>

            {/* Top Header Bar */}
            <motion.div
                style={styles.topBar}
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
            >
                {/* Level Badge */}
                <div style={styles.levelBadge}>
                    <div style={styles.levelCircle}>
                        <span style={styles.levelNumber}>{userStats.level}</span>
                    </div>
                    <div style={styles.xpBarContainer}>
                        <div style={styles.xpBarTrack}>
                            <motion.div
                                style={{ ...styles.xpBarFill, width: `${xpPercentage}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${xpPercentage}%` }}
                            />
                        </div>
                    </div>
                    {userStats.premium && <span style={styles.premiumBadge}>👑</span>}
                </div>

                {/* Resources Row */}
                <div style={styles.resourcesRow}>
                    {/* Coins */}
                    <div style={styles.resourcePill}>
                        <span style={styles.resourceIcon}>🪙</span>
                        <span style={styles.resourceValue}>{coins.toLocaleString()}</span>
                        <button style={styles.plusButton}>+</button>
                    </div>

                    {/* Energy */}
                    <div style={{ ...styles.resourcePill, ...styles.energyPill }}>
                        <Zap size={16} style={styles.zapIcon} />
                        <span style={styles.resourceValue}>
                            {userStats.premium ? "∞" : userStats.castsRemaining}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {/* Logo */}
                <motion.div
                    style={styles.logoSection}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div style={styles.logoIcon}>🎣</div>
                    <h1 style={styles.logoText}>SEACASTER</h1>
                    <p style={styles.tagline}>Fish • Compete • Win USDC</p>
                </motion.div>

                {/* Big PLAY Button */}
                <motion.button
                    style={styles.playButton}
                    onClick={onCompete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95, y: 4 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                >
                    <span style={styles.playButtonIcon}>🐟</span>
                    <span style={styles.playButtonText}>CAST LINE</span>
                </motion.button>

                {/* Stats Row */}
                <motion.div
                    style={styles.statsRow}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div style={styles.statBox}>
                        <span style={styles.statIcon}>🔥</span>
                        <span style={styles.statValue}>{userStats.streak}</span>
                        <span style={styles.statLabel}>Streak</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statBox}>
                        <span style={styles.statIcon}>🐠</span>
                        <span style={styles.statValue}>{userStats.level * 3}</span>
                        <span style={styles.statLabel}>Fish</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statBox}>
                        <span style={styles.statIcon}>🏆</span>
                        <span style={styles.statValue}>--</span>
                        <span style={styles.statLabel}>Rank</span>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    style={styles.quickActions}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <button style={styles.actionButton} onClick={onShop}>
                        <ShoppingBag size={20} color="#F4D03F" />
                        <span style={styles.actionLabel}>Shop</span>
                    </button>
                    <button style={styles.actionButton}>
                        <Trophy size={20} color="#E67E22" />
                        <span style={styles.actionLabel}>Tournaments</span>
                    </button>
                    <button style={styles.actionButton}>
                        <Users size={20} color="#3498DB" />
                        <span style={styles.actionLabel}>Friends</span>
                    </button>
                </motion.div>
            </div>

            {/* Season Pass Banner */}
            {!userStats.premium && (
                <motion.div
                    style={styles.seasonBanner}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={onShop}
                >
                    <Crown size={18} color="#F4D03F" />
                    <div style={styles.bannerText}>
                        <span style={styles.bannerTitle}>SEASON PASS</span>
                        <span style={styles.bannerDesc}>∞ Casts • 2X XP</span>
                    </div>
                    <span style={styles.bannerPrice}>$9.99</span>
                </motion.div>
            )}

            {/* Bottom Navigation */}
            <motion.div
                style={styles.bottomNav}
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", bounce: 0.2 }}
            >
                <button style={styles.navButton} onClick={onCompete}>
                    <div style={{ ...styles.navIcon, background: 'linear-gradient(180deg, #E67E22, #D35400)' }}>
                        <Trophy size={24} color="white" />
                    </div>
                    <span style={styles.navLabel}>Compete</span>
                </button>

                <button style={styles.navButton}>
                    <div style={{ ...styles.navIcon, background: 'linear-gradient(180deg, #27AE60, #1E8449)' }}>
                        <Gift size={24} color="white" />
                    </div>
                    <span style={styles.navLabel}>Rewards</span>
                </button>

                {/* Center Fish Button */}
                <button style={styles.navButtonCenter} onClick={onCompete}>
                    <div style={styles.centerIcon}>
                        <span style={{ fontSize: 32 }}>🐠</span>
                    </div>
                    <span style={styles.navLabel}>Fish</span>
                </button>

                <button style={styles.navButton} onClick={onShop}>
                    <div style={{ ...styles.navIcon, background: 'linear-gradient(180deg, #9B59B6, #6C3483)' }}>
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span style={styles.navLabel}>Shop</span>
                </button>

                <button style={styles.navButton}>
                    <div style={{ ...styles.navIcon, background: 'linear-gradient(180deg, #3498DB, #2980B9)' }}>
                        <Users size={24} color="white" />
                    </div>
                    <span style={styles.navLabel}>Social</span>
                </button>
            </motion.div>

            {/* Network Badge */}
            <div style={styles.networkBadge}>
                <div style={styles.networkDot} />
                <span style={styles.networkText}>BASE</span>
            </div>
        </div>
    );
};

// Inline styles for reliable rendering
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#0A1628',
    },

    // Background
    background: {
        position: 'absolute',
        inset: 0,
        zIndex: 0,
    },
    sky: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, #1A365D 0%, #2C5282 50%, #3182CE 100%)',
    },
    ocean: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
        background: 'linear-gradient(180deg, #1E4E8C 0%, #0D3B66 50%, #051F40 100%)',
    },
    waves: {
        position: 'absolute',
        bottom: '45%',
        left: 0,
        right: 0,
        height: 60,
        background: 'linear-gradient(180deg, rgba(30, 78, 140, 0) 0%, rgba(30, 78, 140, 0.8) 50%, #1E4E8C 100%)',
        borderRadius: '50% 50% 0 0',
    },

    // Top Bar
    topBar: {
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        gap: 12,
    },
    levelBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    levelCircle: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%)',
        border: '3px solid #F4D03F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 0 #C19A00',
    },
    levelNumber: {
        fontSize: 22,
        fontWeight: 900,
        color: 'white',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    xpBarContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    xpBarTrack: {
        width: 60,
        height: 10,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    xpBarFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #27AE60, #58D68D)',
        borderRadius: 5,
    },
    premiumBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        fontSize: 16,
    },

    // Resources
    resourcesRow: {
        display: 'flex',
        gap: 8,
        flex: 1,
        justifyContent: 'flex-end',
    },
    resourcePill: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%)',
        borderRadius: 16,
        border: '2px solid #1A1A1A',
    },
    energyPill: {
        background: 'linear-gradient(180deg, #1E3A5F 0%, #152F4A 100%)',
        borderColor: '#0D1F30',
    },
    resourceIcon: {
        fontSize: 16,
    },
    zapIcon: {
        color: '#F4D03F',
        fill: '#F4D03F',
    },
    resourceValue: {
        fontSize: 14,
        fontWeight: 800,
        color: 'white',
        minWidth: 28,
        textAlign: 'center',
    },
    plusButton: {
        width: 18,
        height: 18,
        borderRadius: 4,
        background: 'linear-gradient(180deg, #27AE60, #1E8449)',
        border: 'none',
        color: 'white',
        fontWeight: 900,
        fontSize: 12,
        cursor: 'pointer',
    },

    // Main Content
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 24px',
        position: 'relative',
        zIndex: 5,
        gap: 20,
    },
    logoSection: {
        textAlign: 'center',
        marginBottom: 8,
    },
    logoIcon: {
        fontSize: 64,
        marginBottom: 8,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
    },
    logoText: {
        fontSize: 36,
        fontWeight: 900,
        color: '#F4D03F',
        textShadow: '3px 3px 0 #B7950B, 5px 5px 0 rgba(0,0,0,0.3)',
        letterSpacing: 4,
        margin: 0,
    },
    tagline: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        fontWeight: 600,
        letterSpacing: 1,
    },

    // Play Button
    playButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%)',
        border: '6px solid #145A32',
        boxShadow: '0 8px 0 #0B3D20, 0 12px 25px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
    },
    playButtonIcon: {
        fontSize: 48,
        marginBottom: 4,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    },
    playButtonText: {
        fontSize: 20,
        fontWeight: 900,
        color: 'white',
        textShadow: '2px 2px 0 #145A32',
        letterSpacing: 2,
    },

    // Stats Row
    statsRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 16,
        padding: '12px 20px',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    statBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    statIcon: {
        fontSize: 20,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 900,
        color: 'white',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statDivider: {
        width: 1,
        height: 36,
        background: 'rgba(255,255,255,0.2)',
    },

    // Quick Actions
    quickActions: {
        display: 'flex',
        gap: 12,
    },
    actionButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
    },
    actionLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 700,
    },

    // Season Banner
    seasonBanner: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'linear-gradient(90deg, rgba(244, 208, 63, 0.2), rgba(183, 149, 11, 0.3))',
        borderRadius: 14,
        border: '2px solid rgba(244, 208, 63, 0.5)',
        cursor: 'pointer',
        zIndex: 10,
    },
    bannerText: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    bannerTitle: {
        fontSize: 14,
        fontWeight: 900,
        color: '#F4D03F',
        letterSpacing: 1,
    },
    bannerDesc: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 600,
    },
    bannerPrice: {
        fontSize: 16,
        fontWeight: 900,
        color: '#F4D03F',
    },

    // Bottom Nav
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        padding: '12px 8px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, transparent 0%, rgba(10, 22, 40, 0.95) 30%, #0A1628 100%)',
        zIndex: 20,
    },
    navButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
    },
    navButtonCenter: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        marginTop: -24,
    },
    navIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 0 rgba(0,0,0,0.3)',
    },
    centerIcon: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #3498DB 0%, #2980B9 100%)',
        border: '4px solid #1A5276',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 0 #0E3A5E, 0 8px 15px rgba(0,0,0,0.4)',
    },
    navLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 700,
    },

    // Network Badge
    networkBadge: {
        position: 'absolute',
        top: 'max(60px, calc(env(safe-area-inset-top) + 50px))',
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: 'rgba(39, 174, 96, 0.2)',
        borderRadius: 12,
        border: '1px solid rgba(39, 174, 96, 0.4)',
        zIndex: 10,
    },
    networkDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#27AE60',
        boxShadow: '0 0 8px #27AE60',
    },
    networkText: {
        fontSize: 10,
        fontWeight: 800,
        color: '#27AE60',
        letterSpacing: 1,
    },
};

export default MenuScreen;
