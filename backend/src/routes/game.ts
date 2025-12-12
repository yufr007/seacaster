// backend/routes/game.ts
import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

router.post('/sync', async (req, res) => {
  const {
    fid,
    username,
    walletAddress,
    pfpUrl,
    inventory,
  } = req.body;

  if (!fid || !username) {
    return res.status(400).json({ error: 'fid and username required' });
  }

  // Upsert user
  const { data: user, error: userError } = await supabase
    .from('User')
    .upsert(
      {
        fid,
        username,
        walletAddress,
        pfpUrl,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'fid' }
    )
    .select()
    .single();

  if (userError || !user) {
    console.error('User upsert error', userError);
    return res.status(500).json({ error: 'Failed to sync user' });
  }

  // Upsert inventory (one row per user)
  if (inventory) {
    const { error: invError } = await supabase
      .from('Inventory')
      .upsert(
        {
          id: inventory.id ?? `inv_${fid}`,
          userId: fid,
          baits: inventory.baits,
          rods: inventory.rods,
          premiumParts: inventory.premiumParts,
          activeBaitId: inventory.activeBaitId,
          activeRodId: inventory.activeRodId,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'userId' }
      );

    if (invError) {
      console.error('Inventory upsert error', invError);
      return res.status(500).json({ error: 'Failed to sync inventory' });
    }
  }

  return res.json({ user });
});

router.post('/validate-catch', async (req, res) => {
  const {
    userId,
    fishId,
    fishName,
    rarity,
    weight,
    xpGained,
    coinsGained,
    baitUsed,
    reactionTime,
    tournamentId,
  } = req.body;

  if (!userId || !fishId || !fishName || !rarity || !baitUsed) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic sanity checks: you can extend these
  if (weight <= 0 || xpGained < 0 || coinsGained < 0) {
    return res.status(400).json({ error: 'Invalid numeric values' });
  }

  // Insert catch
  const { error: catchError } = await supabase
    .from('Catch')
    .insert({
      id: `catch_${Date.now()}_${userId}`,
      userId,
      fishId,
      fishName,
      rarity,
      weight,
      xpGained,
      coinsGained,
      baitUsed,
      reactionTime,
      tournamentId: tournamentId ?? null,
    });

  if (catchError) {
    console.error('Catch insert error', catchError);
    return res.status(500).json({ error: 'Failed to record catch' });
  }

  // Fetch current user stats first (since we don't have the RPC yet)
  const { data: currentUser, error: fetchError } = await supabase
    .from('User')
    .select('xp, coins')
    .eq('fid', userId)
    .single();

  if (fetchError) {
    console.error('User fetch error for stats update', fetchError);
  } else {
    // Update user stats client-side
    const newXp = (currentUser?.xp ?? 0) + xpGained;
    const newCoins = (currentUser?.coins ?? 0) + coinsGained;

    const { error: userError } = await supabase
      .from('User')
      .update({
        xp: newXp,
        coins: newCoins,
        updatedAt: new Date().toISOString(),
      })
      .eq('fid', userId);

    if (userError) {
      console.error('User update error', userError);
      // Still return success for the catch; stats failure is non-fatal
    }
  }

  return res.json({ ok: true });
});

router.get('/profile/:fid', async (req, res) => {
  const fid = Number(req.params.fid);
  if (!fid) return res.status(400).json({ error: 'Invalid fid' });

  const [{ data: user, error: userError }, { data: inventory, error: invError }] =
    await Promise.all([
      supabase.from('User').select('*').eq('fid', fid).single(),
      supabase.from('Inventory').select('*').eq('userId', fid).single(),
    ]);

  if (userError && userError.code !== 'PGRST116') {
    console.error('User fetch error', userError);
    return res.status(500).json({ error: 'Failed to load profile' });
  }

  if (invError && invError.code !== 'PGRST116') {
    console.error('Inventory fetch error', invError);
    return res.status(500).json({ error: 'Failed to load inventory' });
  }

  return res.json({ user, inventory });
});

export default router;
