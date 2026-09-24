import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const missing = async (path: string) => {
  try { await access(path); return false; } catch { return true; }
};

test('release topology is Vercel + Supabase without standalone production containers', async () => {
  const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
  const env = await readFile('.env.example', 'utf8');
  const handler = await readFile('api/handler.ts', 'utf8');

  assert.equal(vercel.framework, 'vite');
  assert.deepEqual(vercel.regions, ['iad1']);
  assert.ok(vercel.rewrites.some((rule: { source?: string; destination?: string }) => rule.source === '/api/:path*' && rule.destination?.startsWith('/api/handler')));
  assert.equal(JSON.stringify(vercel).includes('farcaster'), false);
  assert.equal(JSON.stringify(vercel).includes('Access-Control-Allow-Origin'), false);

  assert.match(env, /DATABASE_URL=/);
  assert.match(env, /Supabase.*transaction pooler/i);
  assert.match(handler, /createApp/);
  assert.match(handler, /new Pool/);

  assert.equal(await missing('Dockerfile'), true);
  assert.equal(await missing('compose.yaml'), true);
  assert.equal(await missing('.dockerignore'), true);
  assert.equal(await missing('backend/src/server.ts'), true);
});
