import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socket';

interface FriendActivity {
    id: string;
    fid: number;
    username: string;
    avatar: string;
    type: 'catch' | 'level_up' | 'tournament_win' | 'streak' | 'join';
    message: string;
    data?: {
        fish?: string;
        rarity?: string;
        level?: number;
        prize?: number;
    };
    timestamp: number;
}

interface ReferralStats {
    code: string;
    totalReferrals: number;
    pendingReferrals: number;
    earnedXp: number;
    earnedCoins: number;
    referredUsers: { fid: number; username: string; level: number }[];
}

// Generate unique referral code from FID
const generateReferralCode = (fid: number): string => {
    const base = 'SEACAST';
    const hash = fid.toString(36).toUpperCase();
    return `${base}-${hash}`;
};

// Simulated friend activities for demo
const generateMockActivities = (): FriendActivity[] => {
    const friends = [
        { fid: 1001, username: '@pirate_king', avatar: '' },
        { fid: 1002, username: '@fisher_joe', avatar: '' },
        { fid: 1003, username: '@sea_master', avatar: '' },
        { fid: 1004, username: '@whale_hunter', avatar: '' },
    ];

    const activities: FriendActivity[] = [
        {
            id: '1',
            ...friends[0],
            type: 'catch',
            message: 'caught a Legendary Megalodon!',
            data: { fish: 'Megalodon', rarity: 'LEGENDARY' },
            timestamp: Date.now() - 120000,
        },
        {
            id: '2',
            ...friends[1],
            type: 'level_up',
            message: 'reached Level 40!',
            data: { level: 40 },
            timestamp: Date.now() - 300000,
        },
        {
            id: '3',
            ...friends[2],
            type: 'tournament_win',
            message: 'won Daily Tournament - 1st place!',
            data: { prize: 5.00 },
            timestamp: Date.now() - 600000,
        },
        {
            id: '4',
            ...friends[3],
            type: 'streak',
            message: 'completed a 7-day streak! 🔥',
            timestamp: Date.now() - 3600000,
        },
    ];

    return activities;
};

export const useSocial = () => {
    const { userStats } = useGameStore();
    const [activities, setActivities] = useState<FriendActivity[]>(generateMockActivities());
    const [referralStats, setReferralStats] = useState<ReferralStats>({
        code: generateReferralCode(userStats.fid || 12345),
        totalReferrals: 0,
        pendingReferrals: 0,
        earnedXp: 0,
        earnedCoins: 0,
        referredUsers: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    // Listen for real-time friend activities via Socket.IO
    useEffect(() => {
        socketService.connect();

        const handleFriendActivity = (activity: FriendActivity) => {
            setActivities(prev => [activity, ...prev.slice(0, 19)]);
        };

        // @ts-ignore - Socket event listener
        socketService.socket?.on('friend_activity', handleFriendActivity);

        return () => {
            // @ts-ignore
            socketService.socket?.off('friend_activity', handleFriendActivity);
        };
    }, []);

    // Simulate periodic activity updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Random activity simulation
            if (Math.random() > 0.8) {
                const friends = ['@crypto_fish', '@base_whale', '@farcaster_pro'];
                const types: FriendActivity['type'][] = ['catch', 'level_up', 'streak'];
                const type = types[Math.floor(Math.random() * types.length)];

                const newActivity: FriendActivity = {
                    id: Date.now().toString(),
                    fid: 1000 + Math.floor(Math.random() * 100),
                    username: friends[Math.floor(Math.random() * friends.length)],
                    avatar: '',
                    type,
                    message: type === 'catch' ? 'caught an Epic fish!' :
                        type === 'level_up' ? `reached Level ${10 + Math.floor(Math.random() * 40)}!` :
                            'completed a daily streak!',
                    timestamp: Date.now(),
                };

                setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
            }
        }, 15000); // Every 15 seconds

        return () => clearInterval(interval);
    }, []);

    // Apply referral code (for referred user)
    const applyReferralCode = useCallback(async (code: string) => {
        setIsLoading(true);
        try {
            // In production: POST /api/referral/apply
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Grant rewards
            useGameStore.setState(state => ({
                userStats: {
                    ...state.userStats,
                    xp: state.userStats.xp + 50,
                    castsRemaining: state.userStats.castsRemaining + 5,
                }
            }));

            return { success: true, message: 'Referral applied! +50 XP, +5 Casts' };
        } catch (error) {
            return { success: false, message: 'Invalid referral code' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check referral when friend reaches Level 5
    const checkReferralMilestone = useCallback(async (referredFid: number) => {
        // In production: GET /api/referral/check/:fid
        // If friend reached Level 5, credit referrer
        setReferralStats(prev => ({
            ...prev,
            totalReferrals: prev.totalReferrals + 1,
            pendingReferrals: Math.max(0, prev.pendingReferrals - 1),
            earnedXp: prev.earnedXp + 50,
            earnedCoins: prev.earnedCoins + 25,
        }));
    }, []);

    // Share referral code
    const shareReferralCode = useCallback(() => {
        const shareUrl = `https://seacaster.app?ref=${referralStats.code}`;
        const text = `Join me fishing on SeaCaster! Use my code ${referralStats.code} for bonus rewards 🎣`;

        // Try native share, fallback to clipboard
        if (navigator.share) {
            navigator.share({ title: 'SeaCaster Referral', text, url: shareUrl });
        } else {
            navigator.clipboard.writeText(`${text}\n${shareUrl}`);
            return 'Invite link copied to clipboard!';
        }
        return null;
    }, [referralStats.code]);

    // Get activity time ago string
    const getTimeAgo = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    return {
        // Friend Activity Feed
        activities,
        getTimeAgo,

        // Referral System
        referralStats,
        referralCode: referralStats.code,
        applyReferralCode,
        checkReferralMilestone,
        shareReferralCode,

        isLoading,
    };
};
