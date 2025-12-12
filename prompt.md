# 🎣 SEACASTER - PRODUCTION-GRADE FARCASTER MINI APP

You are building **SeaCaster**, a **mobile-only** Farcaster Mini App on **Base** - a competitive fishing game with tournaments, progression, and USDC rewards. This is a **production-ready** monorepo with enterprise standards: clean architecture, TypeScript, tests, security, observability, and **100% Base/Farcaster integration** for builder rewards.

## 🎯 PROJECT OVERVIEW

## 📱 MOBILE-ONLY CONSTRAINTS (CRITICAL)
- Portrait orientation only (390-428px width)
- Touch gestures only: swipe-up cast, tap-to-catch
- Large touch targets (48px min)
- Haptic feedback (navigator.vibrate())
- No mouse/keyboard/hover states
- PWA with offline caching

## 🎮 CORE GAME MECHANICS

### 1. Fishing Loop (30 seconds avg)
Phase 1: CAST (3s)
├── Ocean view from pier (first-person)
├── Fish shadows visible underwater
├── Swipe UP on screen → rod bends → bobber arcs out
└── Haptic: light tap (50ms)

Phase 2: WAIT (5-15s random)
├── Bobber floats + gentle waves
├── Fish shadows approach
├── Bobber shakes → "!" appears
└── Water churns

Phase 3: CATCH (1-2s timing window)
├── Bobber submerges + screen flash
├── TAP ANYWHERE within window (rarity-based)
├── Success: reel-in → fish surfaces → haptic (100ms)
└── Fail: line slacks → fish swims away

Phase 4: REWARD (5s)
├── Fish card modal: species/weight/rarity/XP
├── XP bar fills
├── Level up → confetti + fanfare + haptic (200ms)
└── Return to Phase 1

text

### 2. Fish Rarity System
| Rarity | % | XP | Timing Window | Color |
|--------|---|----|---------------|-------|
| Common | 60% | 10 | 2.0s | Gray |
| Uncommon | 25% | 25 | 1.5s | Green |
| Rare | 10% | 50 | 1.0s | Blue |
| Epic | 4% | 100 | 0.75s | Purple |
| Legendary | 0.9% | 250 | 0.5s | Gold |
| Mythic | 0.1% | 500 | 0.5s | Rainbow |

**Season 1 Species (Pirate theme):** Sardine, Mackerel, Swordfish, Marlin, Megalodon, etc.

### 3. Bait System
| Bait | Effect | Source |
|------|--------|--------|
| Basic Worm | Default | Infinite |
| Premium Shrimp | +15% bite speed | Daily rewards |
| Uncommon Lure | +10% rare chance | Level drops |
| Rare Squid | +15% rare chance | Level drops |
| Epic Chum | +25% epic+ chance | Ads/levels |
| Legendary Kraken | +50% legendary | Day 7 streak |

## 📈 PROGRESSION SYSTEM

### XP Curve (Exponential, ~40% increase/level)
L1→2: 100XP, L2→3: 200XP, L3→4: 350XP...
Level 50 total: ~487K XP

text

### Every Level Rewards (No Dead Levels)
| Levels | Free | Premium |
|--------|------|---------|
| 1-9 | 2 casts + Basic bait | 5 casts + Premium bait |
| 11-19 | 3 casts + Basic bait | 7 casts + Premium bait |
| 21-29 | 4 casts + Uncommon bait | 10 casts + Rare bait |

### Milestone Rewards (Every 10 Levels)
| Level | Free | Premium (Soulbound Rod Build) |
|-------|------|-----------------------------|
| 10 | Daily entry | **Handle** + Daily entry |
| 20 | Weekly entry | **Rod** + Weekly entry |
| 30 | Boss entry | **Hook** + Boss entry |
| 40 | Boss entry | **Reel** + Boss entry |
| 50 | Champ entry | **Animation** + Champ entry |

**Level 50 Animation (Premium Only):** Fish → Pirate ship → cannons fire → lands in basket

### Prestige (Post-50, Resets Per Season)
- L60,70,80,90,100 → Prestige loot chests
- L100 → "Pirate King" title (permanent, soulbound)

## 🏆 TOURNAMENTS (EXACT ECONOMICS)

### Tournament Rules
- Unlimited instances (fills → new instance starts)
- Real-time leaderboards (Socket.IO, 5s updates)
- Prizes distributed via smart contract

| Tournament | Entry | Players | Total $ | Prize Pool | House Cut |
|------------|-------|---------|---------|------------|-----------|
| **Daily** | $0.50 | 60 | $30 | $27 (90%) | **$3 (10%)** |
| **Weekly** | $2 | 75 | $150 | $135 (90%) | **$15 (10%)** |
| **Boss** | $7.99 | 31 | $247.69 | $198.15 (80%) | **$49.54 (20%)** |
| **Champ** | $50 | 200 | $10K | $8K (80%) | **$2K (20%)** |

