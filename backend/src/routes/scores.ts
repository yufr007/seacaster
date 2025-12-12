import type { Express, Request, Response } from 'express';
import { supabase } from '../supabase';

export function registerScoreRoutes(app: Express) {
    app.post('/api/scores', async (req: Request, res: Response) => {
        const { address, score } = req.body;

        if (!address || typeof score !== 'number') {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const { error } = await supabase
            .from('scores')
            .insert({ address, score });

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Failed to save score' });
        }

        return res.status(201).json({ ok: true });
    });

    app.get('/api/leaderboard', async (_req: Request, res: Response) => {
        const { data, error } = await supabase
            .from('scores')
            .select('address, score, created_at')
            .order('score', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Supabase select error:', error);
            return res.status(500).json({ error: 'Failed to load leaderboard' });
        }

        return res.json({ leaderboard: data });
    });
}
