import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, Gift, ChevronUp, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
    isOpen: boolean;
    newLevel: number;
    rewards: {
        casts: number;
        bait: { name: string; icon: string; quantity: number } | null;
        special: string | null;
        rodPiece: { name: string; icon: string } | null;
    };
    isPremium: boolean;
    onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
    isOpen,
    newLevel,
    rewards,
    isPremium,
    onClose,
}) => {
    const [showRewards, setShowRewards] = useState(false);

    // Trigger confetti on open
    useEffect(() => {
        if (isOpen) {
            setShowRewards(false);

            // Gold confetti burst
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.4 },
                    colors: ['#F4D03F', '#F39C12', '#E67E22', '#FFD700']
                });
            }, 300);

            // Show rewards after animation
            setTimeout(() => setShowRewards(true), 1200);
        }
    }, [isOpen]);

    // Get milestone info
    const isMilestone = newLevel % 10 === 0;
    const getRodPieceInfo = () => {
        switch (newLevel) {
            case 10: return { name: 'Kraken Handle', icon: '🦑', piece: '1/5' };
            case 20: return { name: 'Barnacle Rod', icon: '⚓', piece: '2/5' };
            case 30: return { name: 'Anchor Hook', icon: '🪝', piece: '3/5' };
            case 40: return { name: 'Spyglass Reel', icon: '🔭', piece: '4/5' };
            case 50: return { name: 'Cannon Ship Animation', icon: '🏴‍☠️', piece: '5/5 COMPLETE!' };
            default: return null;
        }
    };

    const rodPiece = isPremium ? getRodPieceInfo() : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="level-up-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Animated rays behind */}
                    <motion.div
                        className="rays-bg"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Main content */}
                    <motion.div
                        className="level-up-content"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        {/* Stars decoration */}
                        <motion.div
                            className="stars-left"
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Star className="star" />
                            <Star className="star small" />
                        </motion.div>
                        <motion.div
                            className="stars-right"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Star className="star" />
                            <Star className="star small" />
                        </motion.div>

                        {/* Level Up Text */}
                        <motion.div
                            className="level-up-header"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                        >
                            <ChevronUp className="up-arrow" />
                            <h1>LEVEL UP!</h1>
                        </motion.div>

                        {/* Level Badge */}
                        <motion.div
                            className="level-badge-container"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", bounce: 0.6 }}
                        >
                            <div className={`level-badge ${isMilestone ? 'milestone' : ''}`}>
                                <span className="level-number">{newLevel}</span>
                                {isPremium && (
                                    <motion.div
                                        className="premium-crown"
                                        animate={{ rotate: [-5, 5, -5] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        👑
                                    </motion.div>
                                )}
                            </div>

                            {/* Pulse rings */}
                            <motion.div
                                className="pulse-ring"
                                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <motion.div
                                className="pulse-ring"
                                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                transition={{ duration: 1, delay: 0.5, repeat: Infinity }}
                            />
                        </motion.div>

                        {/* Rewards */}
                        <AnimatePresence>
                            {showRewards && (
                                <motion.div
                                    className="rewards-section"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <h3>REWARDS</h3>

                                    <div className="rewards-grid">
                                        {/* Casts */}
                                        <motion.div
                                            className="reward-item"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <span className="reward-icon">⚡</span>
                                            <span className="reward-value">+{rewards.casts}</span>
                                            <span className="reward-label">Casts</span>
                                        </motion.div>

                                        {/* Bait */}
                                        {rewards.bait && (
                                            <motion.div
                                                className="reward-item"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <span className="reward-icon">{rewards.bait.icon}</span>
                                                <span className="reward-value">+{rewards.bait.quantity}</span>
                                                <span className="reward-label">{rewards.bait.name}</span>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Rod Piece (Milestone) */}
                                    {rodPiece && isMilestone && (
                                        <motion.div
                                            className="rod-piece-reward"
                                            initial={{ scale: 0, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            transition={{ delay: 0.4, type: "spring" }}
                                        >
                                            <div className="rod-piece-header">
                                                <Sparkles className="sparkle" />
                                                <span>ROD PIECE UNLOCKED!</span>
                                                <Sparkles className="sparkle" />
                                            </div>
                                            <div className="rod-piece-content">
                                                <span className="rod-piece-icon">{rodPiece.icon}</span>
                                                <div className="rod-piece-info">
                                                    <span className="rod-piece-name">{rodPiece.name}</span>
                                                    <span className="rod-piece-progress">{rodPiece.piece}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Special reward text */}
                                    {rewards.special && (
                                        <motion.div
                                            className="special-reward"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <Gift className="gift-icon" />
                                            <span>{rewards.special}</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Continue Button */}
                        <motion.button
                            className="continue-btn"
                            onClick={onClose}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            AWESOME!
                        </motion.button>
                    </motion.div>

                    <style>{`
            .level-up-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.95);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              overflow: hidden;
            }

            .rays-bg {
              position: absolute;
              width: 200%;
              height: 200%;
              background: repeating-conic-gradient(
                from 0deg,
                rgba(244, 208, 63, 0.1) 0deg 10deg,
                transparent 10deg 20deg
              );
              opacity: 0.5;
            }

            .level-up-content {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 32px 24px;
              max-width: 340px;
              width: 100%;
            }

            .stars-left, .stars-right {
              position: absolute;
              top: 40px;
              display: flex;
              gap: 8px;
            }

            .stars-left { left: 20px; }
            .stars-right { right: 20px; }

            .star {
              width: 28px;
              height: 28px;
              color: #F4D03F;
              fill: #F4D03F;
              filter: drop-shadow(0 0 8px rgba(244, 208, 63, 0.6));
            }

            .star.small {
              width: 18px;
              height: 18px;
            }

            .level-up-header {
              text-align: center;
              margin-bottom: 20px;
            }

            .up-arrow {
              width: 40px;
              height: 40px;
              color: #27AE60;
              animation: bounce-up 0.5s ease-in-out infinite alternate;
            }

            @keyframes bounce-up {
              from { transform: translateY(0); }
              to { transform: translateY(-8px); }
            }

            .level-up-header h1 {
              font-family: 'Lilita One', cursive;
              font-size: 48px;
              color: #F4D03F;
              text-shadow: 
                3px 3px 0 #B7950B,
                6px 6px 0 rgba(0, 0, 0, 0.4);
              margin: 0;
              letter-spacing: 4px;
            }

            .level-badge-container {
              position: relative;
              margin-bottom: 24px;
            }

            .level-badge {
              width: 120px;
              height: 120px;
              background: linear-gradient(180deg, #5DADE2 0%, #2E86C1 50%, #1A5276 100%);
              border: 6px solid #F4D03F;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 
                0 8px 0 #C19A00,
                0 12px 30px rgba(0, 0, 0, 0.5),
                inset 0 4px 8px rgba(255, 255, 255, 0.3);
              position: relative;
            }

            .level-badge.milestone {
              background: linear-gradient(180deg, #F4D03F 0%, #D4AC0D 50%, #9A7D0A 100%);
              border-color: #FFF;
            }

            .level-number {
              font-family: 'Lilita One', cursive;
              font-size: 56px;
              color: white;
              text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
            }

            .milestone .level-number {
              color: #5D4E0D;
              text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
            }

            .premium-crown {
              position: absolute;
              top: -16px;
              font-size: 32px;
            }

            .pulse-ring {
              position: absolute;
              inset: -10px;
              border: 3px solid rgba(244, 208, 63, 0.5);
              border-radius: 50%;
            }

            .rewards-section {
              width: 100%;
              text-align: center;
              margin-bottom: 20px;
            }

            .rewards-section h3 {
              font-family: 'Lilita One', cursive;
              font-size: 18px;
              color: rgba(255, 255, 255, 0.7);
              letter-spacing: 3px;
              margin: 0 0 16px;
            }

            .rewards-grid {
              display: flex;
              justify-content: center;
              gap: 16px;
              margin-bottom: 16px;
            }

            .reward-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              padding: 16px 24px;
              background: linear-gradient(180deg, #4A6741 0%, #3D5335 100%);
              border: 3px solid #2E4228;
              border-radius: 14px;
              box-shadow: 0 4px 0 #1D2A19;
            }

            .reward-icon {
              font-size: 32px;
            }

            .reward-value {
              font-family: 'Lilita One', cursive;
              font-size: 24px;
              color: #27AE60;
            }

            .reward-label {
              font-size: 11px;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.6);
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .rod-piece-reward {
              background: linear-gradient(180deg, #F4D03F 0%, #D4AC0D 100%);
              border: 3px solid #9A7D0A;
              border-radius: 14px;
              padding: 16px;
              margin-bottom: 16px;
              box-shadow: 0 4px 0 #7D6608;
            }

            .rod-piece-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              font-family: 'Lilita One', cursive;
              font-size: 14px;
              color: #5D4E0D;
              margin-bottom: 12px;
            }

            .sparkle {
              width: 16px;
              height: 16px;
              color: #7D6608;
            }

            .rod-piece-content {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }

            .rod-piece-icon {
              font-size: 40px;
            }

            .rod-piece-info {
              display: flex;
              flex-direction: column;
              text-align: left;
            }

            .rod-piece-name {
              font-family: 'Lilita One', cursive;
              font-size: 18px;
              color: #5D4E0D;
            }

            .rod-piece-progress {
              font-size: 12px;
              font-weight: 700;
              color: #7D6608;
            }

            .special-reward {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              color: #9B59B6;
              font-weight: 700;
              font-size: 14px;
            }

            .gift-icon {
              width: 18px;
              height: 18px;
            }

            .continue-btn {
              padding: 16px 48px;
              background: linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%);
              border: 4px solid #145A32;
              border-radius: 14px;
              font-family: 'Lilita One', cursive;
              font-size: 22px;
              color: white;
              text-shadow: 2px 2px 0 #145A32;
              cursor: pointer;
              box-shadow: 0 6px 0 #0B3D20;
            }

            .continue-btn:active {
              transform: translateY(6px);
              box-shadow: none;
            }
          `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LevelUpModal;
