import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, ShoppingBag, Zap, Crown, Fish, Gift } from 'lucide-react';
import { triggerHaptic, Haptics } from '../utils/haptics';
import DailyBaitBox from './DailyBaitBox';
import RodBuilder from './RodBuilder';

interface MenuScreenProps {
    onCompete: () => void;
    onShop: () => void;
    onConnect: () => void;
    onTrophyRoom: () => void;
    onLeaderboard: () => void;
    onBossBattle?: () => void;
    xp: number;
    coins: number;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
    onCompete,
    onShop,
    onConnect,
    onTrophyRoom,
    onLeaderboard,
    onBossBattle,
    xp,
    coins,
}) => {
    const { userStats } = useGameStore();
    const [showBaitBox, setShowBaitBox] = useState(false);
    const [showRodBuilder, setShowRodBuilder] = useState(false);

    // XP calculation for level progress
    const LEVEL_BASE_XP = 100;
    const LEVEL_EXPONENT = 1.5;
    const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
    const currentLevelXp = userStats.level > 1
        ? Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level - 1))
        : 0;
    const xpProgress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    const xpPercentage = Math.max(0, Math.min(100, xpProgress));

    return (
        <div className="menu-container">
            {/* Background */}
            <div className="menu-bg">
                <div className="sky" />
                <div className="ocean" />
                <div className="waves" />
            </div>

            {/* Content wrapper - scrollable if needed */}
            <div className="menu-content">

                {/* Header Row */}
                <motion.div
                    className="header-row"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Level Badge */}
                    <div className="level-badge">
                        <div className="level-circle">
                            <span className="level-num">{userStats.level}</span>
                        </div>
                        <div className="xp-bar">
                            <div className="xp-fill" style={{ width: `${xpPercentage}%` }} />
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="resources">
                        <div className="resource-pill coins">
                            <span className="resource-icon">🪙</span>
                            <span className="resource-val">{coins}</span>
                            <button className="add-btn">+</button>
                        </div>
                        <div className="resource-pill energy">
                            <Zap size={14} className="zap-icon" />
                            <span className="resource-val">
                                {userStats.premium ? '∞' : userStats.castsRemaining}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Network Badge */}
                <div className="network-badge">
                    <div className="network-dot" />
                    <span>BASE</span>
                </div>

                {/* Daily Bait Box Button */}
                <motion.button
                    className="daily-gift-btn"
                    onClick={() => {
                        triggerHaptic(Haptics.medium);
                        setShowBaitBox(true);
                    }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Gift size={20} />
                </motion.button>

                {/* Logo Section */}
                <motion.div
                    className="logo-section"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="logo-icon">🎣</div>
                    <h1 className="logo-title">SEACASTER</h1>
                    <p className="logo-tagline">Fish • Compete • Win USDC</p>
                </motion.div>

                {/* Main CTA Button */}
                <motion.button
                    className="btn-cast"
                    onClick={() => {
                        triggerHaptic(Haptics.medium);
                        onCompete();
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="cast-icon">🐟</span>
                    <span className="cast-text">CAST LINE</span>
                </motion.button>

                {/* Stats Row */}
                <motion.div
                    className="stats-row"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="stat-item">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-value">{userStats.streak}</span>
                        <span className="stat-label">STREAK</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item">
                        <span className="stat-icon">🐠</span>
                        <span className="stat-value">{userStats.level * 3}</span>
                        <span className="stat-label">FISH</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item">
                        <span className="stat-icon">🏆</span>
                        <span className="stat-value">--</span>
                        <span className="stat-label">RANK</span>
                    </div>
                </motion.div>

                {/* Rod Builder Compact Display */}
                <motion.div
                    className="rod-progress-row"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    onClick={() => {
                        triggerHaptic(Haptics.soft);
                        setShowRodBuilder(true);
                    }}
                >
                    <RodBuilder compact />
                </motion.div>

                {/* Season Pass Banner (only if not premium) */}
                {!userStats.premium && (
                    <motion.button
                        className="season-banner"
                        onClick={() => {
                            triggerHaptic(Haptics.soft);
                            onShop();
                        }}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Crown size={18} className="crown-icon" />
                        <div className="banner-text">
                            <span className="banner-title">SEASON PASS</span>
                            <span className="banner-desc">∞ Casts • 2X XP</span>
                        </div>
                        <span className="banner-price">$9.99</span>
                    </motion.button>
                )}
            </div>

            {/* Bottom Navigation - Fixed */}
            <motion.nav
                className="bottom-nav"
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, type: 'spring', bounce: 0.2 }}
            >
                <button className="nav-item" onClick={() => { triggerHaptic(Haptics.soft); onTrophyRoom(); }}>
                    <div className="nav-icon trophy-icon">
                        <Trophy size={22} />
                    </div>
                    <span className="nav-label">Trophies</span>
                </button>

                <button className="nav-item" onClick={() => { triggerHaptic(Haptics.soft); onLeaderboard(); }}>
                    <div className="nav-icon leaderboard-icon">
                        <Fish size={22} />
                    </div>
                    <span className="nav-label">Leaderboard</span>
                </button>

                {/* Center - Big Fish button */}
                <button className="nav-item center-item" onClick={() => { triggerHaptic(Haptics.medium); onCompete(); }}>
                    <div className="center-icon">
                        <span>🐠</span>
                    </div>
                    <span className="nav-label">Fish</span>
                </button>

                <button className="nav-item" onClick={() => { triggerHaptic(Haptics.soft); onShop(); }}>
                    <div className="nav-icon shop-icon">
                        <ShoppingBag size={22} />
                    </div>
                    <span className="nav-label">Shop</span>
                </button>

                <button className="nav-item" onClick={() => { triggerHaptic(Haptics.soft); onConnect(); }}>
                    <div className="nav-icon social-icon">
                        <Crown size={22} />
                    </div>
                    <span className="nav-label">Profile</span>
                </button>
            </motion.nav>

            {/* Daily Bait Box Modal */}
            <AnimatePresence>
                {showBaitBox && (
                    <DailyBaitBox onClose={() => setShowBaitBox(false)} />
                )}
            </AnimatePresence>

            {/* Rod Builder Modal */}
            <AnimatePresence>
                {showRodBuilder && (
                    <RodBuilder onClose={() => setShowRodBuilder(false)} />
                )}
            </AnimatePresence>

            <style>{`
                .menu-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Nunito', -apple-system, sans-serif;
                }

                /* Background */
                .menu-bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }

                .sky {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: linear-gradient(180deg, #1A365D 0%, #2C5282 50%, #3182CE 100%);
                }

                .ocean {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 55%;
                    background: linear-gradient(180deg, #1E4E8C 0%, #0D3B66 50%, #051F40 100%);
                }

                .waves {
                    position: absolute;
                    top: 48%;
                    left: 0;
                    right: 0;
                    height: 40px;
                    background: linear-gradient(180deg, rgba(30, 78, 140, 0) 0%, rgba(30, 78, 140, 0.6) 50%, #1E4E8C 100%);
                    border-radius: 50% 50% 0 0;
                }

                /* Daily Gift Button */
                .daily-gift-btn {
                    position: absolute;
                    top: 60px;
                    right: 16px;
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(180deg, #F39C12 0%, #D68910 100%);
                    border: 3px solid #B7950B;
                    border-radius: 14px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 0 #9A7D0A, 0 0 20px rgba(243, 156, 18, 0.4);
                    z-index: 20;
                }

                .daily-gift-btn:active {
                    transform: translateY(4px);
                    box-shadow: 0 0 0 #9A7D0A, 0 0 15px rgba(243, 156, 18, 0.3);
                }

                /* Rod Progress Row */
                .rod-progress-row {
                    cursor: pointer;
                    margin: 8px 0;
                }

                /* Content */
                .menu-content {
                    position: relative;
                    z-index: 10;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px 16px;
                    padding-top: max(12px, env(safe-area-inset-top));
                    padding-bottom: 100px; /* Space for nav */
                    gap: 16px;
                    overflow-y: auto;
                }

                /* Header */
                .header-row {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .level-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .level-circle {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%);
                    border: 3px solid #F4D03F;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 0 #C19A00;
                }

                .level-num {
                    font-size: 18px;
                    font-weight: 900;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }

                .xp-bar {
                    width: 50px;
                    height: 8px;
                    background: rgba(0,0,0,0.4);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .xp-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #27AE60, #58D68D);
                    border-radius: 4px;
                }

                .resources {
                    display: flex;
                    gap: 8px;
                }

                .resource-pill {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: rgba(0,0,0,0.4);
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .resource-icon {
                    font-size: 14px;
                }

                .zap-icon {
                    color: #F4D03F;
                    fill: #F4D03F;
                }

                .resource-val {
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                }

                .add-btn {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    background: #27AE60;
                    border: none;
                    color: white;
                    font-weight: 900;
                    font-size: 11px;
                    cursor: pointer;
                }

                /* Network Badge */
                .network-badge {
                    position: absolute;
                    top: max(60px, calc(env(safe-area-inset-top) + 48px));
                    right: 16px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    background: rgba(39, 174, 96, 0.2);
                    border: 1px solid rgba(39, 174, 96, 0.4);
                    border-radius: 10px;
                }

                .network-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #27AE60;
                    box-shadow: 0 0 6px #27AE60;
                }

                .network-badge span {
                    font-size: 9px;
                    font-weight: 800;
                    color: #27AE60;
                    letter-spacing: 0.5px;
                }

                /* Logo */
                .logo-section {
                    text-align: center;
                    margin: 8px 0;
                }

                .logo-icon {
                    font-size: 56px;
                    margin-bottom: 4px;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                }

                .logo-title {
                    font-size: 32px;
                    font-weight: 900;
                    color: #F4D03F;
                    text-shadow: 2px 2px 0 #B7950B, 4px 4px 0 rgba(0,0,0,0.2);
                    letter-spacing: 3px;
                    margin: 0;
                }

                .logo-tagline {
                    font-size: 11px;
                    color: rgba(255,255,255,0.7);
                    margin: 4px 0 0;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                /* Cast Button */
                .btn-cast {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    max-width: 280px;
                    padding: 16px 24px;
                    background: linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%);
                    border: 4px solid #145A32;
                    border-radius: 14px;
                    cursor: pointer;
                    box-shadow: 0 5px 0 #0B3D20;
                }

                .cast-icon {
                    font-size: 28px;
                }

                .cast-text {
                    font-size: 20px;
                    font-weight: 900;
                    color: white;
                    text-shadow: 1px 1px 0 #145A32;
                    letter-spacing: 2px;
                }

                .btn-cast:active {
                    transform: translateY(5px);
                    box-shadow: none;
                }

                /* Stats Row */
                .stats-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    background: rgba(0,0,0,0.35);
                    border-radius: 14px;
                    padding: 12px 20px;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    min-width: 50px;
                }

                .stat-icon {
                    font-size: 18px;
                }

                .stat-value {
                    font-size: 16px;
                    font-weight: 900;
                    color: white;
                }

                .stat-label {
                    font-size: 9px;
                    color: rgba(255,255,255,0.5);
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }

                .stat-divider {
                    width: 1px;
                    height: 32px;
                    background: rgba(255,255,255,0.2);
                }

                /* Season Banner */
                .season-banner {
                    width: 100%;
                    max-width: 300px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    background: linear-gradient(90deg, rgba(244, 208, 63, 0.15), rgba(183, 149, 11, 0.25));
                    border: 2px solid rgba(244, 208, 63, 0.4);
                    border-radius: 12px;
                    cursor: pointer;
                }

                .crown-icon {
                    color: #F4D03F;
                }

                .banner-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    text-align: left;
                }

                .banner-title {
                    font-size: 12px;
                    font-weight: 900;
                    color: #F4D03F;
                    letter-spacing: 0.5px;
                }

                .banner-desc {
                    font-size: 10px;
                    color: rgba(255,255,255,0.6);
                    font-weight: 600;
                }

                .banner-price {
                    font-size: 14px;
                    font-weight: 900;
                    color: #F4D03F;
                }

                /* Bottom Nav */
                .bottom-nav {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    padding: 8px 4px;
                    padding-bottom: max(8px, env(safe-area-inset-bottom));
                    background: linear-gradient(180deg, transparent 0%, rgba(5, 15, 30, 0.9) 20%, #050F1E 100%);
                    z-index: 50;
                }

                .nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    min-width: 56px;
                }

                .nav-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 2px 0 rgba(0,0,0,0.3);
                }

                .trophy-icon { background: linear-gradient(180deg, #E67E22, #D35400); }
                .leaderboard-icon { background: linear-gradient(180deg, #F4D03F, #D4AC0D); }
                .shop-icon { background: linear-gradient(180deg, #9B59B6, #6C3483); }
                .social-icon { background: linear-gradient(180deg, #3498DB, #2980B9); }

                .center-item {
                    margin-top: -20px;
                }

                .center-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, #3498DB 0%, #2980B9 100%);
                    border: 3px solid #1A5276;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    box-shadow: 0 3px 0 #0E3A5E;
                }

                .nav-label {
                    font-size: 9px;
                    color: rgba(255,255,255,0.6);
                    font-weight: 700;
                }

                /* Mobile height adjustments */
                @media (max-height: 700px) {
                    .logo-icon {
                        font-size: 44px;
                    }

                    .logo-title {
                        font-size: 26px;
                    }

                    .btn-cast {
                        padding: 12px 20px;
                    }

                    .cast-text {
                        font-size: 18px;
                    }

                    .stats-row {
                        padding: 10px 16px;
                        gap: 12px;
                    }
                }

                @media (max-height: 600px) {
                    .logo-tagline {
                        display: none;
                    }

                    .logo-section {
                        margin: 4px 0;
                    }

                    .menu-content {
                        gap: 10px;
                    }
                }

                /* Hide scrollbar */
                .menu-content::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default MenuScreen;
