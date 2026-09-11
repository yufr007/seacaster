import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { createApp } from '../backend/src/app.ts';

const chainId = Number(process.env.CHAIN_ID ?? 84532);
if (chainId !== 8453 && chainId !== 84532) throw new Error('CHAIN_ID must be 8453 or 84532.');

// Use Supabase's transaction-pooler connection string in production. Keeping the
// Pool at module scope lets Fluid Compute reuse warm connections between requests.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 4, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 })
  : null;

const app = createApp(pool, {
  origin: process.env.APP_ORIGIN ?? 'http://localhost:5173',
  chainId,
  rpcUrl: process.env.RPC_URL,
  secure: process.env.NODE_ENV === 'production',
});

type RoutedRequest = Request & { query: Record<string, string | string[] | undefined>; url: string };

export default function handler(request: RoutedRequest, response: Response) {
  // vercel.json sends /api/* here with the original suffix as ?path=. Restore
  // the public URL before Express routing so the existing, tested API stays unchanged.
  const raw = request.query.path;
  const path = Array.isArray(raw) ? raw.join('/') : (raw ?? '');
  const parsed = new URL(request.url, 'http://seacaster.local');
  parsed.searchParams.delete('path');
  const query = parsed.searchParams.toString();
  request.url = `/api/${path}${query ? `?${query}` : ''}`;
  return app(request, response);
}
