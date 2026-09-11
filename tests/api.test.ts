import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { privateKeyToAccount } from 'viem/accounts';
import { newReel, stepReel } from '../game/engine.ts';
import { createApp, initializeDatabase } from '../backend/src/app.ts';

// Disposable fixtures only, never deployment identities or keys.
const signer = privateKeyToAccount(`0x${'11'.repeat(32)}`);
const other: `0x${string}` = `0x${'22'.repeat(20)}`;
const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const origin = 'http://localhost:5173';

test('API trusts Supabase identity, rejects forged access, uses PostgreSQL, and awards catches once', { timeout: 30000 }, async t => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required; do not silently skip API verification');
  assert.ok(new URL(process.env.DATABASE_URL).pathname.endsWith('_test'), 'Use a disposable database ending in _test');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await initializeDatabase(pool); await pool.query('TRUNCATE players CASCADE');

  const verifyAccessToken = async (token: string) => {
    if (token === 'valid-token') return { userId, address: signer.address.toLowerCase() };
    if (token === 'other-token') return { userId: otherUserId, address: other.toLowerCase() };
    return null;
  };
  const app = createApp(pool, { origin, chainId: 84532, secure: false }, verifyAccessToken);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as { port: number }).port;
  t.after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); await pool.end(); });

  async function request(path: string, body?: unknown, token: string | null = 'valid-token', requestOrigin = origin, forgedWallet?: string) {
    const headers: Record<string, string> = { Origin: requestOrigin, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (forgedWallet) headers['X-Seacaster-Wallet'] = forgedWallet;
    const result = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? 'GET' : 'POST', headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: result.status, data: await result.json(), headers: result.headers };
  }

  assert.equal((await request('/me', undefined, null)).status, 401);
  assert.equal((await request('/me', undefined, 'forged-token')).status, 401);
  assert.equal((await request('/casts', { fid: 1, premium: true }, null)).status, 401);
  assert.equal((await request('/casts', {}, 'valid-token', 'https://attacker.invalid')).status, 403);

  const login = await request('/me');
  assert.equal(login.status, 200); assert.equal(login.data.address, signer.address.toLowerCase());
  assert.equal(login.data.profile.coins, 100); assert.equal('premium' in login.data.profile, false);

  // A client-supplied wallet header cannot change the Supabase-authenticated identity.
  const forged = await request('/me', undefined, 'valid-token', origin, other);
  assert.equal(forged.status, 200); assert.equal(forged.data.address, signer.address.toLowerCase());

  assert.equal((await request('/tackle', { action: 'buy', id: 'shrimp', price: -100000 })).data.profile.coins, 60);
  assert.equal((await request('/platform', { id: 'yacht', totalCatches: 999 })).status, 400);
  assert.equal((await request('/platform', { id: 'unknown' })).status, 400);
  assert.equal((await request('/platform', { id: 'pier' })).data.profile.platform, 'pier');

  const started = await request('/casts', {});
  assert.equal((await request('/platform', { id: 'pier' })).status, 409);
  assert.equal(started.status, 200); assert.equal('catch' in started.data.cast, false);
  assert.equal((await request(`/casts/${started.data.cast.id}/hook`, {})).status, 400);
  await pool.query("UPDATE players SET active_cast=jsonb_set(jsonb_set(active_cast,'{biteAt}',to_jsonb($1::bigint)),'{expiresAt}',to_jsonb($2::bigint)) WHERE auth_user_id=$3", [Date.now() - 10, Date.now() + 3000, userId]);

  const hooked = await request(`/casts/${started.data.cast.id}/hook`, {});
  assert.equal(hooked.status, 200);
  let reel = newReel(), hold = true;
  const inputs = [{ at: 0, hold }];
  while (reel.status === 'playing') {
    const next: boolean = reel.tension > .7 ? false : reel.tension < .35 ? true : hold;
    if (next !== hold) { hold = next; inputs.push({ at: reel.elapsed, hold }); }
    reel = stepReel(reel, hold, hooked.data.seed);
  }
  assert.equal(reel.status, 'won');
  const payload = { inputs, duration: reel.elapsed, speciesId: 'f15', weight: 1e9, xp: 1e9 };
  assert.equal((await request(`/casts/${started.data.cast.id}/finish`, payload)).status, 400);
  await pool.query("UPDATE players SET active_cast=jsonb_set(active_cast,'{hookedAt}',to_jsonb($1::bigint)) WHERE auth_user_id=$2", [Date.now() - reel.elapsed - 100, userId]);
  const [a, b] = await Promise.all([request(`/casts/${started.data.cast.id}/finish`, payload), request(`/casts/${started.data.cast.id}/finish`, payload)]);
  assert.equal(a.status, 200); assert.equal(b.status, 200);

  const me = await request('/me'); assert.equal(me.data.profile.totalCatches, 1); assert.ok(me.data.profile.xp < 1000);
  assert.equal((await request('/leaderboard')).data.players.length, 1);

  const second = await request('/me', undefined, 'other-token');
  assert.equal(second.status, 200); assert.equal(second.data.address, other.toLowerCase()); assert.equal(second.data.profile.totalCatches, 0);
  assert.equal((await request('/me', undefined, 'expired-token')).status, 401);
});