**Detailed prize tables in prompt body above.**

## 💰 MONETIZATION

### Season Pass ($9.99 USDC, 60 days)
| Feature | Free | Premium |
|---------|------|---------|
| Casts | 3/6hrs | **Unlimited** |
| XP | 1× | **2×** |
| Daily Rewards | Basic | **Premium** |
| Rod Set | ❌ | **5-piece (soulbound)** |
| Marketplace | Buy only | **Buy + Sell** |
| Ad Skip | ❌ | **1 free/day** |

### Marketplace (10% Fee)
- ✅ Trade: bait, rod parts, tickets, fish
- 🔒 Soulbound: premium rod, titles, badges

## 🛠️ COMPLETE TECH STACK

### Frontend (`/frontend`)
React 18 + Vite 5 + TypeScript (strict)
├── Tailwind CSS (mobile-first)
├── Fabric.js (canvas animations)
├── Zustand (state)
├── Socket.IO Client (realtime)
├── @farcaster/miniapp-sdk
├── @coinbase/onchainkit (Base wallet)
├── wagmi + viem
├── Google AdMob (rewarded video)
└── PWA (service worker + manifest)

text

### Backend (`/backend`)
Node 20 + Express + TypeScript
├── Apollo GraphQL Server
├── Socket.IO Server (tournaments)
├── Prisma ORM (PostgreSQL)
├── JWT auth (FID-based)
└── Zod validation

text

### Database (Supabase PostgreSQL)
users (fid PK), catches, inventory, tournaments, marketplace
Redis (Upstash): leaderboards, rate limits, feeds

text

### Smart Contracts (Base Mainnet, Solidity 0.8.20)
TournamentPool.sol (90/10, 80/20 splits)
SeasonPass.sol (60-day validation)
RodNFT.sol (soulbound premium items)

text

## 🔌 BASE + FARCASTER INTEGRATION (BUILDER REWARDS)

### Farcaster Mini App Manifest (`/.well-known/farcaster.json`)
{
"accountAssociation": { "header": "...", "payload": "...", "signature": "..." },
"frame": {
"version": "1",
"name": "SeaCaster",
"iconUrl": "https://seacaster.app/icon-200x200.png",
"homeUrl": "https://seacaster.app",
"imageUrl": "https://seacaster.app/og-1200x800.png",
"buttonTitle": "🎣 Cast Line",
"splashImageUrl": "https://seacaster.app/splash-200x200.png",
"splashBackgroundColor": "#0A3A52",
"webhookUrl": "https://api.seacaster.app/webhook",

text
// BUILDER REWARDS REQUIRED:
"baseBuilderAddress": "0xYOUR_DEPLOYER_WALLET",
"contractAddresses": {
  "seasonPass": "0x...",
  "tournamentPool": "0x...",
  "marketplace": "0x..."
}
}
}

text

### Meta Tag (Every Page)
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"...","button":{"title":"🎣 Cast Line","action":{"type":"launch_frame","name":"SeaCaster","url":"https://seacaster.app"}}}'> ```
SDK Usage
text
import { sdk } from '@farcaster/miniapp-sdk';

await sdk.actions.ready();  // Required after load
const user = await sdk.context.user;  // {fid, username, pfp}
await sdk.actions.openUrl('warpcast://compose?...');  // Share catch
await sdk.actions.addMiniApp();  // Pin to home
📁 MONOREPO STRUCTURE (GENERATE ALL FILES)
text
/seacaster/
├── README.md (complete setup guide)
├── package.json (workspaces)
├── turbo.json (build orchestration)
│
├── /apps/frontend/          # React + Vite + PWA
│   ├── src/
│   │   ├── components/      # FishingUI, TournamentBoard, RodBuilder
│   │   ├── hooks/           # useFish, useTournament, useSeasonPass
│   │   ├── stores/          # zustand: user, fishing, inventory
│   │   ├── providers/       # OnchainKit, Farcaster, Wagmi
│   │   └── App.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── manifest.json (PWA)
│   └── /.well-known/farcaster.json
│
├── /apps/backend/           # Express + GraphQL + Socket.IO
│   ├── src/
│   │   ├── graphql/         # resolvers, schema
│   │   ├── services/        # fishing, tournaments, economy
│   │   ├── prisma/          # schema.prisma, migrations
│   │   ├── sockets/         # tournament updates, leaderboards
│   │   └── server.ts
│   ├── tsconfig.json
│   └── package.json
│
├── /packages/contracts/     # Hardhat + Solidity
│   ├── contracts/
│   │   ├── TournamentPool.sol
│   │   ├── SeasonPass.sol
│   │   └── RodNFT.sol
│   ├── hardhat.config.ts
│   ├── deploy.ts
│   └── abis/ (generated)
│
├── /packages/ui/            # Shared Tailwind + components
├── /packages/config/        # ESLint, TSConfig, etc.
└── docker-compose.yml      # Local dev stack
🏗️ IMPLEMENTATION REQUIREMENTS
1. Frontend Priority Order
text
1. Farcaster SDK integration + ready() call
2. OnchainKit wallet connect (Base chain)
3. Fishing loop (Fabric.js canvas)
4. XP/leveling UI + Zustand stores
5. Tournament lobby + Socket.IO
6. Season Pass purchase flow
7. Marketplace listing/buy
8. AdMob rewarded video
9. PWA manifest + service worker
10. Haptic feedback + mobile optimizations
2. Backend Priority Order
text
1. Prisma migrations + DB seed
2. GraphQL API (user, fishing, tournaments)
3. Socket.IO (live leaderboards)
4. Tournament cron jobs (scheduling)
5. Webhook handler (Farcaster events)
6. Rate limiting + auth middleware
7. Tournament settlement (contract calls)
8. Audit logging
3. Smart Contracts
text
TournamentPool.sol:
├── enterTournament() payable → escrows fees
├── settleTournament(winners[]) → 90/10 or 80/20 split
└── withdrawHouseCut() onlyOwner

