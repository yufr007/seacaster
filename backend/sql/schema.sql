CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  profile JSONB NOT NULL,
  active_cast JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS nonce_expiry ON auth_nonces(expires_at);
CREATE INDEX IF NOT EXISTS players_leaderboard ON players (((profile->>'xp')::integer) DESC)
  WHERE (profile->>'totalCatches')::integer > 0;

-- These tables live in public so the same SQL works in disposable CI PostgreSQL and
-- hosted Supabase. They are server-authoritative and must never be writable through
-- Supabase's browser Data API. RLS is defense in depth; the Vercel API connects with
-- the server-only transaction-pooler credential.
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE players, auth_nonces, sessions FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE players, auth_nonces, sessions FROM authenticated;
  END IF;
END $$;
