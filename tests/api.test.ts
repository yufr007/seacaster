import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { privateKeyToAccount } from 'viem/accounts';
import { parseSiweMessage } from 'viem/siwe';
import { verifyMessage } from 'viem';
import { createApp, initializeDatabase } from '../backend/src/app.ts';
import { newReel, stepReel } from '../game/engine.ts';
// Disposable test fixture only; never a deployment key.
const signer = privateKeyToAccount(`0x${'11'.repeat(32)}`);
const other = `0x${'22'.repeat(20)}`;
const origin = 'http://localhost:5173';
test('API rejects forged identity and replays, uses real PostgreSQL, and awards catches once', { timeout: 30000 }, async t => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required; do not silently skip API verification');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await initializeDatabase(pool); await pool.query('TRUNCATE sessions,auth_nonces,players CASCADE');
  const app = createApp(pool, { origin, chainId: 84532, secure: false }, async (message, signature) => {
    const parsed = parseSiweMessage(message); return verifyMessage({ address: parsed.address!, message, signature });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as { port: number }).port;
  t.after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); await pool.end(); });
  let cookies = '';
  async function request(path: string, body?: unknown, address = signer.address, requestOrigin = origin) {
    const result = await fetch(`http://127.0.0.1:${port}/api${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: requestOrigin, Cookie: cookies, 'X-Seacaster-Wallet': address, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const value of result.headers.getSetCookie()) {
      const pair = value.split(';')[0], key = pair.split('=')[0];
      cookies = cookies.split('; ').filter(v => v && !v.startsWith(`${key}=`)).concat(pair).join('; ');
    }
    return { status: result.status, data: await result.json(), headers: result.headers };
  }
  assert.equal((await request('/me')).status, 401);
  assert.equal((await request('/casts', { fid: 1, premium: true })).status, 401);
  assert.equal((await request('/auth/nonce', { address: signer.address }, signer.address, 'https://attacker.invalid')).status, 403);
  const challenge = await request('/auth/nonce', { address: signer.address });
  const signature = await signer.signMessage({ message: challenge.data.message });
  assert.equal(challenge.status, 200); assert.ok(challenge.headers.getSetCookie()[0].includes('HttpOnly'));
  const login = await request('/auth/verify', { message: challenge.data.message, signature });
  assert.equal(login.status, 200); assert.equal(login.data.profile.coins, 100); assert.equal('premium' in login.data.profile, false);
  assert.equal((await request('/auth/verify', { message: challenge.data.message, signature })).status, 401);
  assert.equal((await request('/me', undefined, other)).status, 401);
  assert.equal((await request('/tackle', { action: 'buy', id: 'shrimp', price: -100000 })).data.profile.coins, 60);
  const started = await request('/casts', {});
  assert.equal(started.status, 200); assert.equal('catch' in started.data.cast, false);
  assert.equal((await request(`/casts/${started.data.cast.id}/hook`, {})).status, 400);
  await pool.query("UPDATE players SET active_cast=jsonb_set(jsonb_set(active_cast,'{biteAt}',to_jsonb($1::bigint)),'{expiresAt}',to_jsonb($2::bigint))", [Date.now() - 10, Date.now() + 3000]);
  const hooked = await request(`/casts/${started.data.cast.id}/hook`, {});
  assert.equal(hooked.status, 200);
  let reel = newReel(), hold = true;
  const inputs = [{ at: 0, hold }];
  while (reel.status === 'playing') {
    const next = reel.tension > .7 ? false : reel.tension < .35 ? true : hold;
    if (next !== hold) { hold = next; inputs.push({ at: reel.elapsed, hold }); }
    reel = stepReel(reel, hold, hooked.data.seed);
  }
  assert.equal(reel.status, 'won');
  const payload = { inputs, duration: reel.elapsed, speciesId: 'f15', weight: 1e9, xp: 1e9 };
  assert.equal((await request(`/casts/${started.data.cast.id}/finish`, payload)).status, 400);
  await pool.query("UPDATE players SET active_cast=jsonb_set(active_cast,'{hookedAt}',to_jsonb($1::bigint))", [Date.now() - reel.elapsed - 100]);
  const [a, b] = await Promise.all([request(`/casts/${started.data.cast.id}/finish`, payload), request(`/casts/${started.data.cast.id}/finish`, payload)]);
  assert.equal(a.status, 200); assert.equal(b.status, 200);
  const me = await request('/me'); assert.equal(me.data.profile.totalCatches, 1); assert.ok(me.data.profile.xp < 1000);
  assert.equal((await request('/leaderboard')).data.players.length, 1);
  assert.equal((await request('/auth/logout', {})).status, 200); assert.equal((await request('/me')).status, 401);
});
