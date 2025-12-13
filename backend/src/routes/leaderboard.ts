// backend/routes/leaderboard.ts
import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET /api/leaderboard/global - Top 100 all-time
router.get('/global', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('User')
            .select('fid, username, pfpUrl, xp, level, coins')
            .order('xp', { ascending: false })
            .limit(100);

        if (error) throw error;

        const leaderboard = data.map((user, index) => ({
            rank: index + 1,
            fid: user.fid,
            username: user.username || `User #${user.fid}`,
            avatar: user.pfpUrl || '',
            xp: user.xp || 0,
            level: user.level || 1,
            score: user.xp || 0, // Using XP as score for global
        }));

        res.json({ leaderboard, type: 'global' });
    } catch (error) {
        console.error('[Leaderboard] Global error:', error);
        res.status(500).json({ error: 'Failed to fetch global leaderboard' });
    }
});

// GET /api/leaderboard/weekly - This week's top 50
router.get('/weekly', async (req, res) => {
    try {
        // Get catches from this week
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('Catch')
            .select('userId, xpGained, coinsGained')
            .gte('createdAt', oneWeekAgo);

        if (error) throw error;

        // Aggregate scores by user
        const userScores: Record<number, { totalXp: number; catches: number }> = {};

        for (const catch_ of data || []) {
            if (!userScores[catch_.userId]) {
                userScores[catch_.userId] = { totalXp: 0, catches: 0 };
            }
            userScores[catch_.userId].totalXp += catch_.xpGained || 0;
            userScores[catch_.userId].catches += 1;
        }

        // Get user details for top scorers
        const sortedUsers = Object.entries(userScores)
            .sort((a, b) => b[1].totalXp - a[1].totalXp)
            .slice(0, 50);

        const fids = sortedUsers.map(([fid]) => parseInt(fid));

        const { data: users, error: usersError } = await supabase
            .from('User')
            .select('fid, username, pfpUrl, level')
            .in('fid', fids);

        if (usersError) throw usersError;

        const userMap = new Map((users || []).map(u => [u.fid, u]));

        const leaderboard = sortedUsers.map(([fid, stats], index) => {
            const user = userMap.get(parseInt(fid));
            return {
                rank: index + 1,
                fid: parseInt(fid),
                username: user?.username || `User #${fid}`,
                avatar: user?.pfpUrl || '',
                level: user?.level || 1,
                score: stats.totalXp,
                catches: stats.catches,
            };
        });

        res.json({ leaderboard, type: 'weekly' });
    } catch (error) {
        console.error('[Leaderboard] Weekly error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
    }
});

// GET /api/leaderboard/friends/:fid - Friend rankings (mock - needs follow data)
router.get('/friends/:fid', async (req, res) => {
    const fid = parseInt(req.params.fid);

    if (!fid || isNaN(fid)) {
        return res.status(400).json({ error: 'Invalid fid' });
    }

    try {
        // For now, return random subset of users as "friends"
        // In production, integrate with Farcaster social graph API
        const { data, error } = await supabase
            .from('User')
            .select('fid, username, pfpUrl, xp, level')
            .order('xp', { ascending: false })
            .limit(20);

        if (error) throw error;

        const leaderboard = (data || []).map((user, index) => ({
            rank: index + 1,
            fid: user.fid,
            username: user.username || `User #${user.fid}`,
            avatar: user.pfpUrl || '',
            level: user.level || 1,
            score: user.xp || 0,
            isSelf: user.fid === fid,
        }));

        res.json({ leaderboard, type: 'friends' });
    } catch (error) {
        console.error('[Leaderboard] Friends error:', error);
        res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
    }
});

// GET /api/leaderboard/tournament/:tournamentId - Tournament rankings
router.get('/tournament/:tournamentId', async (req, res) => {
    const { tournamentId } = req.params;

    try {
        const { data: entries, error } = await supabase
            .from('TournamentEntry')
            .select(`
        id,
        userId,
        score,
        rank,
        payout,
        User ( fid, username, pfpUrl, level )
      `)
            .eq('tournamentId', tournamentId)
            .order('rank', { ascending: true })
            .limit(50);

        if (error) throw error;

        const leaderboard = (entries || []).map((entry: any) => ({
            rank: entry.rank,
            fid: entry.User?.fid || entry.userId,
            username: entry.User?.username || `User #${entry.userId}`,
            avatar: entry.User?.pfpUrl || '',
            level: entry.User?.level || 1,
            score: entry.score,
            payout: entry.payout || 0,
        }));

        res.json({ leaderboard, type: 'tournament', tournamentId });
    } catch (error) {
        console.error('[Leaderboard] Tournament error:', error);
        res.status(500).json({ error: 'Failed to fetch tournament leaderboard' });
    }
});

export default router;