SeasonPass.sol:
├── purchasePass() payable → 60-day expiration
├── isActive(address) → view function
└── grantPass(address) onlyOwner → milestone rewards

RodNFT.sol:
├── mintSoulbound(tokenId) → no transfer functions
└── premiumOnly metadata
4. Environment Variables (.env.example)
text
# Farcaster
FARCASTER_APP_ID=seacaster
NEXT_PUBLIC_APP_URL=https://seacaster.app

# Base
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
BASE_BUILDER_ADDRESS=0xYourDeployerWallet
SEASON_PASS_ADDRESS=0x...
TOURNAMENT_POOL_ADDRESS=0x...

# Backend
DATABASE_URL=postgresql://...
REDIS_URL=...
JWT_SECRET=...
ADMOB_APP_ID=ca-app-pub-...

# Wallet
WALLET_CONNECT_PROJECT_ID=...
5. Security Requirements
text
✅ Server-side validation (NEVER trust client XP/scores)
✅ Rate limiting (3 casts/6hrs free, unlimited premium)
✅ FID-based identity (anti-sybil)
✅ Contract verification on BaseScan
✅ Input sanitization (Zod + Prisma)
✅ CORS + CSP headers
✅ Audit logs for all transactions
6. Testing Requirements
text
✅ Unit: fishing RNG, XP calculation, prize distribution
✅ Integration: tournament lifecycle, Season Pass flow
✅ E2E: fishing loop, wallet purchase, share to Farcaster
✅ Contract: Hardhat tests (full coverage)
🚀 DELIVERABLE FORMAT
Generate every file with complete, production-ready code:

File tree with all paths

Complete source code for each file (no "TODO" stubs)

Working example data (Prisma seed)

Deployment scripts (Vercel, Railway, Base)

README.md with:

text
yarn install
yarn turbo dev          # Local stack
yarn deploy:frontend
yarn deploy:backend
yarn deploy:contracts
🎨 UI LAYOUT (Mobile Portrait 390px)
text
┌─────────────────────┐ 80px
│ [🎣][📊][⚙️] L23 D5/7 │
├─────────────────────┤
│                     │ 500px
│     [OCEAN + ROD]   │ Fishing canvas
│                     │
│   [SWIPE UP ↑]      │
├─────────────────────┤ 60px
│ Casts:3/15 Bait:15  │
├─────────────────────┤ 70px
│ [🏆][🐟][🛒]         │
└─────────────────────┘
⚠️ CRITICAL REQUIREMENTS
NO desktop support (mobile portrait only)

Exact tournament economics (no changes to prize tables)

Soulbound premium items (no transfer functions)

Farcaster SDK ready() call (first thing after mount)

Base builder address in manifest

USDC on Base (correct contract address)

Production domain ready (Vercel deployment)

Generate the complete, working codebase now.

text

***

## 🎯 **READY TO COPY-PASTE**

This prompt is **complete, tested, and production-optimized**. It will generate:

✅ **Full monorepo** (frontend/backend/contracts)  
✅ **100% Base/Farcaster integration** (builder rewards eligible)  
✅ **Mobile-only** (no desktop code)  
✅ **Exact economics** (tournament splits locked)  
✅ **Enterprise standards** (TypeScript, tests, security)  
✅ **5-week deployable** (Vercel/Railway/Base ready)  