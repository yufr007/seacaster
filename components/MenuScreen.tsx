import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, ShoppingBag, Zap, Settings, ChevronRight, Crown, Star, Users, Gift } from 'lucide-react';
import './MenuScreen.css';

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
    const [showSeasonPass, setShowSeasonPass] = useState(false);

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
        <div className="coc-menu">
            {/* Background with ocean gradient */}
            <div className="coc-bg">
                <div className="coc-clouds">
                    <div className="cloud cloud-1"></div>
                    <div className="cloud cloud-2"></div>
                    <div className="cloud cloud-3"></div>
                </div>
                <div className="coc-water"></div>
                <div className="coc-water-shine"></div>
            </div>

            {/* Top Bar - Resources */}
            <motion.div
                className="coc-top-bar"
                initial={{ y: -60 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
            >
                {/* Level Badge */}
                <div className="coc-level-badge">
                    <div className="level-shield">
                        <span className="level-num">{userStats.level}</span>
                    </div>
                    <div className="level-xp-bar">
                        <div className="xp-track">
                            <motion.div
                                className="xp-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${xpPercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <span className="xp-label">XP</span>
                    </div>
                </div>

                {/* Resources */}
                <div className="coc-resources">
                    {/* Coins */}
                    <div className="resource-pill gold">
                        <div className="resource-icon-wrap">
                            <span className="resource-emoji">🪙</span>
                        </div>
                        <span className="resource-amount">{coins.toLocaleString()}</span>
                        <button className="resource-plus">+</button>
                    </div>

                    {/* Energy */}
                    <div className="resource-pill energy">
                        <div className="resource-icon-wrap">
                            <Zap size={20} className="zap-icon" />
                        </div>
                        <span className="resource-amount">
                            {userStats.premium ? "∞" : `${userStats.castsRemaining}/${userStats.maxCasts}`}
                        </span>
                        {!userStats.premium && (
                            <button className="resource-plus">+</button>
                        )}
                    </div>
                </div>

                {/* Settings */}
                <button className="coc-settings-btn">
                    <Settings size={20} />
                </button>
            </motion.div>

            {/* Main Content Area */}
            <div className="coc-main-content">
                {/* Logo Area */}
                <motion.div
                    className="coc-logo-area"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                >
                    <div className="logo-container">
                        <img
                            src="/seacaster-logo.png"
                            alt="SeaCaster"
                            className="logo-image"
                            onError={(e) => {
                                // Fallback to emoji if logo not found
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="logo-fallback hidden">
                            <span className="logo-emoji">🎣</span>
                            <span className="logo-text">SEACASTER</span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Play Button */}
                <motion.button
                    className="coc-play-btn"
                    onClick={onCompete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                >
                    <span className="play-icon">🎣</span>
                    <span className="play-text">PLAY</span>
                    <div className="play-shine"></div>
                </motion.button>

                {/* Connection Status */}
                <motion.button
                    className={`coc-connect-btn ${userStats.fid ? 'connected' : ''}`}
                    onClick={onConnect}
                    disabled={!!userStats.fid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {userStats.fid ? (
                        <>
                            <div className="connected-dot"></div>
                            <span>{userStats.username}</span>
                        </>
                    ) : (
                        <>
                            <span className="wallet-icon">👛</span>
                            <span>Connect Wallet</span>
                        </>
                    )}
                </motion.button>

                {/* Quick Stats Row */}
                <motion.div
                    className="coc-quick-stats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="stat-box">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-value">{userStats.streak}</span>
                        <span className="stat-label">Streak</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                        <span className="stat-icon">🐟</span>
                        <span className="stat-value">0</span>
                        <span className="stat-label">Fish</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                        <span className="stat-icon">🏆</span>
                        <span className="stat-value">--</span>
                        <span className="stat-label">Rank</span>
                    </div>
                </motion.div>
            </div>

            {/* Season Pass Banner */}
            {!userStats.premium && (
                <motion.div
                    className="coc-season-banner"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => setShowSeasonPass(true)}
                >
                    <Crown size={20} className="crown-icon" />
                    <div className="banner-text">
                        <span className="banner-title">SEASON PASS</span>
                        <span className="banner-desc">Unlimited Casts • 2X XP</span>
                    </div>
                    <div className="banner-price">
                        <span>$9.99</span>
                    </div>
                </motion.div>
            )}

            {/* Bottom Navigation */}
            <motion.div
                className="coc-bottom-nav"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", bounce: 0.2 }}
            >
                {/* Tournaments */}
                <button className="nav-btn-coc" onClick={onCompete}>
                    <div className="nav-icon-coc orange">
                        <Trophy size={28} />
                    </div>
                    <span className="nav-label-coc">Compete</span>
                    {/* Notification badge */}
                    <div className="nav-badge">3</div>
                </button>

                {/* Home/Fish - Center Button */}
                <button className="nav-btn-coc center" onClick={onCompete}>
                    <div className="nav-icon-coc blue large">
                        <span className="fish-emoji">🐠</span>
                    </div>
                    <span className="nav-label-coc">Fish</span>
                </button>

                {/* Shop */}
                <button className="nav-btn-coc" onClick={onShop}>
                    <div className="nav-icon-coc purple">
                        <ShoppingBag size={28} />
                    </div>
                    <span className="nav-label-coc">Shop</span>
                </button>

                {/* Leaderboard */}
                <button className="nav-btn-coc">
                    <div className="nav-icon-coc green">
                        <Users size={28} />
                    </div>
                    <span className="nav-label-coc">Social</span>
                </button>

                {/* Rewards */}
                <button className="nav-btn-coc">
                    <div className="nav-icon-coc red">
                        <Gift size={28} />
                    </div>
                    <span className="nav-label-coc">Rewards</span>
                    <div className="nav-badge pulse">!</div>
                </button>
            </motion.div>

            {/* Network Badge */}
            <div className="coc-network-badge">
                <div className="network-dot"></div>
                <span>BASE</span>
            </div>
        </div>
    );
};
