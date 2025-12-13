import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Crown, Trophy, Fish, Flame, Star, Lock, Check } from 'lucide-react';

interface ProfileScreenProps {
    isOpen: boolean;
    onClose: () => void;
}

// Rod pieces unlock at specific levels
const ROD_PIECES = [
    { id: 1, name: 'Kraken Handle', icon: '🦑', level: 10, description: 'Grip of the deep' },
    { id: 2, name: 'Barnacle Rod', icon: '⚓', level: 20, description: 'Encrusted strength' },
    { id: 3, name: 'Anchor Hook', icon: '🪝', level: 30, description: 'Never lets go' },
    { id: 4, name: 'Spyglass Reel', icon: '🔭', level: 40, description: 'See the catch coming' },
    { id: 5, name: 'Pirate Cannon', icon: '🏴‍☠️', level: 50, description: 'Ultimate power!' },
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ isOpen, onClose }) => {
    const { userStats, history } = useGameStore();

    if (!isOpen) return null;

    // Calculate stats
    const totalFish = history.length;
    const uniqueFish = new Set(history.map(f => f.id)).size;
    const bestCatch = history.reduce((best, fish) =>
        (fish.weight > (best?.weight || 0)) ? fish : best, history[0]);
    const unlockedPieces = ROD_PIECES.filter(p => userStats.level >= p.level).length;

    // XP progress
    const LEVEL_BASE_XP = 100;
    const LEVEL_EXPONENT = 1.4;
    const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
    const xpProgress = (userStats.xp / nextLevelXp) * 100;

    return (
        <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                style={styles.modal}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
            >
                {/* Close Button */}
                <button style={styles.closeButton} onClick={onClose}>
                    <X size={24} color="white" />
                </button>

                {/* Profile Header */}
                <div style={styles.header}>
                    {/* Avatar */}
                    <div style={styles.avatarContainer}>
                        <div style={styles.avatar}>
                            <span style={styles.avatarEmoji}>🎣</span>
                        </div>
                        {userStats.premium && (
                            <div style={styles.premiumBadge}>
                                <Crown size={14} color="#F4D03F" fill="#F4D03F" />
                            </div>
                        )}
                        <div style={styles.levelRing}>
                            <svg width="100" height="100" style={{ position: 'absolute', top: -6, left: -6 }}>
                                <circle
                                    cx="50" cy="50" r="46"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="6"
                                />
                                <motion.circle
                                    cx="50" cy="50" r="46"
                                    fill="none"
                                    stroke="#27AE60"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 46}`}
                                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - xpProgress / 100)}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - xpProgress / 100) }}
                                    transition={{ duration: 1 }}
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                />
                            </svg>
                        </div>
                    </div>

                    <h2 style={styles.username}>{userStats.username || 'Pirate Fisher'}</h2>
                    <div style={styles.levelBadge}>
                        <span style={styles.levelText}>Level {userStats.level}</span>
                        {userStats.premium && <span style={styles.premiumText}>PREMIUM</span>}
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <Fish size={24} color="#3498DB" />
                        <span style={styles.statValue}>{totalFish}</span>
                        <span style={styles.statLabel}>Total Catches</span>
                    </div>
                    <div style={styles.statCard}>
                        <Star size={24} color="#F4D03F" />
                        <span style={styles.statValue}>{uniqueFish}</span>
                        <span style={styles.statLabel}>Unique Fish</span>
                    </div>
                    <div style={styles.statCard}>
                        <Flame size={24} color="#E67E22" />
                        <span style={styles.statValue}>{userStats.streak}</span>
                        <span style={styles.statLabel}>Day Streak</span>
                    </div>
                    <div style={styles.statCard}>
                        <Trophy size={24} color="#9B59B6" />
                        <span style={styles.statValue}>{bestCatch?.weight?.toFixed(1) || '0'}lb</span>
                        <span style={styles.statLabel}>Best Catch</span>
                    </div>
                </div>

                {/* Rod Building Progress */}
                <div style={styles.rodSection}>
                    <h3 style={styles.sectionTitle}>
                        🏴‍☠️ PIRATE ROD ({unlockedPieces}/5)
                    </h3>

                    <div style={styles.rodProgress}>
                        {ROD_PIECES.map((piece, idx) => {
                            const isUnlocked = userStats.level >= piece.level;
                            const isCurrent = userStats.level >= piece.level &&
                                (idx === 4 || userStats.level < ROD_PIECES[idx + 1]?.level);

                            return (
                                <motion.div
                                    key={piece.id}
                                    style={{
                                        ...styles.rodPiece,
                                        ...(isUnlocked ? styles.rodPieceUnlocked : {}),
                                        ...(isCurrent ? styles.rodPieceCurrent : {}),
                                    }}
                                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <span style={styles.pieceIcon}>{piece.icon}</span>
                                    <div style={styles.pieceInfo}>
                                        <span style={styles.pieceName}>{piece.name}</span>
                                        <span style={styles.pieceLevel}>
                                            {isUnlocked ? (
                                                <><Check size={12} color="#27AE60" /> Unlocked</>
                                            ) : (
                                                <><Lock size={12} color="#7F8C8D" /> Lvl {piece.level}</>
                                            )}
                                        </span>
                                    </div>
                                    {isUnlocked && (
                                        <div style={styles.checkCircle}>
                                            <Check size={14} color="white" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div style={styles.rodProgressBar}>
                        <motion.div
                            style={styles.rodProgressFill}
                            initial={{ width: 0 }}
                            animate={{ width: `${(unlockedPieces / 5) * 100}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                </div>

                {/* XP to Next Level */}
                <div style={styles.xpSection}>
                    <span style={styles.xpLabel}>
                        {userStats.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                    </span>
                    <div style={styles.xpBar}>
                        <motion.div
                            style={{ ...styles.xpFill, width: `${xpProgress}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                        />
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
        padding: 16,
        zIndex: 100,
    },
    modal: {
        width: '100%',
        maxWidth: 380,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #2C3E50 0%, #1A252F 100%)',
        borderRadius: 24,
        border: '4px solid #34495E',
        padding: 24,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'linear-gradient(180deg, #E74C3C, #C0392B)',
        border: '2px solid #922B21',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #3498DB, #2980B9)',
        border: '4px solid #1A5276',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 40,
    },
    premiumBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #F4D03F, #D4AC0D)',
        border: '2px solid #9A7D0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelRing: {
        position: 'absolute',
        inset: -6,
    },
    username: {
        fontSize: 22,
        fontWeight: 900,
        color: 'white',
        margin: 0,
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    levelBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    levelText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 700,
    },
    premiumText: {
        fontSize: 10,
        color: '#F4D03F',
        fontWeight: 800,
        background: 'rgba(244, 208, 63, 0.2)',
        padding: '2px 8px',
        borderRadius: 4,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 12,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 900,
        color: 'white',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 600,
        textTransform: 'uppercase',
    },
    rodSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 800,
        color: '#F4D03F',
        letterSpacing: 1,
        marginBottom: 12,
        textAlign: 'center',
    },
    rodProgress: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    rodPiece: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        border: '2px solid rgba(255,255,255,0.1)',
        opacity: 0.5,
    },
    rodPieceUnlocked: {
        opacity: 1,
        background: 'rgba(39, 174, 96, 0.1)',
        borderColor: 'rgba(39, 174, 96, 0.3)',
    },
    rodPieceCurrent: {
        borderColor: '#F4D03F',
        boxShadow: '0 0 15px rgba(244, 208, 63, 0.3)',
    },
    pieceIcon: {
        fontSize: 28,
    },
    pieceInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    pieceName: {
        fontSize: 14,
        fontWeight: 700,
        color: 'white',
    },
    pieceLevel: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: '#27AE60',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rodProgressBar: {
        height: 8,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginTop: 12,
        overflow: 'hidden',
    },
    rodProgressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #27AE60, #58D68D)',
        borderRadius: 4,
    },
    xpSection: {
        textAlign: 'center',
    },
    xpLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
        marginBottom: 6,
        display: 'block',
    },
    xpBar: {
        height: 12,
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    xpFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #9B59B6, #8E44AD)',
        borderRadius: 6,
    },
};

export default ProfileScreen;
