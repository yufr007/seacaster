import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { randomBytes, randomInt, randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Pool, PoolClient } from 'pg';
import { createPublicClient, http, getAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { createSiweMessage } from 'viem/siwe';
import { newProfile, buyTackle, equipTackle, claimDaily } from '../../game/engine.ts';
import type { Profile } from '../../game/engine.ts';
import { createCast, hookCast, finishCast, castView } from '../../game/cast.ts';
import type { Cast } from '../../game/cast.ts';

type Player = { id: string; address: string; profile: Profile; active_cast: Cast | null };
type Config = { origin: string; chainId: 8453 | 84532; rpcUrl?: string; secure: boolean };
type Verify = (message: string, signature: `0x${string}`, nonce: string) => Promise<boolean>;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const opaque = () => randomBytes(32).toString('hex');
const random = () => randomInt(0x100000000) / 0x100000000;
const wrap = (handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next) => { void handler(req, res).catch(next); };
const cookie = (req: Request, key: string): string | undefined => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${key}=`))?.slice(key.length + 1);
class HttpError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export async function initializeDatabase(pool: Pool): Promise<void> {
  await pool.query(await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8'));
}
/** One REST service. Authentication and mutations require a configured database. */
export function createApp(pool: Pool | null, config: Config, verifyOverride?: Verify) {
  const app = express();
  const origin = new URL(config.origin).origin, domain = new URL(origin).host;
  const client = createPublicClient({ chain: config.chainId === 8453 ? base : baseSepolia, transport: http(config.rpcUrl) });
  const verify: Verify = verifyOverride ?? ((message, signature, nonce) => client.verifySiweMessage({ message, signature, nonce, domain }));
  const cookieOptions = { httpOnly: true, secure: config.secure, sameSite: 'strict' as const, path: '/api' };
  app.disable('x-powered-by');
  app.use('/api', express.json({ limit: '24kb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET' && req.headers.origin !== origin) return next(new HttpError(403, 'Request origin is not allowed.'));
    next();
  });
  const limits = new Map<string, { count: number; until: number }>();
  app.use('/api', (req, _res, next) => {
    const now = Date.now(), key = req.ip ?? 'unknown';
    if (limits.size > 10000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
    if (!limits.has(key) && limits.size >= 20000) return next(new HttpError(429, 'Server is busy. Please retry.'));
    const old = limits.get(key), entry = old && old.until > now ? old : { count: 0, until: now + 60000 };
    limits.set(key, entry);
    if (++entry.count > 120) return next(new HttpError(429, 'Too many requests. Please retry shortly.'));
    next();
  });
  const db = () => { if (!pool) throw new HttpError(503, 'Online saving is not configured. Guest fishing remains available.'); return pool; };
  const wallet = (req: Request) => {
    try { return getAddress(String(req.headers['x-seacaster-wallet'] ?? '')).toLowerCase(); }
    catch { throw new HttpError(401, 'Connect your wallet and sign in.'); }
  };
  async function player(req: Request): Promise<Player> {
    const token = cookie(req, 'sc_session');
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new HttpError(401, 'Sign in to save online.');
    const result = await db().query<Player>('SELECT p.* FROM sessions s JOIN players p ON p.id=s.player_id WHERE s.token_hash=$1 AND s.expires_at>now()', [hash(token)]);
    const p = result.rows[0];
    if (!p || p.address !== wallet(req)) throw new HttpError(401, 'This session does not match the connected wallet.');
    return p;
  }
  async function mutate(req: Request, fn: (p: Player, conn: PoolClient) => Promise<unknown>): Promise<unknown> {
    const identity = await player(req), conn = await db().connect();
    try {
      await conn.query('BEGIN');
      const { rows } = await conn.query<Player>('SELECT * FROM players WHERE id=$1 FOR UPDATE', [identity.id]);
      const p = rows[0], result = await fn(p, conn);
      await conn.query('UPDATE players SET profile=$2, active_cast=$3, updated_at=now() WHERE id=$1', [p.id, JSON.stringify(p.profile), JSON.stringify(p.active_cast)]);
      await conn.query('COMMIT'); return result;
    } catch (error) { await conn.query('ROLLBACK'); throw error; }
    finally { conn.release(); }
  }
  const summary = (p: Player) => ({ address: p.address, profile: p.profile });
  const active = (cast: Cast | null) => cast && !cast.completed && Date.now() <= (cast.hookedAt !== null ? cast.hookedAt + 60000 : cast.expiresAt);
  const idle = (p: Player) => { if (active(p.active_cast)) throw new HttpError(409, 'Finish or cancel your current cast first.'); };
  app.get('/api/health', wrap(async (_req, res) => { if (pool) await pool.query('SELECT 1'); res.json({ status: 'ok', online: Boolean(pool), chainId: config.chainId }); }));
  app.post('/api/auth/nonce', wrap(async (req, res) => {
    let address: `0x${string}`;
    try { address = getAddress(String(req.body.address)); } catch { throw new HttpError(400, 'Invalid wallet address.'); }
    const nonce = opaque(), expires = new Date(Date.now() + 5 * 60000);
    const message = createSiweMessage({ address, chainId: config.chainId, domain, uri: origin, version: '1', nonce, issuedAt: new Date(), expirationTime: expires, statement: 'Sign in to SeaCaster. This does not authorize purchases or transfers.' });
    await db().query('DELETE FROM auth_nonces WHERE expires_at<now()');
    await db().query('INSERT INTO auth_nonces(nonce,address,message,expires_at) VALUES($1,$2,$3,$4)', [nonce, address.toLowerCase(), message, expires]);
    res.cookie('sc_challenge', nonce, { ...cookieOptions, maxAge: 5 * 60000 }); res.json({ message, chainId: config.chainId });
  }));
  app.post('/api/auth/verify', wrap(async (req, res) => {
    const nonce = cookie(req, 'sc_challenge');
    if (!nonce) throw new HttpError(401, 'Request a fresh sign-in message.');
    const { rows } = await db().query<{ address: string; message: string }>('DELETE FROM auth_nonces WHERE nonce=$1 AND expires_at>now() RETURNING address,message', [nonce]);
    res.clearCookie('sc_challenge', cookieOptions);
    const challenge = rows[0], { message, signature } = req.body;
    if (!challenge || message !== challenge.message || typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature) || signature.length > 20000) throw new HttpError(401, 'Sign-in challenge is invalid or expired.');
    if (!await verify(message, signature as `0x${string}`, nonce)) throw new HttpError(401, 'Wallet signature could not be verified.');
    const { rows: players } = await db().query<Player>('INSERT INTO players(id,address,profile) VALUES($1,$2,$3) ON CONFLICT(address) DO UPDATE SET address=EXCLUDED.address RETURNING *', [randomUUID(), challenge.address, JSON.stringify(newProfile())]);
    const token = opaque(), old = cookie(req, 'sc_session');
    if (old) await db().query('DELETE FROM sessions WHERE token_hash=$1', [hash(old)]);
    await db().query('DELETE FROM sessions WHERE expires_at<now()');
    await db().query('INSERT INTO sessions(token_hash,player_id,expires_at) VALUES($1,$2,$3)', [hash(token), players[0].id, new Date(Date.now() + 7 * 86400000)]);
    res.cookie('sc_session', token, { ...cookieOptions, maxAge: 7 * 86400000 }); res.json(summary(players[0]));
  }));
  app.post('/api/auth/logout', wrap(async (req, res) => {
    await player(req);
    await db().query('DELETE FROM sessions WHERE token_hash=$1', [hash(cookie(req, 'sc_session')!)]);
    res.clearCookie('sc_session', cookieOptions); res.json({ ok: true });
  }));
  app.get('/api/me', wrap(async (req, res) => res.json(summary(await player(req)))));
  app.post('/api/casts', wrap(async (req, res) => res.json(await mutate(req, async p => {
    idle(p);
    const result = createCast(p.profile, Date.now(), [random(), random(), random()], randomUUID());
    p.profile = result.profile; p.active_cast = result.cast;
    return { ...summary(p), cast: castView(result.cast), serverTime: Date.now() };
  }))));
  app.post('/api/casts/:id/hook', wrap(async (req, res) => res.json(await mutate(req, async p => {
    if (!p.active_cast || p.active_cast.id !== req.params.id) throw new HttpError(404, 'Cast not found.');
    p.active_cast = hookCast(p.active_cast, Date.now(), randomInt(0x100000000)); return { seed: p.active_cast.seed };
  }))));
  app.post('/api/casts/:id/finish', wrap(async (req, res) => res.json(await mutate(req, async p => {
    if (!p.active_cast || p.active_cast.id !== req.params.id) throw new HttpError(404, 'Cast not found.');
    if (p.active_cast.completed) return { ...summary(p), catch: p.active_cast.catch };
    const result = finishCast(p.profile, p.active_cast, req.body.inputs, req.body.duration, Date.now());
    p.profile = result.profile; p.active_cast = result.cast; return { ...summary(p), catch: result.catch };
  }))));
  app.post('/api/casts/:id/cancel', wrap(async (req, res) => res.json(await mutate(req, async p => {
    if (p.active_cast?.id === req.params.id && !p.active_cast.completed) p.active_cast = null; return { ok: true };
  }))));
  app.post('/api/tackle', wrap(async (req, res) => res.json(await mutate(req, async p => {
    idle(p);
    if (req.body.action === 'buy') p.profile = buyTackle(p.profile, String(req.body.id));
    else if (req.body.action === 'equip') p.profile = equipTackle(p.profile, String(req.body.id));
    else throw new HttpError(400, 'Unknown tackle action.');
    return summary(p);
  }))));
  app.post('/api/daily', wrap(async (req, res) => res.json(await mutate(req, async p => { p.profile = claimDaily(p.profile); return summary(p); }))));
  app.get('/api/leaderboard', wrap(async (_req, res) => {
    const { rows } = await db().query<{ address: string; xp: number; catches: number }>("SELECT address,(profile->>'xp')::integer AS xp,(profile->>'totalCatches')::integer AS catches FROM players WHERE (profile->>'totalCatches')::integer>0 ORDER BY (profile->>'xp')::integer DESC, address ASC LIMIT 25");
    res.json({ players: rows });
  }));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Unknown API endpoint.')));
  app.use('/api', (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
    if (error instanceof SyntaxError) { res.status(400).json({ error: 'Invalid JSON request.' }); return; }
    if (error instanceof Error && !('code' in error) && ['Invalid', 'Missed', 'No ', 'Not ', 'Unknown tackle', 'Choose ', 'Unlocks', 'You already', 'This cast', 'Reel ', 'The fish', 'Catch five', 'Rod not', 'Bait box', 'Input '].some(prefix => error.message.startsWith(prefix))) { res.status(400).json({ error: error.message }); return; }
    console.error('API request failed', error instanceof Error ? error.name : 'UnknownError');
    res.status(503).json({ error: 'Online service is unavailable. Please retry.' });
  });
  return app;
}
