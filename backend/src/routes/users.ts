// backend/routes/users.ts
import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET /api/users/:fid - Get user profile
router.get('/:fid', async (req, res) => {
    const fid = parseInt(req.params.fid);

    if (!fid || isNaN(fid)) {
        return res.status(400).json({ error: 'Invalid fid' });
    }

    try {
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('fid', fid)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get catch stats
        const { data: catches, error: catchError } = await supabase
            .from('Catch')
            .select('rarity, xpGained, weight')
            .eq('userId', fid);

        if (catchError) console.warn('Catch fetch error:', catchError);

        const stats = {
            totalCatches: catches?.length || 0,
            legendariesCaught: catches?.filter(c => c.rarity === 'LEGENDARY' || c.rarity === 'MYTHIC').length || 0,
            totalXpEarned: catches?.reduce((sum, c) => sum + (c.xpGained || 0), 0) || 0,
            heaviestCatch: Math.max(...(catches?.map(c => c.weight || 0) || [0])),
        };

        res.json({ user, stats });
    } catch (error) {
        console.error('[Users] Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/users - Create or update user
router.post('/', async (req, res) => {
    const { fid, username, walletAddress, pfpUrl } = req.body;

    if (!fid) {
        return res.status(400).json({ error: 'fid is required' });
    }

    try {
        const { data, error } = await supabase
            .from('User')
            .upsert({
                fid,
                username: username || `User #${fid}`,
                walletAddress,
                pfpUrl,
                updatedAt: new Date().toISOString(),
            }, { onConflict: 'fid' })
            .select()
            .single();

        if (error) throw error;

        res.json({ user: data });
    } catch (error) {
        console.error('[Users] Create/update error:', error);
        res.status(500).json({ error: 'Failed to create/update user' });
    }
});

// POST /api/users/:fid/xp - Award XP to user
router.post('/:fid/xp', async (req, res) => {
    const fid = parseInt(req.params.fid);
    const { amount, reason } = req.body;

    if (!fid || isNaN(fid)) {
        return res.status(400).json({ error: 'Invalid fid' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Valid positive amount required' });
    }

    try {
        // Fetch current XP
        const { data: user, error: fetchError } = await supabase
            .from('User')
            .select('xp, level')
            .eq('fid', fid)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const currentXp = user?.xp || 0;
        const currentLevel = user?.level || 1;
        const newXp = currentXp + amount;

        // Calculate new level (exponential: 100 * 1.4^level)
        let newLevel = currentLevel;
        const calcXpForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.4, lvl - 1));
        while (newXp >= calcXpForLevel(newLevel + 1) && newLevel < 100) {
            newLevel++;
        }

        const { data, error } = await supabase
            .from('User')
            .update({
                xp: newXp,
                level: newLevel,
                updatedAt: new Date().toISOString(),
            })
            .eq('fid', fid)
            .select()
            .single();

        if (error) throw error;

        res.json({
            user: data,
            xpAwarded: amount,
            leveledUp: newLevel > currentLevel,
            reason: reason || 'unspecified',
        });
    } catch (error) {
        console.error('[Users] XP award error:', error);
        res.status(500).json({ error: 'Failed to award XP' });
    }
});

// GET /api/users/:fid/inventory - Get user inventory
router.get('/:fid/inventory', async (req, res) => {
    const fid = parseInt(req.params.fid);

    if (!fid || isNaN(fid)) {
        return res.status(400).json({ error: 'Invalid fid' });
    }

    try {
        const { data, error } = await supabase
            .from('Inventory')
            .select('*')
            .eq('userId', fid)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Return default inventory if none exists
        const inventory = data || {
            baits: { basic: 100, shiny: 5, premium: 0 },
            rods: ['basic'],
            premiumParts: 0,
            activeBaitId: 'basic',
            activeRodId: 'basic',
        };

        res.json({ inventory });
    } catch (error) {
        console.error('[Users] Inventory error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// GET /api/users/:fid/catches - Get user's catch history
router.get('/:fid/catches', async (req, res) => {
    const fid = parseInt(req.params.fid);
    const limit = parseInt(req.query.limit as string) || 50;

    if (!fid || isNaN(fid)) {
        return res.status(400).json({ error: 'Invalid fid' });
    }

    try {
        const { data, error } = await supabase
            .from('Catch')
            .select('*')
            .eq('userId', fid)
            .order('createdAt', { ascending: false })
            .limit(Math.min(limit, 100));

        if (error) throw error;

        res.json({ catches: data || [] });
    } catch (error) {
        console.error('[Users] Catches error:', error);
        res.status(500).json({ error: 'Failed to fetch catches' });
    }
});

// GET /api/users/:fid/tournaments - Get user's tournament history
router.get('/:fid/tournaments', async (req, res) => {
    const fid = parseInt(req.params.fid);

    if (!fid || isNaN(fid)) {
        return res.status(400).json({ error: 'Invalid fid' });
    }

    try {
        const { data, error } = await supabase
            .from('TournamentEntry')
            .select(`
        id,
        score,
        rank,
        payout,
        createdAt,
        Tournament ( id, title, type, status, prizePool, endTime )
      `)
            .eq('userId', fid)
            .order('createdAt', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json({ tournaments: data || [] });
    } catch (error) {
        console.error('[Users] Tournaments error:', error);
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
});

export default router;
