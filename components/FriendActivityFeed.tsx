import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Fish, Flame, Users, ChevronRight } from 'lucide-react';
import { useSocial } from '../hooks/useSocial';

interface FriendActivityFeedProps {
    maxItems?: number;
    compact?: boolean;
}

const FriendActivityFeed: React.FC<FriendActivityFeedProps> = ({
    maxItems = 5,
    compact = false
}) => {
    const { activities, getTimeAgo } = useSocial();
    const displayActivities = activities.slice(0, maxItems);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'catch': return <Fish size={14} color="#3B82F6" />;
            case 'level_up': return <Zap size={14} color="#F4D03F" />;
            case 'tournament_win': return <Trophy size={14} color="#E67E22" />;
            case 'streak': return <Flame size={14} color="#E74C3C" />;
            case 'join': return <Users size={14} color="#27AE60" />;
            default: return <Fish size={14} />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'catch': return 'rgba(59, 130, 246, 0.15)';
            case 'level_up': return 'rgba(244, 208, 63, 0.15)';
            case 'tournament_win': return 'rgba(230, 126, 34, 0.15)';
            case 'streak': return 'rgba(231, 76, 60, 0.15)';
            case 'join': return 'rgba(39, 174, 96, 0.15)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    };

    if (displayActivities.length === 0) {
        return (
            <div style={styles.emptyState}>
                <Users size={32} color="rgba(255,255,255,0.3)" />
                <p style={styles.emptyText}>No friend activity yet</p>
                <p style={styles.emptySubtext}>Connect with Farcaster friends to see their catches!</p>
            </div>
        );
    }

    return (
        <div style={compact ? styles.containerCompact : styles.container}>
            {!compact && (
                <div style={styles.header}>
                    <span style={styles.headerTitle}>👥 Friend Activity</span>
                    <span style={styles.liveIndicator}>
                        <span style={styles.liveDot} />
                        Live
                    </span>
                </div>
            )}

            <AnimatePresence>
                {displayActivities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            ...styles.activityItem,
                            background: getActivityColor(activity.type),
                        }}
                    >
                        <div style={styles.iconContainer}>
                            {getActivityIcon(activity.type)}
                        </div>
                        <div style={styles.activityContent}>
                            <span style={styles.username}>{activity.username}</span>
                            <span style={styles.message}>{activity.message}</span>
                        </div>
                        <span style={styles.timestamp}>{getTimeAgo(activity.timestamp)}</span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {!compact && activities.length > maxItems && (
                <button style={styles.viewAllBtn}>
                    View all activity <ChevronRight size={14} />
                </button>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    containerCompact: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: 'white',
    },
    liveIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        color: '#27AE60',
        textTransform: 'uppercase',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#27AE60',
        boxShadow: '0 0 8px #27AE60',
        animation: 'pulse 2s infinite',
    },
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    activityContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
    },
    username: {
        fontSize: 12,
        fontWeight: 700,
        color: '#5DADE2',
    },
    message: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: 600,
    },
    viewAllBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '10px 16px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: 4,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.5)',
        margin: 0,
    },
    emptySubtext: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        margin: 0,
    },
};

export default FriendActivityFeed;
