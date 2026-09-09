# SeaCaster

A web-native fishing game with optional ownership on Base. Cast, set the hook, manage line tension, land a catch and build a field journal. No wallet or transaction is required for guest fishing.

## V2 scope

The active game uses React 18, Vite, TypeScript and React Three Fiber. Original fish artwork and nautical identity are retained. Features include fifteen discoverable species, earned-currency tackle and rod upgrades, a daily five-catch challenge, a server-recorded leaderboard, optional sound, and an illustrated low-power mode.

A connected wallet can sign in through SIWE to a separate server-authoritative journal. The optional Sea Pass provides thirty days of Moonlit Cove and a badge. The Golden Tide Rod is an appearance-only, transferable ERC-1155 cosmetic. Neither is represented by a trusted local premium flag. Checkout is disabled until a valid contract is configured and verified.

This is source under active release verification, not a deployed or independently audited mainnet product. Read [the release checklist](docs/RELEASE.md) before enabling purchases.

## Run locally

Node 22.16 or newer is required.

```bash
npm install
cp .env.example .env
npm run dev
```

Guest fishing works without the API or database. The development URL must match APP_ORIGIN for authenticated POST requests; use http://localhost:5173 with the default configuration.

For online saving, start a local PostgreSQL database and the API in a second terminal:

```bash
docker compose up -d postgres
npm run dev:api
```

Use the development DATABASE_URL from .env.example. This database is disposable and has no connection to the former backend. Do not copy production credentials into local test commands.

## Checks

```bash
npm test
npm run build
# Use a separate disposable database whose name ends in _test:
DATABASE_URL=postgresql://seacaster:local-development-only@localhost:5432/seacaster_test npm run test:api
npx playwright install chromium
npm run test:e2e
cd contracts && npm install && npm test
```

The API test creates/truncates its test tables and refuses a database name without the _test suffix. The browser test exercises the real rendered fishing controls, collection persistence and mobile layout. A passing build is not equivalent to real-device or visual approval.

## Code boundaries

| Path | Responsibility |
| --- | --- |
| game/ | Pure catalogue, progression, fishing and deterministic reel validation |
| app/ | Presentation, transient input, guest state, wallet and UI panels |
| backend/src/ | Same-origin Express API, SIWE sessions and PostgreSQL mutations |
| backend/sql/ | Fresh V2 schema |
| contracts/ | Sea Pass expiry, USDC payments and ERC-1155 cosmetic ownership |
| public/assets/ | Existing production artwork |
| tests/ | Domain, real-PostgreSQL API and browser tests |

Authenticated catches are chosen by the server and awarded atomically after replaying the input transcript. This prevents client-submitted fish/XP fabrication and duplicate awards; it is not proof that a human, rather than a bot, played. There are no cash-prize competitions in this release.

The previous implementation remains in Git history. There is no Unity or React Native client, no Farcaster/FID requirement, no fungible game token, and no marketplace in V2.
