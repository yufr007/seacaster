import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, MessageCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { Fish, Rarity } from '../types';
import { farcaster } from '../services/farcaster';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fish: Fish | null;
    isNewCatch?: boolean;
}

const RARITY_COLORS: Record<Rarity, string> = {
    [Rarity.COMMON]: '#9CA3AF',
    [Rarity.UNCOMMON]: '#4ADE80',
    [Rarity.RARE]: '#60A5FA',
    [Rarity.EPIC]: '#A78BFA',
    [Rarity.LEGENDARY]: '#FBBF24',
    [Rarity.MYTHIC]: '#F472B6',
};

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, fish, isNewCatch }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !fish) return null;

    const rarityColor = RARITY_COLORS[fish.rarity];

    // Generate share text
    const shareText = `🎣 Just caught a ${fish.rarity} ${fish.name} (${fish.weight}lb) in SeaCaster!${isNewCatch ? ' 🆕 First time!' : ''}\n\n🏴‍☠️ Think you can beat that?\n\nPlay now 👇`;
    const shareUrl = 'https://seacaster.app';

    // Share handlers
    const handleFarcasterShare = () => {
        // Use Farcaster SDK to open cast composer
        const castText = encodeURIComponent(`${shareText}\n${shareUrl}`);
        const warpcastUrl = `https://warpcast.com/~/compose?text=${castText}`;

        // Try SDK first, fallback to URL
        try {
            farcaster.openUrl(warpcastUrl);
        } catch {
            window.open(warpcastUrl, '_blank');
        }
        onClose();
    };

    const handleTwitterShare = () => {
        const tweetText = encodeURIComponent(shareText);
        const tweetUrl = encodeURIComponent(shareUrl);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
        onClose();
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                style={styles.modal}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button style={styles.closeButton} onClick={onClose}>
                    <X size={20} color="white" />
                </button>

                {/* Fish Preview Card */}
                <div style={{
                    ...styles.fishCard,
                    boxShadow: `0 0 30px ${rarityColor}40`,
                    borderColor: rarityColor,
                }}>
                    <div style={styles.fishCardInner}>
                        {isNewCatch && (
                            <motion.div
                                style={styles.newBadge}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                NEW!
                            </motion.div>
                        )}

                        <span style={styles.fishEmoji}>{fish.image}</span>

                        <div style={styles.fishInfo}>
                            <span style={{ ...styles.fishRarity, color: rarityColor }}>{fish.rarity}</span>
                            <span style={styles.fishName}>{fish.name}</span>
                            <span style={styles.fishWeight}>{fish.weight} lbs</span>
                        </div>
                    </div>
                </div>

                <h2 style={styles.title}>Share Your Catch!</h2>
                <p style={styles.subtitle}>Show off to your crew 💪</p>

                {/* Share Buttons */}
                <div style={styles.shareButtons}>
                    {/* Farcaster */}
                    <motion.button
                        style={{ ...styles.shareButton, ...styles.farcasterButton }}
                        onClick={handleFarcasterShare}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={styles.shareIcon}>
                            <MessageCircle size={24} />
                        </div>
                        <span style={styles.shareLabel}>Warpcast</span>
                    </motion.button>

                    {/* Twitter/X */}
                    <motion.button
                        style={{ ...styles.shareButton, ...styles.twitterButton }}
                        onClick={handleTwitterShare}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={styles.shareIcon}>
                            <span style={styles.xLogo}>𝕏</span>
                        </div>
                        <span style={styles.shareLabel}>Twitter</span>
                    </motion.button>

                    {/* Copy Link */}
                    <motion.button
                        style={{ ...styles.shareButton, ...styles.copyButton }}
                        onClick={handleCopyLink}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={styles.shareIcon}>
                            {copied ? <Check size={24} /> : <Copy size={24} />}
                        </div>
                        <span style={styles.shareLabel}>{copied ? 'Copied!' : 'Copy'}</span>
                    </motion.button>
                </div>

                {/* Preview Text */}
                <div style={styles.previewSection}>
                    <span style={styles.previewLabel}>Preview</span>
                    <div style={styles.previewText}>
                        {shareText.split('\n').map((line, i) => (
                            <span key={i}>{line}<br /></span>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 200,
    },
    modal: {
        width: '100%',
        maxWidth: 360,
        background: 'linear-gradient(180deg, #2C3E50 0%, #1A252F 100%)',
        borderRadius: 24,
        border: '3px solid #34495E',
        padding: 24,
        position: 'relative',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    fishCard: {
        padding: 3,
        borderRadius: 16,
        border: '3px solid',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        marginBottom: 16,
    },
    fishCardInner: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: 'linear-gradient(180deg, #1A252F, #0D1B2A)',
        borderRadius: 12,
        position: 'relative',
    },
    newBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        padding: '4px 10px',
        background: 'linear-gradient(180deg, #E74C3C, #C0392B)',
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 900,
        color: 'white',
    },
    fishEmoji: {
        fontSize: 48,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
    },
    fishInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
    },
    fishRarity: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    fishName: {
        fontSize: 18,
        fontWeight: 900,
        color: 'white',
    },
    fishWeight: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
    },
    title: {
        fontSize: 22,
        fontWeight: 900,
        color: 'white',
        margin: '0 0 4px',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        margin: '0 0 20px',
    },
    shareButtons: {
        display: 'flex',
        gap: 12,
        marginBottom: 20,
    },
    shareButton: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 14,
        borderRadius: 14,
        border: 'none',
        cursor: 'pointer',
    },
    farcasterButton: {
        background: 'linear-gradient(180deg, #8B5CF6, #6D28D9)',
    },
    twitterButton: {
        background: 'linear-gradient(180deg, #1DA1F2, #0C7ABF)',
    },
    copyButton: {
        background: 'linear-gradient(180deg, #4B5563, #374151)',
    },
    shareIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
    },
    xLogo: {
        fontSize: 24,
        fontWeight: 900,
    },
    shareLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: 'white',
    },
    previewSection: {
        textAlign: 'left',
    },
    previewLabel: {
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    previewText: {
        marginTop: 8,
        padding: 12,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.5,
    },
};

export default ShareModal;
