import React from 'react';
import { useGameStore } from '../store/gameStore'; // Assuming useAuth equivalent or direct store usage
import { farcaster } from '../services/farcaster'; // For user info
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

    // Calculate XP percentage (assuming 1000 XP per level for MVP, or usage of a helper)
    const xpPercentage = (xp % 1000) / 10; // Placeholder logic

    return (
        <div className="menu-screen">
            {/* Top bar */}
            <div className="menu-header">
                <div className="xp-section">
                    <div className="level-box">{userStats.level}</div>
                    <div className="xp-bar">
                        <div className="xp-fill" style={{ width: `${xpPercentage}%` }}></div>
                        <span className="xp-text">XP {Math.floor(xpPercentage)}%</span>
                    </div>
                    <button className="xp-settings">⚙️</button>
                </div>

                <div className="coins-section">
                    <span className="coins-count">{coins}</span>
                    <span className="coins-icon">🪙</span>
                </div>
            </div>

            {/* Main content */}
            <div className="menu-content">
                <div className="network-badge">📍 BASE MAINNET</div>

                <div className="main-circle">
                    <span className="house-icon">🏠</span>
                </div>

                <button
                    className="connect-wallet-btn"
                    onClick={onConnect}
                    disabled={!!userStats.fid} // Assuming fid presence means connected/authenticated for now
                >
                    {userStats.fid ? `Connected: ${userStats.username}` : 'Connect Wallet'}
                </button>
            </div>

            {/* Bottom navigation */}
            <div className="menu-nav">
                <button className="nav-btn compete-btn" onClick={onCompete}>
                    <span className="nav-icon">🏆</span>
                    <span className="nav-label">Compete</span>
                </button>

                <button className="nav-btn home-btn">
                    <span className="nav-icon">🎣</span>
                </button>

                <button className="nav-btn shop-btn" onClick={onShop}>
                    <span className="nav-icon">🛍️</span>
                    <span className="nav-label">Shop</span>
                </button>
            </div>
        </div>
    );
};
