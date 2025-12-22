import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { triggerHaptic, Haptics } from '../utils/haptics';
import DailyBaitBox from './DailyBaitBox';
import RodBuilder from './RodBuilder';
import { BACKGROUNDS, UI_ASSETS, BADGES, getRankBadge } from '../config/assets';

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
    const [showDailyGift, setShowDailyGift] = useState(false);
    const [showRodBuilder, setShowRodBuilder] = useState(false);
    const { userStats, checkDailyLogin } = useGameStore();

    // Calculate level and XP progress
    const currentLevelXp = Math.floor(100 * Math.pow(1.5, userStats.level - 1));
    const nextLevelXp = Math.floor(100 * Math.pow(1.5, userStats.level));
    const isMaxLevel = userStats.level >= 50;

    // Calculate progress percentage accurately
    const levelProgress = isMaxLevel ? 100 :
        Math.max(0, Math.min(100, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

    // Parallax effect for background
    const [offsetY, setOffsetY] = useState(0);
    useEffect(() => {
        const handleScroll = () => setOffsetY(window.scrollY * 0.5);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handlePlayClick = () => {
        triggerHaptic(Haptics.heavy);
        onCompete();
    };

    return (
        <div className="menu-screen-container">
            {/* Parallax Background */}
            <div
                className="menu-bg-parallax"
                style={{
                    backgroundImage: `url(${BACKGROUNDS.menuBg})`,
                    transform: `translateY(${offsetY}px)`
                }}
            />
            <div className="menu-overlay" />

            <div className="menu-content">
                {/* Header: User Stats */}
                <header className="menu-header">
                    <div className="user-info">
                        <div className="level-badge-container">
                            <img
                                src={getRankBadge(userStats.level > 30 ? 1 : userStats.level > 15 ? 2 : 3) || BADGES.bronze}
                                alt="Rank Badge"
                                className="rank-badge"
                            />
                            <span className="level-text">{userStats.level}</span>
                        </div>
                        <div className="xp-bar-container">
                            <div className="xp-text">XP {Math.floor(xp)} / {nextLevelXp}</div>
                            <div className="xp-track">
                                <motion.div
                                    className="xp-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${levelProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="currency-display">
                        <img src={UI_ASSETS.coinDoubloon} alt="Coins" className="coin-icon" />
                        <span className="coin-amount">{coins.toLocaleString()}</span>
                    </div>
                </header>

                <main className="menu-main">
                    {/* Game Logo/Title Area */}
                    <div className="title-area">
                        <motion.img
                            src={UI_ASSETS.pirateCaptain}
                            alt="Captain"
                            className="mascot-img blend-screen"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <h1 className="game-title">SEA CASTER</h1>
                    </div>

                    {/* Main Action Button */}
                    <motion.button
                        className="play-btn-large"
                        onClick={handlePlayClick}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <img src={UI_ASSETS.buttonCastGreen || UI_ASSETS.buttonCast} alt="Cast Line" className="btn-bg" />
                        <span className="btn-text">CAST LINE</span>
                        <div className="btn-shine" />
                    </motion.button>

                    {/* Secondary Actions Grid */}
                    <div className="actions-grid">
                        <MenuButton
                            icon={UI_ASSETS.buttonShop}
                            label="SHOP"
                            onClick={() => { triggerHaptic(Haptics.medium); onShop(); }}
                            color="#9B59B6"
                        />
                        <MenuButton
                            icon={UI_ASSETS.tournamentTrophy}
                            label="RANKED"
                            onClick={onLeaderboard}
                            color="#F39C12"
                        />
                        <MenuButton
                            icon={UI_ASSETS.treasureChest}
                            label="TROPHY"
                            onClick={onTrophyRoom}
                            color="#E67E22"
                        />
                        <MenuButton
                            icon={UI_ASSETS.energyBolt}
                            label="GEAR"
                            onClick={() => { triggerHaptic(Haptics.soft); setShowRodBuilder(true); }}
                            color="#3498DB"
                        />
                    </div>

                    {/* Daily Gift FAB */}
                    <motion.button
                        className="daily-gift-fab"
                        onClick={() => setShowDailyGift(true)}
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <img src={UI_ASSETS.dailyGift} alt="Daily Gift" className="blend-screen" />
                    </motion.button>
                </main>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showDailyGift && <DailyBaitBox onClose={() => setShowDailyGift(false)} />}
                {showRodBuilder && <RodBuilder onClose={() => setShowRodBuilder(false)} />}
            </AnimatePresence>

            <style>{`
                .menu-screen-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    overflow: hidden;
                    background: #000;
                }

                .menu-bg-parallax {
                    position: absolute;
                    inset: -50px; /* Extra space for parallax */
                    background-size: cover;
                    background-position: center;
                    z-index: 0;
                    filter: brightness(0.8);
                }

                .menu-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 100%);
                    z-index: 1;
                }

                .menu-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                }

                .menu-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-top: env(safe-area-inset-top);
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .level-badge-container {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rank-badge {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }

                .level-text {
                    position: absolute;
                    font-weight: 900;
                    color: white;
                    font-size: 16px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                    z-index: 2;
                }

                .xp-bar-container {
                    width: 120px;
                }

                .xp-text {
                    font-size: 10px;
                    color: #fff;
                    font-weight: 700;
                    margin-bottom: 2px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                }

                .xp-track {
                    width: 100%;
                    height: 8px;
                    background: rgba(0,0,0,0.5);
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .xp-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #F4D03F, #F39C12);
                    box-shadow: 0 0 8px rgba(243, 156, 18, 0.5);
                }

                .currency-display {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.6);
                    padding: 6px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,215,0,0.3);
                    gap: 8px;
                }

                .coin-icon {
                    width: 24px;
                    height: 24px;
                }

                .coin-amount {
                    color: #F4D03F;
                    font-weight: 800;
                    font-size: 16px;
                    text-shadow: 0 1px 2px rgba(0,0,0,1);
                }

                .menu-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 30px;
                }

                .title-area {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .mascot-img {
                    width: 140px;
                    height: auto;
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
                }

                .game-title {
                    font-family: 'Cinzel', serif; /* Use a strong serif if available, else fallback */
                    font-size: 36px;
                    font-weight: 900;
                    color: white;
                    text-align: center;
                    margin-top: -10px;
                    text-shadow: 0 4px 0 #000, 0 0 20px rgba(93, 173, 226, 0.6);
                    letter-spacing: 2px;
                }

                .play-btn-large {
                    position: relative;
                    width: 280px;
                    height: 80px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-bg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .btn-text {
                    position: relative;
                    z-index: 2;
                    font-size: 28px;
                    font-weight: 900;
                    color: white;
                    text-shadow: 0 2px 0 rgba(0,0,0,0.5);
                    letter-spacing: 1px;
                }

                .btn-shine {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
                    mask-image: url(${UI_ASSETS.buttonCastGreen || UI_ASSETS.buttonCast});
                    mask-size: contain;
                    mask-repeat: no-repeat;
                    mask-position: center;
                    animation: shine 4s infinite linear;
                }

                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    20% { transform: translateX(100%); }
                    100% { transform: translateX(100%); }
                }

                .actions-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    width: 100%;
                    max-width: 320px;
                }

                .menu-btn {
                    position: relative;
                    height: 60px;
                    background: rgba(0,0,0,0.6);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    overflow: hidden;
                    backdrop-filter: blur(4px);
                }

                .menu-btn-icon {
                    width: 24px;
                    height: 24px;
                    object-fit: contain;
                }

                .menu-btn-label {
                    color: white;
                    font-weight: 800;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }

                .daily-gift-fab {
                    position: absolute;
                    bottom: 30px;
                    right: 20px;
                    width: 64px;
                    height: 64px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
                    z-index: 10;
                }
                
                .daily-gift-fab img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
            `}</style>
        </div>
    );
};

// Sub-component for grid buttons
const MenuButton = ({ icon, label, onClick, color }: { icon: string, label: string, onClick: () => void, color: string }) => (
    <motion.button
        className="menu-btn"
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        style={{ borderColor: `${color}40`, boxShadow: `0 4px 0 ${color}20` }}
    >
        <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${color}20 0%, transparent 100%)`,
            opacity: 0.5
        }} />
        <img src={icon} alt={label} className="menu-btn-icon blend-screen" />
        <span className="menu-btn-label">{label}</span>
    </motion.button>
);

export default MenuScreen;
