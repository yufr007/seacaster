import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, ShoppingBag, Anchor, Waves, Sparkles, Wallet, Settings, ChevronRight } from 'lucide-react';
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
    const [ripple, setRipple] = useState(false);

    // XP calculation with proper leveling formula
    const LEVEL_BASE_XP = 100;
    const LEVEL_EXPONENT = 1.5;
    const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
    const currentLevelXp = userStats.level > 1 
        ? Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level - 1)) 
        : 0;
    const xpProgress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    const xpPercentage = Math.max(0, Math.min(100, xpProgress));

    // Animated water ripple effect
    useEffect(() => {
        const interval = setInterval(() => {
            setRipple(prev => !prev);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="menu-screen">
            {/* Animated ocean background */}
            <div className="ocean-bg">
                <div className="wave wave1"></div>
                <div className="wave wave2"></div>
                <div className="wave wave3"></div>
                <div className="bubbles">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bubble" style={{
                            left: `${10 + i * 12}%`,
                            animationDelay: `${i * 0.5}s`,
                            width: `${8 + Math.random() * 12}px`,
                            height: `${8 + Math.random() * 12}px`,
                        }}></div>
                    ))}
                </div>
            </div>

            {/* Floating particles */}
            <div className="particles">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="particle"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ 
                            opacity: [0, 0.6, 0],
                            y: [-20, -200],
                            x: Math.sin(i) * 30
                        }}
                        transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeOut"
                        }}
                        style={{ left: `${5 + i * 8}%` }}
                    />
                ))}
            </div>

            {/* Header */}
            <motion.div 
                className="menu-header"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="xp-section">
                    <motion.div 
                        className="level-box"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="level-number">{userStats.level}</span>
                        {userStats.premium && <Sparkles className="premium-badge" size={12} />}
                    </motion.div>
                    <div className="xp-bar-container">
                        <div className="xp-bar">
                            <motion.div 
                                className="xp-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${xpPercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            >
                                <div className="xp-glow"></div>
                            </motion.div>
                        </div>
                        <span className="xp-text">
                            {Math.floor(xpPercentage)}% to Lvl {userStats.level + 1}
                        </span>
                    </div>
                    <motion.button 
                        className="settings-btn"
                        whileHover={{ rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Settings size={18} />
                    </motion.button>
                </div>

                <motion.div 
                    className="coins-section"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="coin-icon-wrapper">
                        <span className="coin-icon">🪙</span>
                    </div>
                    <span className="coins-count">{coins.toLocaleString()}</span>
                    <ChevronRight size={16} className="coins-arrow" />
                </motion.div>
            </motion.div>

            {/* Main content */}
            <div className="menu-content">
                <motion.div 
                    className="network-badge"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="network-dot"></div>
                    <span>BASE MAINNET</span>
                </motion.div>

                {/* Central fishing animation */}
                <motion.div 
                    className="main-circle-container"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                >
                    <div className="circle-glow"></div>
                    <motion.div 
                        className="main-circle"
                        animate={{ 
                            boxShadow: ripple 
                                ? "0 0 60px 20px rgba(59, 130, 246, 0.4)" 
                                : "0 0 40px 10px rgba(59, 130, 246, 0.2)"
                        }}
                        transition={{ duration: 1.5 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Anchor size={64} className="anchor-icon" />
                        </motion.div>
                        <Waves className="waves-decoration" size={32} />
                    </motion.div>
                    <div className="ripple-rings">
                        <div className="ripple-ring ring1"></div>
                        <div className="ripple-ring ring2"></div>
                        <div className="ripple-ring ring3"></div>
                    </div>
                </motion.div>

                <motion.button
                    className={`connect-wallet-btn ${userStats.fid ? 'connected' : ''}`}
                    onClick={onConnect}
                    disabled={!!userStats.fid}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Wallet size={20} />
                    <span>{userStats.fid ? `${userStats.username}` : 'Connect Wallet'}</span>
                    {userStats.fid && <div className="connected-indicator"></div>}
                </motion.button>

                {/* Quick stats */}
                <motion.div 
                    className="quick-stats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="stat-item">
                        <span className="stat-value">{userStats.streak}</span>
                        <span className="stat-label">Day Streak 🔥</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">{userStats.castsRemaining}</span>
                        <span className="stat-label">Casts ⚡</span>
                    </div>
                </motion.div>
            </div>

            {/* Bottom navigation */}
            <motion.div 
                className="menu-nav"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <motion.button 
                    className="nav-btn compete-btn" 
                    onClick={onCompete}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="nav-icon-wrapper">
                        <Trophy size={24} />
                    </div>
                    <span className="nav-label">Compete</span>
                </motion.button>

                <motion.button 
                    className="nav-btn home-btn"
                    onClick={onCompete}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <span className="home-icon">🎣</span>
                    <span className="play-text">PLAY</span>
                </motion.button>

                <motion.button 
                    className="nav-btn shop-btn" 
                    onClick={onShop}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="nav-icon-wrapper">
                        <ShoppingBag size={24} />
                    </div>
                    <span className="nav-label">Shop</span>
                </motion.button>
            </motion.div>
        </div>
    );
};
