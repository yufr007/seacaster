import express from 'express';
import { resolve } from 'node:path';
import pg from 'pg';
import { createApp, initializeDatabase } from './app.ts';
const production = process.env.NODE_ENV === 'production';
const origin = process.env.APP_ORIGIN ?? 'http://localhost:5173';
const chainId = Number(process.env.CHAIN_ID ?? 84532);
if (chainId !== 8453 && chainId !== 84532) throw new Error('CHAIN_ID must be 8453 or 84532.');
if (production && (!process.env.APP_ORIGIN || !origin.startsWith('https://') || !process.env.DATABASE_URL || !process.env.RPC_URL)) throw new Error('Production requires HTTPS APP_ORIGIN, DATABASE_URL and RPC_URL.');
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 10000 }) : null;
if (pool) await initializeDatabase(pool);
const app = createApp(pool, { origin, chainId, rpcUrl: process.env.RPC_URL, secure: production });
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
if (production) { app.use(express.static(resolve('dist'), { maxAge: '1h', index: false })); app.get('*', (_req, res) => res.sendFile(resolve('dist/index.html'))); }
const server = app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0', () => console.log('SeaCaster API ready'));
const shutdown = () => { server.close(() => { void pool?.end().finally(() => process.exit(0)); if (!pool) process.exit(0); }); };
process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
