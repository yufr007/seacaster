import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Lock, Check, Search } from 'lucide-react';
import { FISH_TYPES } from '../constants';
import { useGameStore } from '../store/gameStore';
import { Rarity } from '../types';

interface TrophyRoomProps {
    isOpen: boolean;
    onClose: () => void;
}

const RARITY_ORDER = [Rarity.COMMON, Rarity.UNCOMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHIC];
const RARITY_COLORS: Record<Rarity, { bg: string; border: string; text: string }> = {
    [Rarity.COMMON]: { bg: '#374151', border: '#4B5563', text: '#9CA3AF' },
    [Rarity.UNCOMMON]: { bg: '#064E3B', border: '#10B981', text: '#34D399' },
    [Rarity.RARE]: { bg: '#1E3A8A', border: '#3B82F6', text: '#60A5FA' },
    [Rarity.EPIC]: { bg: '#4C1D95', border: '#8B5CF6', text: '#A78BFA' },
    [Rarity.LEGENDARY]: { bg: '#78350F', border: '#F59E0B', text: '#FCD34D' },
    [Rarity.MYTHIC]: { bg: '#831843', border: '#EC4899', text: '#F472B6' },
};

const TrophyRoom: React.FC<TrophyRoomProps> = ({ isOpen, onClose }) => {
    const { history } = useGameStore();
    const [filter, setFilter] = useState<Rarity | 'all'>('all');
    const [selectedFish, setSelectedFish] = useState<string | null>(null);

    // Get caught fish IDs
    const caughtFishIds = new Set(history.map(f => f.id));

    // Filter fish
    const displayedFish = FISH_TYPES.filter(f =>
        filter === 'all' || f.rarity === filter
    );

    // Stats
    const totalCaught = caughtFishIds.size;
    const totalFish = FISH_TYPES.length;
    const completionPercent = Math.round((totalCaught / totalFish) * 100);

    if (!isOpen) return null;

    return (
        <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                style={styles.container}
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
            >
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={20} color="white" />
                    </button>
                    <h1 style={styles.title}>🏆 TROPHY ROOM</h1>
                    <div style={styles.completion}>
                        <span style={styles.completionText}>{totalCaught}/{totalFish}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={styles.progressSection}>
                    <div style={styles.progressBar}>
                        <motion.div
                            style={styles.progressFill}
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercent}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                    <span style={styles.progressText}>{completionPercent}% Complete</span>
                </div>

                {/* Filter Tabs */}
                <div style={styles.filterRow}>
                    <button
                        style={{
                            ...styles.filterBtn,
                            ...(filter === 'all' ? styles.filterBtnActive : {}),
                        }}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    {RARITY_ORDER.map(rarity => {
                        const count = FISH_TYPES.filter(f => f.rarity === rarity).length;
                        const caught = FISH_TYPES.filter(f => f.rarity === rarity && caughtFishIds.has(f.id)).length;
                        const colors = RARITY_COLORS[rarity];

                        return (
                            <button
                                key={rarity}
                                style={{
                                    ...styles.filterBtn,
                                    ...(filter === rarity ? {
                                        background: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    } : {}),
                                }}
                                onClick={() => setFilter(rarity)}
                            >
                                {caught}/{count}
                            </button>
                        );
                    })}
                </div>

                {/* Fish Grid */}
                <div style={styles.grid}>
                    {displayedFish.map((fish, idx) => {
                        const isCaught = caughtFishIds.has(fish.id);
                        const colors = RARITY_COLORS[fish.rarity];

                        return (
                            <motion.div
                                key={fish.id}
                                style={{
                                    ...styles.fishCard,
                                    background: isCaught ? colors.bg : 'rgba(0,0,0,0.3)',
                                    borderColor: isCaught ? colors.border : 'rgba(255,255,255,0.1)',
                                    opacity: isCaught ? 1 : 0.5,
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: isCaught ? 1 : 0.5, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => isCaught && setSelectedFish(fish.id)}
                            >
                                {isCaught ? (
                                    <>
                                        <span style={styles.fishEmoji}>{fish.image}</span>
                                        <span style={{ ...styles.fishName, color: colors.text }}>
                                            {fish.name}
                                        </span>
                                        <div style={styles.caughtBadge}>
                                            <Check size={10} color="white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={styles.silhouette}>?</div>
                                        <span style={styles.fishNameHidden}>???</span>
                                        <Lock size={12} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: 6, right: 6 }} />
                                    </>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Fish Detail Modal */}
                <AnimatePresence>
                    {selectedFish && (
                        <motion.div
                            style={styles.detailOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFish(null)}
                        >
                            {(() => {
                                const fish = FISH_TYPES.find(f => f.id === selectedFish);
                                if (!fish) return null;
                                const colors = RARITY_COLORS[fish.rarity];
                                const catches = history.filter(h => h.id === fish.id);
                                const bestWeight = Math.max(...catches.map(c => c.weight));
                                const firstCatch = catches[catches.length - 1];

                                return (
                                    <motion.div
                                        style={{ ...styles.detailCard, borderColor: colors.border }}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0.8 }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div style={{ ...styles.detailHeader, background: colors.bg }}>
                                            <span style={styles.detailEmoji}>{fish.image}</span>
                                            <h2 style={{ ...styles.detailName, color: colors.text }}>{fish.name}</h2>
                                            <span style={styles.rarityBadge}>{fish.rarity}</span>
                                        </div>

                                        <div style={styles.detailBody}>
                                            <p style={styles.detailDesc}>{fish.description}</p>

                                            <div style={styles.statsGrid}>
                                                <div style={styles.statItem}>
                                                    <span style={styles.statLabel}>Times Caught</span>
                                                    <span style={styles.statValue}>{catches.length}</span>
                                                </div>
                                                <div style={styles.statItem}>
                                                    <span style={styles.statLabel}>Best Weight</span>
                                                    <span style={styles.statValue}>{bestWeight.toFixed(1)} lb</span>
                                                </div>
                                                <div style={styles.statItem}>
                                                    <span style={styles.statLabel}>Base XP</span>
                                                    <span style={styles.statValue}>{fish.xp}</span>
                                                </div>
                                                <div style={styles.statItem}>
                                                    <span style={styles.statLabel}>Catch Window</span>
                                                    <span style={styles.statValue}>{fish.catchWindow}s</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button style={styles.closeDetailBtn} onClick={() => setSelectedFish(null)}>
                                            Close
                                        </button>
                                    </motion.div>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 100,
    },
    container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #1A252F 0%, #0D1B2A 100%)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    title: {
        fontSize: 20,
        fontWeight: 900,
        color: 'white',
        letterSpacing: 2,
        margin: 0,
    },
    completion: {
        padding: '6px 12px',
        background: 'rgba(244, 208, 63, 0.2)',
        borderRadius: 8,
    },
    completionText: {
        fontSize: 14,
        fontWeight: 800,
        color: '#F4D03F',
    },
    progressSection: {
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    progressBar: {
        height: 8,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #F4D03F, #E67E22)',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    filterRow: {
        display: 'flex',
        gap: 6,
        padding: '0 16px 12px',
        overflowX: 'auto',
    },
    filterBtn: {
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
    },
    filterBtnActive: {
        background: 'rgba(52, 152, 219, 0.2)',
        borderColor: '#3498DB',
        color: '#5DADE2',
    },
    grid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        padding: 12,
        overflowY: 'auto',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    },
    fishCard: {
        aspectRatio: '1',
        borderRadius: 12,
        border: '2px solid',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        position: 'relative',
        cursor: 'pointer',
    },
    fishEmoji: {
        fontSize: 32,
    },
    fishName: {
        fontSize: 9,
        fontWeight: 700,
        textAlign: 'center',
        padding: '0 4px',
        lineHeight: 1.2,
    },
    fishNameHidden: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
    },
    silhouette: {
        fontSize: 28,
        color: 'rgba(255,255,255,0.2)',
        fontWeight: 900,
    },
    caughtBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#27AE60',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    detailCard: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 20,
        border: '4px solid',
        background: '#1A252F',
        overflow: 'hidden',
    },
    detailHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20,
        gap: 8,
    },
    detailEmoji: {
        fontSize: 64,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
    },
    detailName: {
        fontSize: 22,
        fontWeight: 900,
        margin: 0,
    },
    rarityBadge: {
        fontSize: 11,
        fontWeight: 800,
        padding: '4px 12px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        color: 'white',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailBody: {
        padding: 20,
    },
    detailDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        margin: '0 0 16px',
        lineHeight: 1.4,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    statLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        fontWeight: 700,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 900,
        color: 'white',
        marginTop: 2,
    },
    closeDetailBtn: {
        width: '100%',
        padding: 16,
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        color: 'white',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
};

export default TrophyRoom;
