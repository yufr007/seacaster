# SeaCaster

A mobile-first fishing game for Base: cast with a swipe, read the water, manage line tension, land fish, build a journal and earn your way from a weathered pier to the yacht. Guest fishing requires no wallet or transaction.

## The game

SeaCaster is a React 18 + Vite + TypeScript + React Three Fiber game with a server-authoritative online journal and optional ownership on Base.

- 15 discoverable fish species with distinct rarity, weight and rewards.
- Swipe-to-cast rod motion, visible bait flight, splash, bobber, hook timing and tension-based reeling.
- Worm, shrimp and squid bait plus earned rod/tackle progression.
- Daily five-catch challenge, XP, coins, collection journal and leaderboard.
- Four earned fishing berths: Driftwood Pier, Willow Inlet, Little Skipper and Sunseeker Yacht.
- Authored Blender/GLB harbour assets, animated wildlife/fish, stylized water, atmospheric lighting and berth-specific set dressing.
- Local-time day/night presentation, Moonlit Cove visual override for Sea Pass owners, opt-in procedural ocean/fishing soundscape and haptics.
- Illustrated low-power mode keeps the full fishing loop usable on constrained devices.

The world is intentionally stylized and readable on a phone rather than photorealistic. Gameplay simulation is kept outside React rendering so visual fidelity does not control catch outcomes.

## Base ownership

Connect with Base Account or another EVM wallet. SIWE creates a separate server-authoritative online journal; guest progress stays local and is never silently imported into the online leaderboard.

The optional `SeaCasterAssetsV2` contract supports:

- **Sea Pass** — 30 days of Moonlit Cove and identity treatment. No automatic renewal.
- **Golden Tide Rod** — transferable ERC-1155 cosmetic, token ID 101. Appearance only.

Core fishing stays free. Onchain ownership never changes catch odds, XP or server validation. Checkout is disabled unless the configured contract, chain and payment token verify successfully.

## Production stack

SeaCaster ships as a deliberately small managed stack:

| Layer | Production |
| --- | --- |
| Web/game | Vite + React + R3F on Vercel |
| Static art | Vercel CDN (`public/assets`, `public/models`) |
| Trusted API | Existing tested Express game API mounted as one Vercel Node Function |
| Database | Fresh Supabase Postgres in US East, using its transaction pooler from the Vercel Function |
| Identity | SIWE verified server-side with viem, compatible with the Base wallet path |
| Ownership | Base + wagmi + viem + `SeaCasterAssetsV2` |
| CI | GitHub Actions: rules, contracts, real PostgreSQL API tests and Playwright renders |

There is no production Docker service, VPS, FastAPI service, Railway service or Render service. Add infrastructure only when the game has a measured workload that needs it.

Supabase's browser Data API is not used for authoritative game state. `players`, `auth_nonces` and `sessions` have RLS enabled and client roles revoked; only the trusted Vercel API receives the server-only database connection.

## Run locally

Node 22.16 or newer is required.

```bash
npm ci
cp .env.example .env
npm run dev
```

Guest fishing works immediately at `http://localhost:5173` with no database.

For the complete deployed-style API, use a PostgreSQL database and run through Vercel's local runtime (`vercel dev`) with `APP_ORIGIN`, `CHAIN_ID`, `RPC_URL` and `DATABASE_URL` set. Production `DATABASE_URL` must be the SeaCaster Supabase **transaction-pooler** URI, never a browser variable.

## Verification

```bash
npm test
npm run build
DATABASE_URL=postgresql://.../seacaster_test npm run test:api
npx playwright install chromium
npm run test:e2e
cd contracts && npm ci && npm test
```

The API suite refuses a database whose name does not end in `_test`. Browser tests drive real touch gestures, cast/hook/reel recovery, all four berths, day/night, settings, audio opt-in and wallet-unconfigured states. Full authored-WebGL rendering is captured separately from gameplay mechanics so a slow CI software renderer cannot alter the simulation clock.

A green CI build is not a substitute for physical iPhone/Android performance testing or a live Base Sepolia checkout test.

## Code boundaries

| Path | Responsibility |
| --- | --- |
| `game/` | Pure catalogue, progression, cast and deterministic reel validation |
| `app/` | Presentation, R3F world, input, guest state, wallet and UI |
| `api/handler.ts` | Vercel Function entry point |
| `backend/src/` | Same-origin game API, SIWE sessions and authoritative PostgreSQL mutations |
| `backend/sql/` | Fresh game schema used by Supabase and disposable API tests |
| `contracts/` | Sea Pass expiry, USDC payments and ERC-1155 cosmetic ownership |
| `public/models/` | Authored production GLB assets |
| `tests/` | Domain, deployment, PostgreSQL API and browser verification |

Authenticated catches are selected by the server and awarded atomically after replaying the reel transcript. Client-submitted species, weight, XP, prices and unlock claims are not trusted. This prevents simple client fabrication; it is not human-attestation, which is why this release has no cash-prize competition or tradeable catch rewards.

The abandoned Farcaster/FID prototype remains only in Git history. SeaCaster V2 has no Farcaster runtime dependency, no fungible game token, no marketplace, and no React Native or Unity fork.
