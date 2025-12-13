// backend/routes/tournaments.ts
import { Router } from 'express';
import { supabase } from '../supabase';
import { tournamentService } from '../services/tournamentService';

const router = Router();

// GET /api/tournaments - Get all active tournaments
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Tournament')
            .select(`
        id,
        type,
        title,
        prizePool,
        entryFee,
        maxParticipants,
        currentParticipants,
        status,
        startTime,
        endTime
      `)
            .in('status', ['OPEN', 'LIVE'])
            .order('endTime', { ascending: true });

        if (error) throw error;

        const tournaments = (data || []).map(t => ({
            ...t,
            timeRemaining: Math.max(0, new Date(t.endTime).getTime() - Date.now()),
        }));

        res.json({ tournaments });
    } catch (error) {
        console.error('[Tournaments] List error:', error);
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
});

// GET /api/tournaments/:id - Get tournament details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data: tournament, error } = await supabase
            .from('Tournament')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get top entries
        const { data: entries, error: entriesError } = await supabase
            .from('TournamentEntry')
            .select(`
        id,
        userId,
        score,
        rank,
        User ( fid, username, pfpUrl )
      `)
            .eq('tournamentId', id)
            .order('rank', { ascending: true })
            .limit(20);

        if (entriesError) console.warn('Entries fetch error:', entriesError);

        res.json({
            tournament,
            entries: entries || [],
            timeRemaining: Math.max(0, new Date(tournament.endTime).getTime() - Date.now()),
        });
    } catch (error) {
        console.error('[Tournaments] Detail error:', error);
        res.status(500).json({ error: 'Failed to fetch tournament' });
    }
});

// POST /api/tournaments/:id/enter - Enter a tournament
router.post('/:id/enter', async (req, res) => {
    const { id } = req.params;
    const { fid, entryMethod } = req.body;

    if (!fid) {
        return res.status(400).json({ error: 'fid is required' });
    }

    try {
        // Check tournament exists and is open
        const { data: tournament, error: tError } = await supabase
            .from('Tournament')
            .select('*')
            .eq('id', id)
            .single();

        if (tError || !tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'OPEN' && tournament.status !== 'LIVE') {
            return res.status(400).json({ error: 'Tournament is not accepting entries' });
        }

        if (tournament.currentParticipants >= tournament.maxParticipants) {
            return res.status(400).json({ error: 'Tournament is full' });
        }

        // Check if already entered
        const { data: existing, error: exError } = await supabase
            .from('TournamentEntry')
            .select('id')
            .eq('tournamentId', id)
            .eq('userId', fid)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Already entered this tournament' });
        }

        // Create entry
        const { data: entry, error: entryError } = await supabase
            .from('TournamentEntry')
            .insert({
                id: `entry_${Date.now()}_${fid}`,
                tournamentId: id,
                userId: fid,
                score: 0,
                rank: tournament.currentParticipants + 1,
                entryMethod: entryMethod || 'TICKET',
            })
            .select()
            .single();

        if (entryError) throw entryError;

        // Increment participant count
        await supabase
            .from('Tournament')
            .update({ currentParticipants: tournament.currentParticipants + 1 })
            .eq('id', id);

        res.json({ entry, message: 'Successfully entered tournament' });
    } catch (error) {
        console.error('[Tournaments] Entry error:', error);
        res.status(500).json({ error: 'Failed to enter tournament' });
    }
});

// POST /api/tournaments/:id/score - Submit score
router.post('/:id/score', async (req, res) => {
    const { id } = req.params;
    const { fid, score } = req.body;

    if (!fid || score === undefined) {
        return res.status(400).json({ error: 'fid and score are required' });
    }

    try {
        // Use the tournament service for proper rank handling
        const entry = await tournamentService.submitScore(id, fid, score);
        res.json({ entry, message: 'Score submitted' });
    } catch (error: any) {
        console.error('[Tournaments] Score error:', error);
        res.status(400).json({ error: error.message || 'Failed to submit score' });
    }
});

// GET /api/tournaments/:id/leaderboard - Get tournament leaderboard
router.get('/:id/leaderboard', async (req, res) => {
    const { id } = req.params;

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
            .eq('tournamentId', id)
            .order('rank', { ascending: true })
            .limit(50);

        if (error) throw error;

        const leaderboard = (entries || []).map((e: any) => ({
            rank: e.rank,
            fid: e.User?.fid || e.userId,
            username: e.User?.username || `User #${e.userId}`,
            avatar: e.User?.pfpUrl || '',
            level: e.User?.level || 1,
            score: e.score,
            payout: e.payout || 0,
        }));

        res.json({ leaderboard });
    } catch (error) {
        console.error('[Tournaments] Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// POST /api/tournaments (Admin) - Create tournament
router.post('/', async (req, res) => {
    const { type, title, prizePool, entryFee, maxParticipants, durationMinutes } = req.body;

    // Basic validation
    if (!type || !title || !prizePool || !durationMinutes) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const tournament = await tournamentService.createTournament({
            type,
            title,
            prizePool,
            entryFee: entryFee || 0,
            maxParticipants: maxParticipants || 100,
            durationMinutes,
        });

        res.json({ tournament, message: 'Tournament created' });
    } catch (error: any) {
        console.error('[Tournaments] Create error:', error);
        res.status(500).json({ error: error.message || 'Failed to create tournament' });
    }
});

export default router;
