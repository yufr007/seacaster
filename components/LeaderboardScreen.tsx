import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, Crown, ChevronLeft, Users, Globe, Calendar, Medal } from 'lucide-react';

interface LeaderboardScreenProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId?: string;
}

type TabType = 'global' | 'weekly' | 'friends';

interface LeaderboardEntry {
    rank: number;
    username: string;
    avatar: string;
    score: number;
    level: number;
    isPremium: boolean;
    isMe: boolean;
    change: 'up' | 'down' | 'same';
}

// Premium badge images for top 3 positions
const BADGE_IMAGES: Record<number, string> = {
    1: '/assets/badges/leaderboard_badge_gold_1765863298734.png',
    2: '/assets/badges/leaderboard_badge_silver_1765863318657.png',
    3: '/assets/badges/leaderboard_badge_bronze_1765863334872.png',
};


// Simulated leaderboard data
const generateLeaderboard = (count: number, myRank: number): LeaderboardEntry[] => {
    const names = [
        'CaptainHook', 'DeepSeaDiver', 'KrakenSlayer', 'TreasureHunter',
        'WaveRider', 'SharkBait', 'CoralQueen', 'AnchorDrop', 'SaltySailor',
        'TidalWave', 'SeaWolf', 'PirateKing', 'OceanMaster', 'FishWhisperer',
        'NeptuneSon', 'MermaidFriend', 'ShellCollector', 'LobsterLord'
    ];
    const avatars = ['🏴‍☠️', '🧜‍♂️', '🦈', '🐙', '🐳', '🦀', '🐚', '⚓', '🔱', '🧜‍♀️'];
    const changes: Array<'up' | 'down' | 'same'> = ['up', 'down', 'same'];

    return Array.from({ length: count }, (_, i) => ({
        rank: i + 1,
        username: names[i % names.length] + (i > 17 ? (i - 17) : ''),
        avatar: avatars[i % avatars.length],
        score: Math.max(0, 10000 - i * 150 + Math.floor(Math.random() * 100)),
        level: Math.max(1, 50 - Math.floor(i / 2) + Math.floor(Math.random() * 10)),
        isPremium: i < 5 || Math.random() > 0.7,
        isMe: i + 1 === myRank,
        change: changes[Math.floor(Math.random() * 3)],
    }));
};

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ isOpen, onClose, tournamentId }) => {
    const { userStats } = useGameStore();
    const [activeTab, setActiveTab] = useState<TabType>('global');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [myRank] = useState(() => Math.floor(Math.random() * 50) + 10);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate leaderboard updates
    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);

        const timer = setTimeout(() => {
            setLeaderboard(generateLeaderboard(50, myRank));
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [isOpen, activeTab, myRank]);

    // Simulate real-time updates
    useEffect(() => {
        if (!isOpen || isLoading) return;

        const interval = setInterval(() => {
            setLeaderboard(prev => {
                const updated = [...prev];
                // Randomly update some scores
                for (let i = 0; i < 3; i++) {
                    const idx = Math.floor(Math.random() * updated.length);
                    if (!updated[idx].isMe) {
                        updated[idx] = {
                            ...updated[idx],
                            score: updated[idx].score + Math.floor(Math.random() * 50),
                            change: Math.random() > 0.5 ? 'up' : 'same',
                        };
                    }
                }
                // Re-sort by score
                return updated.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, isLoading]);

    if (!isOpen) return null;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'global', label: 'Global', icon: <Globe size={16} /> },
        { id: 'weekly', label: 'Weekly', icon: <Calendar size={16} /> },
        { id: 'friends', label: 'Friends', icon: <Users size={16} /> },
    ];

    const getRankStyle = (rank: number) => {
        if (rank === 1) return { bg: 'linear-gradient(180deg, #F4D03F, #D4AC0D)', color: '#5D4E0D' };
        if (rank === 2) return { bg: 'linear-gradient(180deg, #BDC3C7, #95A5A6)', color: '#2C3E50' };
        if (rank === 3) return { bg: 'linear-gradient(180deg, #D35400, #A04000)', color: 'white' };
        return { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' };
    };

    const myEntry = leaderboard.find(e => e.isMe);

    return (
        <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                style={styles.container}
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
            >
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backButton} onClick={onClose}>
                        <ChevronLeft size={24} color="white" />
                    </button>
                    <h1 style={styles.title}>
                        <Trophy size={24} color="#F4D03F" />
                        LEADERBOARD
                    </h1>
                    <div style={{ width: 44 }} />
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            style={{
                                ...styles.tab,
                                ...(activeTab === tab.id ? styles.tabActive : {}),
                            }}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Loading state */}
                {isLoading ? (
                    <div style={styles.loading}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={styles.spinner}
                        >
                            🎣
                        </motion.div>
                        <span>Loading rankings...</span>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <div style={styles.podium}>
                            {/* 2nd Place */}
                            {leaderboard[1] && (
                                <motion.div
                                    style={styles.podiumSpot}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div style={styles.podiumAvatar2}>{leaderboard[1].avatar}</div>
                                    <img src={BADGE_IMAGES[2]} alt="Silver" style={{ width: 28, height: 28, marginTop: -8 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    <span style={styles.podiumName}>{leaderboard[1].username}</span>
                                    <span style={styles.podiumScore}>{leaderboard[1].score.toLocaleString()}</span>
                                </motion.div>
                            )}

                            {/* 1st Place */}
                            {leaderboard[0] && (
                                <motion.div
                                    style={{ ...styles.podiumSpot, ...styles.podiumFirst }}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                >
                                    <img src={BADGE_IMAGES[1]} alt="Gold" style={{ width: 36, height: 36, marginBottom: 4 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    <div style={styles.podiumAvatar1}>{leaderboard[0].avatar}</div>
                                    <span style={styles.podiumName}>{leaderboard[0].username}</span>
                                    <span style={{ ...styles.podiumScore, color: '#F4D03F' }}>{leaderboard[0].score.toLocaleString()}</span>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {leaderboard[2] && (
                                <motion.div
                                    style={styles.podiumSpot}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div style={styles.podiumAvatar3}>{leaderboard[2].avatar}</div>
                                    <img src={BADGE_IMAGES[3]} alt="Bronze" style={{ width: 28, height: 28, marginTop: -8 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    <span style={styles.podiumName}>{leaderboard[2].username}</span>
                                    <span style={styles.podiumScore}>{leaderboard[2].score.toLocaleString()}</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Rankings List */}
                        <div style={styles.list}>
                            {leaderboard.slice(3).map((entry, idx) => (
                                <motion.div
                                    key={entry.rank}
                                    style={{
                                        ...styles.listItem,
                                        ...(entry.isMe ? styles.listItemMe : {}),
                                    }}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 + idx * 0.02 }}
                                >
                                    <div style={styles.rankBadge}>
                                        <span style={styles.rankNumber}>{entry.rank}</span>
                                        {entry.change === 'up' && <span style={styles.changeUp}>▲</span>}
                                        {entry.change === 'down' && <span style={styles.changeDown}>▼</span>}
                                    </div>

                                    <span style={styles.listAvatar}>{entry.avatar}</span>

                                    <div style={styles.listInfo}>
                                        <span style={styles.listName}>
                                            {entry.username}
                                            {entry.isPremium && <Crown size={12} color="#F4D03F" style={{ marginLeft: 4 }} />}
                                        </span>
                                        <span style={styles.listLevel}>Lvl {entry.level}</span>
                                    </div>

                                    <span style={styles.listScore}>{entry.score.toLocaleString()}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* My Position Footer */}
                        {myEntry && (
                            <motion.div
                                style={styles.myPosition}
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                            >
                                <div style={styles.myPositionContent}>
                                    <span style={styles.myRank}>#{myEntry.rank}</span>
                                    <span style={styles.myLabel}>Your Position</span>
                                    <span style={styles.myScore}>{myEntry.score.toLocaleString()} pts</span>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
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
        padding: '16px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 20,
        fontWeight: 900,
        color: 'white',
        letterSpacing: 2,
        margin: 0,
    },
    tabs: {
        display: 'flex',
        gap: 8,
        padding: '0 16px 12px',
    },
    tab: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 10,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
    },
    tabActive: {
        background: 'linear-gradient(180deg, #3498DB, #2980B9)',
        borderColor: '#1A5276',
        color: 'white',
    },
    loading: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    spinner: {
        fontSize: 40,
    },
    podium: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 12,
        padding: '12px 16px 20px',
    },
    podiumSpot: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 90,
    },
    podiumFirst: {
        marginBottom: 20,
    },
    podiumAvatar1: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #F4D03F, #D4AC0D)',
        border: '4px solid #9A7D0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        boxShadow: '0 0 20px rgba(244, 208, 63, 0.5)',
    },
    podiumAvatar2: {
        width: 54,
        height: 54,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #BDC3C7, #95A5A6)',
        border: '3px solid #7F8C8D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
    },
    podiumAvatar3: {
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #D35400, #A04000)',
        border: '3px solid #7E3200',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
    },
    podiumName: {
        fontSize: 11,
        fontWeight: 700,
        color: 'white',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 80,
    },
    podiumScore: {
        fontSize: 12,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.8)',
    },
    list: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 12px',
        paddingBottom: 80,
    },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        marginBottom: 6,
        border: '1px solid rgba(255,255,255,0.05)',
    },
    listItemMe: {
        background: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 0.5)',
    },
    rankBadge: {
        width: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
    },
    rankNumber: {
        fontSize: 14,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.6)',
    },
    changeUp: { fontSize: 8, color: '#27AE60' },
    changeDown: { fontSize: 8, color: '#E74C3C' },
    listAvatar: {
        fontSize: 24,
    },
    listInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    listName: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: 'white',
    },
    listLevel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
    },
    listScore: {
        fontSize: 14,
        fontWeight: 800,
        color: '#F4D03F',
    },
    myPosition: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, transparent, rgba(10, 22, 40, 0.98) 30%)',
        padding: '24px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    },
    myPositionContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(180deg, #3498DB, #2980B9)',
        borderRadius: 14,
        border: '2px solid #1A5276',
    },
    myRank: {
        fontSize: 24,
        fontWeight: 900,
        color: 'white',
    },
    myLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 600,
    },
    myScore: {
        fontSize: 16,
        fontWeight: 800,
        color: '#F4D03F',
    },
};

export default LeaderboardScreen;
