# SeaCaster

A web-native fishing game with optional ownership on Base. Cast, set the hook, manage line tension, land a catch and build a field journal. No wallet or transaction is required for guest fishing.

## V2 scope

The active game uses React 18, Vite, TypeScript and React Three Fiber. Original fish artwork and nautical identity are retained. Features include fifteen discoverable species, earned-currency tackle and rod upgrades, a daily five-catch challenge, a server-recorded leaderboard, optional sound, and an illustrated low-power mode.

A connected wallet can sign in through SIWE to a separate server-authoritative journal. The optional Sea Pass provides thirty days of Moonlit Cove and a badge. The Golden Tide Rod is an appearance-only, transferable ERC-1155 cosmetic. Neither is represented by a trusted local premium flag. Checkout is disabled until a valid contract is configured and verified.

This is source under active release verification, not a deployed or independently audited mainnet product. Read [the release checklist](docs/RELEASE.md) before enabling purchases.

## A little life on the water

The title screen opens into your harbour: real XP, earned coins, your field journal, daily challenge progress and the next fishing berth. Go fishing without connecting a wallet.

Swipe **upward over the water** to wind up and cast. Swipe direction and length move the landing point; they do not buy or alter catch odds. Tap-to-cast and Space remain available. Watch the bobber dip, set the hook, then hold to reel and release before the tension gets too high. The catch jumps aboard before the journal reveal.

| Berth | Unlock | Surroundings |
| --- | --- | --- |
| Driftwood Pier | Start | Timber deck, bait chest, bucket and lantern |
| Willow Inlet | 3 catches | Estuary banks, reeds, stones and lily pads |
| Little Skipper | 10 catches | Rocking painted fishing boat |
| Sunseeker Yacht | 30 catches | Cream hull, teak-coloured deck and cabin |

Berths are earned through catches, cost no coins, and persist with the active profile. Server-authenticated selection checks the same unlock rules; guest saves remain separate. Use the physical **Bait box** button on the deck to select worms, shrimp or squid, or restock through the tackle shop.

The 3D world uses original stylized geometry, animated water, curious fish, distant sailboats, gulls, clouds, islands and a lighthouse. Lighting follows the device's local clock, without GPS or an astronomical sunrise calculation. The existing Sea Pass Moonlit Cove setting remains an optional visual override.

Sound is opt-in: procedural Web Audio supplies surf, cast/splash/reel effects, sparse birds and catch cues. Settings separately control ambience, effects, haptics and low-power mode. No external sound download is required. Reduced motion suppresses decorative animation; hidden pages suspend audio and rendering. Low-power mode keeps the illustrated scene and touch gameplay.

See [the immersion specification](docs/IMMERSION.md) for the scope and verification boundaries. This iteration does not change contracts, payment prices or fishing reward probabilities.

## Run locally

Node 22.16 or newer is required. Both dependency graphs have committed lockfiles.

```bash
npm ci
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
# Create a separate disposable test database:
docker compose exec postgres createdb -U seacaster seacaster_test
DATABASE_URL=postgresql://seacaster:local-development-only@localhost:5432/seacaster_test npm run test:api
npx playwright install chromium
npm run test:e2e
cd contracts && npm ci && npm test
```

The API test creates/truncates its test tables and refuses a database name without the _test suffix. The browser tests exercise real touch swipes and reeling, collection persistence, missed-bite recovery, all four berths, local timezone lighting, settings persistence, live audio generation/muting and the unconfigured wallet state. The mobile animation test records the actual browser flow; Playwright video itself has no audio track. A passing build is not equivalent to real-device or visual approval.

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
