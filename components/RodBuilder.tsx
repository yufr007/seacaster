import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Lock, Check, Sparkles } from 'lucide-react';

interface RodBuilderProps {
    onClose?: () => void;
    compact?: boolean; // For inline display in menu
}

// Blueprint: Level milestones for rod pieces
const ROD_PIECES = [
    { id: 'handle', name: 'Kraken Tentacle Handle', level: 10, image: '/assets/ui/rod_handle.png.jpg', position: 'bottom' },
    { id: 'rod', name: 'Barnacle-Encrusted Rod', level: 20, image: '/assets/ui/rod_shaft.png.jpg', position: 'middle' },
    { id: 'hook', name: 'Anchor Hook', level: 30, image: '/assets/ui/rod_hook.png.jpg', position: 'top' },
    { id: 'reel', name: 'Brass Spyglass Reel', level: 40, image: '/assets/ui/rod_reel.png.jpg', position: 'side' },
    { id: 'tip', name: 'Complete Pirate Rod', level: 50, image: '/assets/ui/rod_complete.png.jpg', position: 'complete' },
];

const RodBuilder: React.FC<RodBuilderProps> = ({ onClose, compact = false }) => {
    const { userStats } = useGameStore();

    const unlockedCount = ROD_PIECES.filter(piece => userStats.level >= piece.level).length;
    const isComplete = unlockedCount === 5;
    const isPremium = userStats.premium;

    if (compact) {
        return (
            <motion.div
                className="rod-builder-compact"
                whileTap={{ scale: 0.95 }}
            >
                <div className="compact-rod">
                    {/* Silhouette Rod Shape */}
                    <svg width="80" height="120" viewBox="0 0 80 120">
                        {/* Handle (bottom) */}
                        <rect
                            x="32" y="90" width="16" height="28" rx="3"
                            fill={userStats.level >= 10 ? (isPremium ? '#DAA520' : '#8B4513') : '#333'}
                            opacity={userStats.level >= 10 ? 1 : 0.3}
                        />
                        {/* Reel (side) */}
                        <circle
                            cx="25" cy="85" r="10"
                            fill={userStats.level >= 40 ? (isPremium ? '#B8860B' : '#6B6B6B') : '#333'}
                            opacity={userStats.level >= 40 ? 1 : 0.3}
                        />
                        {/* Rod Body (middle) */}
                        <rect
                            x="36" y="25" width="8" height="68" rx="2"
                            fill={userStats.level >= 20 ? (isPremium ? '#8B4513' : '#5C4033') : '#333'}
                            opacity={userStats.level >= 20 ? 1 : 0.3}
                        />
                        {/* Hook (top) */}
                        <path
                            d="M40 5 L40 25 M35 15 Q30 20 35 25 M45 15 Q50 20 45 25"
                            stroke={userStats.level >= 30 ? (isPremium ? '#DAA520' : '#C0C0C0') : '#333'}
                            strokeWidth="3"
                            fill="none"
                            opacity={userStats.level >= 30 ? 1 : 0.3}
                        />
                        {/* Tip Glow (Level 50) */}
                        {userStats.level >= 50 && isPremium && (
                            <circle cx="40" cy="5" r="5" fill="#F39C12">
                                <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                        )}
                    </svg>
                </div>
                <div className="compact-progress">
                    <span className="piece-count">{unlockedCount}/5</span>
                    {isPremium && <Sparkles size={12} className="premium-sparkle" />}
                </div>
                <style>{`
          .rod-builder-compact {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.1);
          }
          .compact-rod {
            position: relative;
          }
          .compact-progress {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .piece-count {
            color: white;
            font-size: 12px;
            font-weight: 700;
          }
          .premium-sparkle {
            color: #F4D03F;
          }
        `}</style>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="rod-builder-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="rod-builder-panel"
                initial={{ y: 100, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 100, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="builder-header">
                    <h2>⚓ Season 1: Pirate Rod</h2>
                    <p className="builder-subtitle">Collect all 5 pieces by leveling up!</p>
                </div>

                {/* Rod Preview */}
                <div className={`rod-preview ${isComplete ? 'complete' : ''} ${isPremium ? 'premium' : ''}`}>
                    {isComplete ? (
                        <motion.img
                            src="/assets/ui/rod_complete.png.jpg"
                            alt="Complete Rod"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ maxWidth: '100%', maxHeight: '250px', filter: 'drop-shadow(0 0 20px rgba(243, 156, 18, 0.5))' }}
                        />
                    ) : (
                        <svg width="150" height="280" viewBox="0 0 150 280">
                            {/* Handle */}
                            <motion.g
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <rect
                                    x="58" y="220" width="34" height="55" rx="5"
                                    fill={userStats.level >= 10 ? (isPremium ? '#DAA520' : '#8B4513') : '#222'}
                                    stroke={userStats.level >= 10 ? '#B7950B' : '#333'}
                                    strokeWidth="2"
                                />
                                {userStats.level >= 10 && (
                                    <image href="/assets/ui/rod_handle.png.jpg" x="48" y="210" width="54" height="75" />
                                )}
                            </motion.g>

                            {/* Reel */}
                            <motion.g
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {userStats.level >= 40 ? (
                                    <image href="/assets/ui/rod_reel.png.jpg" x="20" y="185" width="50" height="50" />
                                ) : (
                                    <circle
                                        cx="45" cy="210" r="22"
                                        fill="#222"
                                        stroke="#333"
                                        strokeWidth="2"
                                    />
                                )}
                            </motion.g>

                            {/* Rod Body */}
                            <motion.g
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <rect
                                    x="68" y="60" width="14" height="165" rx="3"
                                    fill={userStats.level >= 20 ? (isPremium ? '#8B4513' : '#5C4033') : '#222'}
                                    stroke={userStats.level >= 20 ? '#654321' : '#333'}
                                    strokeWidth="2"
                                />
                                {userStats.level >= 20 && (
                                    <image href="/assets/ui/rod_shaft.png.jpg" x="63" y="55" width="24" height="175" preserveAspectRatio="none" />
                                )}
                            </motion.g>

                            {/* Hook */}
                            <motion.g
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {userStats.level >= 30 ? (
                                    <image href="/assets/ui/rod_hook.png.jpg" x="60" y="10" width="30" height="40" />
                                ) : (
                                    <path
                                        d="M75 10 L75 60 M65 35 Q55 45 65 55 M85 35 Q95 45 85 55"
                                        stroke="#333"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                )}
                            </motion.g>
                        </svg>
                    )}

                    {isComplete && (
                        <motion.div
                            className="complete-badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.5 }}
                        >
                            🏴‍☠️ COMPLETE!
                        </motion.div>
                    )}
                </div>

                {/* Piece List */}
                <div className="pieces-list">
                    {ROD_PIECES.map((piece, index) => {
                        const unlocked = userStats.level >= piece.level;
                        return (
                            <motion.div
                                key={piece.id}
                                className={`piece-item ${unlocked ? 'unlocked' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <div className="piece-icon">
                                    {unlocked ? <img src={piece.image} alt={piece.name} className="piece-img" /> : <Lock size={16} />}
                                </div>
                                <div className="piece-info">
                                    <span className="piece-name">{piece.name}</span>
                                    <span className="piece-level">Level {piece.level}</span>
                                </div>
                                <div className="piece-status">
                                    {unlocked ? (
                                        <Check size={18} className="check-icon" />
                                    ) : (
                                        <span className="levels-away">
                                            {piece.level - userStats.level} levels
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Premium Upsell */}
                {!isPremium && (
                    <div className="premium-upsell">
                        <Sparkles size={16} />
                        <span>Season Pass unlocks golden rod effects!</span>
                    </div>
                )}

                {/* Close Button */}
                {onClose && (
                    <button className="close-btn" onClick={onClose}>
                        Close
                    </button>
                )}
            </motion.div>

            <style>{`
        .rod-builder-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .rod-builder-panel {
          width: 100%;
          max-width: 380px;
          background: linear-gradient(180deg, #1A252F 0%, #0D1821 100%);
          border-radius: 24px;
          padding: 24px;
          border: 3px solid #5D4E37;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .builder-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .builder-header h2 {
          color: #F4D03F;
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 4px 0;
        }

        .builder-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0;
        }

        .rod-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .rod-preview.complete.premium {
          box-shadow: 0 0 30px rgba(243, 156, 18, 0.3);
        }

        .complete-badge {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(90deg, #F39C12, #D68910);
          color: white;
          font-weight: 800;
          font-size: 14px;
          padding: 6px 16px;
          border-radius: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        .pieces-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .piece-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          opacity: 0.5;
        }

        .piece-item.unlocked {
          opacity: 1;
          border-color: rgba(39, 174, 96, 0.5);
          background: rgba(39, 174, 96, 0.1);
        }

        .piece-icon {
          width: 36px;
          height: 36px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: rgba(255, 255, 255, 0.5);
        }

        .piece-item.unlocked .piece-icon {
          background: rgba(243, 156, 18, 0.2);
        }

        .piece-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .piece-name {
          color: white;
          font-size: 13px;
          font-weight: 700;
        }

        .piece-level {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }

        .piece-status {
          display: flex;
          align-items: center;
        }

        .check-icon {
          color: #27AE60;
        }

        .levels-away {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
        }

        .premium-upsell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: linear-gradient(90deg, rgba(243, 156, 18, 0.1), rgba(243, 156, 18, 0.2));
          border: 2px solid rgba(243, 156, 18, 0.3);
          border-radius: 12px;
          color: #F4D03F;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .close-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%);
          border: 3px solid #1A5276;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 0 #0E3A5E;
        }

        .close-btn:active {
          transform: translateY(4px);
          box-shadow: none;
        }

        .piece-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
      `}</style>
        </motion.div>
    );
};

export default RodBuilder;
