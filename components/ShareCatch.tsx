import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check, X, ExternalLink } from 'lucide-react';
import { Fish, Rarity } from '../types';
import { useGameStore } from '../store/gameStore';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface ShareCatchProps {
    fish: Fish;
    onClose: () => void;
}

// Blueprint: Share generates Farcaster cast with fish stats
const ShareCatch: React.FC<ShareCatchProps> = ({ fish, onClose }) => {
    const { userStats, addXP } = useGameStore();
    const [shared, setShared] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Get rarity display info
    const getRarityInfo = (rarity: Rarity) => {
        const info: Record<Rarity, { emoji: string; label: string; color: string }> = {
            [Rarity.COMMON]: { emoji: '⚪', label: 'Common', color: '#95A5A6' },
            [Rarity.UNCOMMON]: { emoji: '🟢', label: 'Uncommon', color: '#27AE60' },
            [Rarity.RARE]: { emoji: '🔵', label: 'Rare', color: '#3498DB' },
            [Rarity.EPIC]: { emoji: '🟣', label: 'Epic', color: '#9B59B6' },
            [Rarity.LEGENDARY]: { emoji: '🟡', label: 'Legendary', color: '#F39C12' },
            [Rarity.MYTHIC]: { emoji: '🔴', label: 'Mythic', color: '#E74C3C' },
        };
        return info[rarity] || info[Rarity.COMMON];
    };

    const rarityInfo = getRarityInfo(fish.rarity);

    // Generate cast text
    const generateCastText = () => {
        const weight = fish.weight.toFixed(1);
        const rarityEmoji = rarityInfo.emoji;

        // Different templates based on rarity
        if (fish.rarity === Rarity.MYTHIC) {
            return `🎉 MYTHIC CATCH! 🎉\n\nJust caught a ${weight}lb ${fish.name} ${rarityEmoji} in @seacaster!\n\nThis is incredibly rare (0.1% chance)!\n\n🎣 Play now: https://seacaster.xyz`;
        } else if (fish.rarity === Rarity.LEGENDARY) {
            return `🏆 LEGENDARY! Just caught a ${weight}lb ${fish.name} ${rarityEmoji} in @seacaster!\n\nFish, compete, win USDC 💰\n\n🎣 https://seacaster.xyz`;
        } else if (fish.rarity === Rarity.EPIC) {
            return `Just caught a ${rarityEmoji} ${fish.name} (${weight}lb) in @seacaster!\n\nLevel ${userStats.level} and climbing 📈\n\n🎣 https://seacaster.xyz`;
        } else {
            return `🎣 Just caught a ${weight}lb ${fish.name} on SeaCaster!\n\nFish on Base, win real USDC 💰\n\nhttps://seacaster.xyz`;
        }
    };

    const handleShare = async () => {
        if (shared || isSharing) return;

        setIsSharing(true);
        triggerHaptic(Haptics.medium);

        const castText = generateCastText();

        try {
            // Try Farcaster SDK first
            if (typeof window !== 'undefined' && (window as any).farcaster?.composeCast) {
                await (window as any).farcaster.composeCast({
                    text: castText,
                });
            } else {
                // Fallback: Open Warpcast intent URL
                const encodedText = encodeURIComponent(castText);
                const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}`;
                window.open(warpcastUrl, '_blank');
            }

            // Award XP bonus for sharing
            addXP(25);
            setShared(true);
            triggerHaptic(Haptics.success);

            // Close after delay
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Share failed:', error);
            triggerHaptic(Haptics.error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <motion.div
            className="share-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="share-panel"
                initial={{ y: 100, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 100, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Fish Display */}
                <div className="fish-display" style={{ borderColor: rarityInfo.color }}>
                    <div className="fish-image">
                        {fish.image.startsWith('/') ? (
                            <img src={fish.image} alt={fish.name} />
                        ) : (
                            <span className="fish-emoji">{fish.image}</span>
                        )}
                    </div>
                    <div className="fish-info">
                        <span className="fish-name">{fish.name}</span>
                        <span className="fish-rarity" style={{ color: rarityInfo.color }}>
                            {rarityInfo.emoji} {rarityInfo.label}
                        </span>
                        <span className="fish-weight">{fish.weight.toFixed(1)} lb</span>
                    </div>
                </div>

                {/* Share Preview */}
                <div className="share-preview">
                    <span className="preview-label">Share to Farcaster</span>
                    <p className="preview-text">{generateCastText()}</p>
                </div>

                {/* XP Bonus */}
                <div className="xp-bonus">
                    <span>+25 XP for sharing! ✨</span>
                </div>

                {/* Share Button */}
                <motion.button
                    className={`share-btn ${shared ? 'shared' : ''}`}
                    onClick={handleShare}
                    disabled={shared || isSharing}
                    whileTap={{ scale: shared ? 1 : 0.95 }}
                >
                    {shared ? (
                        <>
                            <Check size={20} />
                            <span>Shared! +25 XP</span>
                        </>
                    ) : isSharing ? (
                        <span>Opening Warpcast...</span>
                    ) : (
                        <>
                            <Share2 size={20} />
                            <span>Share to Farcaster</span>
                            <ExternalLink size={14} />
                        </>
                    )}
                </motion.button>
            </motion.div>

            <style>{`
        .share-overlay {
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

        .share-panel {
          position: relative;
          width: 100%;
          max-width: 360px;
          background: linear-gradient(180deg, #2C3E50 0%, #1A252F 100%);
          border-radius: 20px;
          padding: 24px;
          border: 3px solid #5D4E37;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .fish-display {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          border: 2px solid;
          margin-bottom: 16px;
        }

        .fish-image {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fish-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .fish-emoji {
          font-size: 48px;
        }

        .fish-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fish-name {
          color: white;
          font-size: 18px;
          font-weight: 800;
        }

        .fish-rarity {
          font-size: 13px;
          font-weight: 700;
        }

        .fish-weight {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .share-preview {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .preview-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .preview-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          line-height: 1.5;
          margin: 8px 0 0;
          white-space: pre-line;
        }

        .xp-bonus {
          text-align: center;
          margin-bottom: 16px;
          color: #F4D03F;
          font-size: 14px;
          font-weight: 700;
        }

        .share-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          background: linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%);
          border: 3px solid #6D28D9;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 0 #5B21B6;
        }

        .share-btn:active {
          transform: translateY(4px);
          box-shadow: none;
        }

        .share-btn.shared {
          background: linear-gradient(180deg, #27AE60 0%, #1E8449 100%);
          border-color: #196F3D;
          box-shadow: 0 4px 0 #145A32;
          cursor: default;
        }

        .share-btn:disabled {
          opacity: 0.8;
        }
      `}</style>
        </motion.div>
    );
};

export default ShareCatch;
