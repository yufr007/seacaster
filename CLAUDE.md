# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SeaCaster** is a production-grade, mobile-only Farcaster Mini App built on Base L2. It's a competitive fishing tournament game with blockchain-based economy, real-time leaderboards, NFT season passes, and USDC prize pools. This is an enterprise-scale application targeting builder rewards and 5-week deployment.

**Core Stack:**
- **Frontend**: React 18 + Vite 5 + TypeScript (strict) + Tailwind CSS + Fabric.js (canvas) + PWA
- **Backend**: Node 20 + Express + GraphQL (Apollo) + Socket.IO + Prisma ORM
- **Database**: Supabase PostgreSQL + Upstash Redis (leaderboards, rate limits)
- **Blockchain**: Solidity 0.8.20 + Hardhat on Base Mainnet (chainId 8453)
- **Farcaster**: @farcaster/miniapp-sdk (Mini App v2 spec)
- **Web3**: wagmi + viem + OnchainKit (MiniKit compatible)
- **Ads**: Google AdMob (rewarded video)

**Deployment**: Vercel (frontend) + Railway/Cloud Run (backend) + Base L2 (contracts)

## Common Commands

### Frontend Development
```bash
npm install                 # Install all dependencies
npm run dev                # Start Vite dev server on port 3000
npm run build              # Production build to dist/
npm run preview            # Preview production build
```

### Backend Development
```bash
cd backend
npm install                # Install backend dependencies
npm run dev                # Start Express + GraphQL + Socket.IO on port 8080
npm run migrate            # Run Prisma migrations
npm run seed               # Seed database with test data
npm run generate           # Generate Prisma Client
```

### Smart Contract Development
```bash
cd contracts
npm install                                                       # Install Hardhat dependencies
npm run compile                                                   # Compile Solidity contracts
npm test                                                          # Run Hardhat tests
npm run coverage                                                  # Generate test coverage
npm run deploy:sepolia                                           # Deploy to Base Sepolia testnet
npm run deploy:mainnet                                           # Deploy to Base mainnet
doppler run -- npx hardhat run scripts/deploy.ts --network base  # Deploy with secrets from Doppler
```

### Monorepo Management (if using Turborepo)
```bash
yarn turbo dev             # Run all dev servers in parallel
yarn turbo build           # Build all packages
yarn turbo test            # Run all tests
```

### Testing
```bash
npm test                   # Unit tests (frontend)
cd backend && npm test     # Integration tests (backend)
cd contracts && npm test   # Contract tests (Hardhat)
```

## Critical Mobile-Only Constraints

**THIS APP IS MOBILE PORTRAIT ONLY - NO DESKTOP SUPPORT:**
- Target width: 390-428px (portrait orientation)
- Touch gestures ONLY: swipe-up to cast, tap to catch
- Minimum touch target size: 48×48px
- Haptic feedback via `navigator.vibrate()` for all interactions
- NO mouse hover states, NO keyboard controls
- PWA with offline caching and manifest.json
- Service worker for asset caching

## Architecture Overview

### Frontend Architecture (`/` root + `/components`)

**Entry Point**: `index.tsx` → `App.tsx` → Tab-based navigation (fish/compete/shop)

**State Management**:
1. **`store/gameStore.ts`** - Zustand store with localStorage persistence
   - **Fishing Game State**: Current phase (IDLE → CASTING → WAITING → HOOKED → REWARD)
   - **User Stats**: XP, level, coins, casts remaining, streak, premium status
   - **Inventory**: Baits (worm, shrimp, lure, squid, chum, kraken_eye), rods, active selections
   - **Progression Logic**:
     - XP formula: `LEVEL_BASE_XP * LEVEL_EXPONENT^(level-1)` (exponential, ~40% increase/level)
     - Cast regeneration: 1 cast per 2 hours for free users, unlimited for premium
     - Daily streak: Login reward = 20 * streak coins + 5 casts
     - Prestige chests at levels 60, 70, 80, 90, 100
   - **Fish Catch System**:
     - RNG with weighted probabilities (modified by bait effects)
     - Rarity distribution: Common 65%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 0.9%, Mythic 0.1%
     - Timing windows: Common 2.0s → Mythic 0.5s (scales with player level)

2. **`store/uiStore.ts`** - UI state
   - Toast notifications (success, error, info)
   - Modal visibility states

**Core Components**:
- **`FishingScene.tsx`**: Fabric.js canvas with ocean rendering, fish shadows, rod physics, swipe-up gesture detection
- **`GameHUD.tsx`**: Top bar showing XP/level, coins, casts remaining, streak indicator
- **`BaitSelector.tsx`**: Radial menu for bait selection with inventory counts
- **`FishModal.tsx`**: Reward modal after catch (fish card, XP gained, level up confetti)
- **`TournamentBoard.tsx`**: Real-time leaderboard with Socket.IO updates (5s refresh)
- **`TournamentCard.tsx`**: Tournament instance cards (Daily/Weekly/Boss/Champ)
- **`MarketplaceTab.tsx`**: Item listings, buy/sell interface with 10% marketplace fee
- **`ProfileModal.tsx`**: User stats, season pass status, wallet connection
- **`DailyStreak.tsx`**: Visual streak counter with Kraken challenge milestones
- **`AdOverlay.tsx`**: Google AdMob rewarded video integration

**Farcaster Integration** (`services/farcaster.ts`):
```typescript
// Critical initialization sequence:
await sdk.actions.ready();              // MUST be first call after mount
const user = await sdk.context.user;    // Get FID, username, pfpUrl
await sdk.actions.openUrl(warpcastUrl); // Share catch to Warpcast
await sdk.actions.addMiniApp();         // Pin to user's home
```
- Falls back to dev user if SDK unavailable (browser testing)
- Syncs FID to gameStore on init

**Web3 Integration**:
- **`providers/Web3Provider.tsx`**: Wraps app with OnchainKit + wagmi providers
  - Base mainnet (chainId 8453) and Base Sepolia (84532) support
  - MiniKit compatibility for embedded wallet access
- **`hooks/useContracts.ts`**: Contract interaction layer
  - `buySeasonPass()`: Purchase 60-day pass with USDC approval flow
  - `checkSeasonPass(address)`: Read on-chain pass validity
  - `enterTournament(id)`: Tournament entry with USDC escrow
  - USDC approval helper with allowance checks
- **`contracts/abis.ts`**: Generated ABIs from Hardhat compilation

**PWA Configuration**:
- **`manifest.json`**: App name, icons, theme colors, display: standalone
- **`sw.js`**: Service worker for offline asset caching
- **`index.html`**: Meta tags including critical `fc:miniapp` tag

### Backend Architecture (`/backend`)

**Server Setup** (`server.ts`):
- Express app with GraphQL (Apollo Server) on `/graphql`
- Socket.IO server for real-time tournament updates
- CORS configured for Farcaster Mini App embedding
- Helmet security headers
- Health check endpoint: `/health`

**API Routes**:
1. **`/api/webhook`** (`routes/webhook.ts`):
   - Handles Farcaster Mini App lifecycle events:
     - `miniapp_added`: User installs app
     - `miniapp_removed`: User uninstalls
     - `notifications_enabled/disabled`: Permission changes
   - Validates Farcaster signatures
   - Sends push notifications via `notificationUrl`

2. **`/api/game`** (`routes/game.ts`):
   - User profile sync (FID-based)
   - Inventory management
   - XP/level validation (anti-cheat)
   - Tournament registration
   - Marketplace listings

**GraphQL Schema** (presumed in `/backend/graphql`):
- Queries: `user`, `tournaments`, `leaderboard`, `marketplace`
- Mutations: `castFish`, `enterTournament`, `buyItem`, `purchaseSeasonPass`
- Subscriptions: `tournamentUpdates`, `leaderboardChanges`

**Socket.IO Events**:
- `tournament:update` - Live leaderboard position changes (5s interval)
- `tournament:end` - Tournament finalization
- `user:levelup` - Broadcast level achievements

**Database Schema** (Prisma ORM with PostgreSQL):
```prisma
model User {
  fid         Int       @id
  username    String
  xp          Int
  level       Int
  coins       Int
  premium     Boolean
  streak      Int
  lastLogin   DateTime
  inventory   Json      // baits, rods
}

model Tournament {
  id           String    @id
  type         TournamentType
  prizePool    Decimal
  startTime    DateTime
  endTime      DateTime
  participants User[]
}

model Catch {
  id          String    @id
  userId      Int
  fishId      String
  weight      Float
  xp          Int
  timestamp   DateTime
}

model MarketplaceListing {
  id          String    @id
  sellerId    Int
  itemId      String
  price       Int
  status      ListingStatus
}
```

**Tournament Service** (`services/tournamentService.ts`):
- Scheduling: Cron jobs for Daily (every 24h), Weekly (Sunday 12pm UTC), Boss, Championship
- Instance management: Auto-create new instance when current fills
- Leaderboard calculation: Aggregate fish weight/XP per tournament
- Prize distribution: Top 5 winners with exact payout formulas:
  - Daily: $27 pool → 1st: $13.50, 2nd: $8.10, 3rd: $4.05, 4th: $1.35 (10% house)
  - Weekly: $135 pool → 1st: $67.50, 2nd: $40.50, 3rd: $20.25, 4th: $6.75 (10% house)
  - Boss: $198.15 pool → 1st: $98, 2nd: $59, 3rd: $29.50, 4th: $9.85 (20% house)
  - Championship: $8K pool → Top 5 split (20% house)

**Security Features**:
- JWT authentication with FID as subject
- Rate limiting: 3 casts per 6 hours for free users (Upstash Redis)
- Zod schema validation on all inputs
- Server-side XP/score validation (never trust client)
- Audit logging for all USDC transactions
- Anti-sybil: FID-based identity

### Smart Contract Architecture (`/contracts`)

**Contracts Overview**:

1. **`SeaCasterPass.sol`** (ERC-1155):
   - **Token ID 1**: Season Pass (soulbound, 60-day expiry, $9.99 USDC)
   - **Token IDs 100-500**: Premium Rod Parts (soulbound, milestone rewards)
     - 100: Pirate Handle (Level 10)
     - 200: Pirate Rod Body (Level 20)
     - 300: Pirate Hook (Level 30)
     - 400: Pirate Reel (Level 40)
     - 500: Pirate Animation (Level 50)
   - **Token IDs 1000-1003**: Tournament Tickets (transferable)
     - 1000: Daily Ticket
     - 1001: Weekly Ticket
     - 1002: Boss Ticket
     - 1003: Championship Ticket
   - **Token IDs 2000+**: Loot Drops (transferable, prestige rewards)
   - **Key Functions**:
     - `purchasePass()`: Buy pass with USDC, extends expiry if active
     - `hasActivePass(address)`: View function for pass validity check
     - `getPassTimeRemaining(address)`: Returns seconds until expiry
     - `mintPremiumPart(address, tokenId, milestone)`: Backend mints at level milestones
     - `mintTicket(address, tokenId)`: Grant tournament tickets
     - `burnTicket(address, tokenId)`: Consumed on tournament entry
     - `setPassPrice(uint256)`: Admin price adjustment
   - **Soulbound Logic**: Overrides `_update()` to block transfers (except mint/burn) for soulbound tokens

2. **`TournamentEscrow.sol`**:
   - Manages USDC prize pools for unlimited tournament instances
   - **Entry Modes**:
     - Free: Burn tournament ticket (no USDC)
     - Paid: Transfer $0.50 USDC (Daily/Weekly) or higher (Boss/Champ)
   - **Fee Splits**:
     - Daily/Weekly: 90% prize pool, 10% house
     - Boss/Championship: 80% prize pool, 20% house
   - **Key Functions**:
     - `createTournament(ticketId, duration)`: Owner creates new instance
     - `enterWithTicket(tournamentId)`: Free entry by burning ticket
     - `enterWithUSDC(tournamentId)`: Paid entry with automatic fee split
     - `distributePrize(tournamentId, winner, amount)`: Backend calls with calculated prizes
     - `finalizeTournament(tournamentId)`: Close tournament, transfer house cut + unclaimed prizes to owner
     - `getTournament(tournamentId)`: Returns tournament state
   - **Security**: ReentrancyGuard on all payable functions, participant tracking

3. **`Marketplace.sol`**:
   - P2P trading for non-soulbound items (baits, tickets, loot)
   - 10% marketplace fee on all sales
   - USDC-based payments
   - Enforces soulbound rules via SeaCasterPass interface
   - Functions: `listItem()`, `buyItem()`, `cancelListing()`, `withdrawFees()`

4. **`MockUSDC.sol`** / **`MockERC20.sol`**:
   - Test tokens for local/testnet development
   - Production uses Base Native USDC: `0xD9aAEc86B65D86f6A7B5B1b0c42FFF36152b37f8`

**Deployment Configuration** (`hardhat.config.ts`):
- Networks: `base-sepolia` (testnet), `base` (mainnet)
- Compiler: Solidity 0.8.20 with optimizer (200 runs)
- Etherscan verification for Base (chainId 8453, BaseScan API)
- Gas reporter enabled
- Uses Doppler for private key management

**Testing**:
- Unit tests for all contract functions
- Integration tests for full tournament lifecycle
- Coverage requirements: >90% for prize math, soulbound logic, fee splits
- Test scenarios: cancelled tournaments, duplicate entries, fee calculations, soulbound transfer attempts

### Farcaster Mini App Configuration

**Manifest** (`.well-known/farcaster.json`):
```json
{
  "accountAssociation": { /* domain signature */ },
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

    // CRITICAL FOR BUILDER REWARDS:
    "baseBuilderAddress": "0x6ADef5fC93160A7d4F64c274946F52a573DC9b92",
    "contractAddresses": {
      "SeaCasterPass": "0x6E1A9f233A4128d0386Ac8cD6A53844787891971",
      "TournamentEscrow": "0x9465e54e3287ea00E4cF243f86FB927849e780e3",
      "Marketplace": "0x47DD58c99EE81910f4631Df3aF8Cc8FbfBb25Baf"
    }
  }
}
```

**Meta Tags** (`index.html`):
- `<meta name="fc:miniapp" content="...">` - Mini App v2 spec (NOT `fc:frame`)
- OG images: 1200x800px, 3:2 aspect ratio
- All image URLs must return `image/*` content-type

**Webhook Events**:
- Backend validates Farcaster signatures
- Handles: `miniapp_added`, `miniapp_removed`, `notifications_enabled`, `notifications_disabled`
- Rate limits on notification sends per Farcaster spec

## Game Mechanics Deep Dive

### Fishing Loop (30s avg cycle)

**Phase 1: CASTING (3s animation)**
- User swipes up on screen
- Rod bends, bobber arcs out (Fabric.js physics)
- Ocean view from pier (first-person perspective)
- Haptic: light tap (50ms vibration)
- Consumes 1 bait + 1 cast (if not premium)

**Phase 2: WAITING (5-15s random)**
- Bobber floats with gentle wave animation
- Fish shadows approach underwater
- Wait time modified by bait speed effect (e.g., Shrimp -15%)
- Bobber shakes → "!" indicator appears
- Water churns before bite

**Phase 3: HOOKED (0.5-2s timing window)**
- Bobber submerges + screen flash
- Timing window based on fish rarity (Common 2.0s → Mythic 0.5s)
- Window adjusted by player level: `baseWindow * (1 + min(0.5, level/100))`
- Player must TAP ANYWHERE within window
- Success: Reel-in animation → fish surfaces → haptic (100ms)
- Fail: Line slacks → fish swims away → haptic fail

**Phase 4: REWARD (5s)**
- Fish card modal: species, weight, rarity, XP
- XP bar fills with animation
- Check for level up:
  - Confetti animation (canvas-confetti library)
  - Fanfare sound effect
  - Haptic: 200ms vibration
  - Grant level rewards (casts, bait, milestone items)
- Check for new species (collection tracking)
- Return to IDLE phase

### Rarity & XP System

| Rarity | Probability | XP Base | Timing Window | Color | Example Species |
|--------|------------|---------|---------------|-------|----------------|
| Common | 60% | 10 | 2.0s | Gray | Sardine, Anchovy |
| Uncommon | 25% | 25 | 1.5s | Green | Mackerel, Bass |
| Rare | 10% | 50 | 1.0s | Blue | Tuna, Barracuda |
| Epic | 4% | 100 | 0.75s | Purple | Swordfish, Marlin |
| Legendary | 0.9% | 250 | 0.5s | Gold | Megalodon, Kraken |
| Mythic | 0.1% | 500 | 0.5s | Rainbow | Ghost Ship, Leviathan |

**XP Modifiers**:
- Rod bonus: +5% (Fiberglass L10), +10% (Carbon L20), +50% (Gold L50)
- Premium multiplier: 2x XP
- Final XP = `baseXP * rodMultiplier * (premium ? 2 : 1)`

### Bait Effects

| Bait | Effect | Modifier | Source |
|------|--------|----------|--------|
| Basic Worm | None | - | Infinite default |
| Premium Shrimp | Speed | -15% wait time | Daily rewards |
| Uncommon Lure | Rare+ | +10% rare weight | Level drops |
| Rare Squid | Rare+ | +15% rare weight | Level 21-29 drops |
| Epic Chum | Epic+ | +25% epic weight | Ads, level 30-39 drops |
| Legendary Kraken Eye | Legendary+ | +50% legendary weight | Day 7 streak, prestige chests |

Implementation: Modifies `RARITY_WEIGHTS` during RNG calculation in `triggerBite()`

### Progression System

**XP Curve** (Exponential, ~40% increase per level):
- L1→2: 100 XP
- L2→3: 200 XP
- L3→4: 350 XP
- L10: ~6,000 XP total
- L50: ~487,000 XP total

**Level Rewards (EVERY level, no dead levels)**:
| Level Range | Free | Premium |
|------------|------|---------|
| 1-9 | 2 casts + Basic bait | 5 casts + Premium bait |
| 10-19 | 3 casts + Basic bait | 7 casts + Premium bait |
| 20-29 | 4 casts + Uncommon bait | 10 casts + Rare bait |
| 30-39 | 5 casts + Rare bait | 12 casts + Epic bait |
| 40-49 | 6 casts + Epic bait | 15 casts + Epic bait |
| 50+ | 10 casts + Epic bait | 20 casts + Legendary bait |

**Milestone Rewards (Every 10 levels)**:
| Level | Free | Premium (Soulbound NFT) |
|-------|------|------------------------|
| 10 | Daily tournament ticket | Pirate Handle + Daily ticket |
| 20 | Weekly tournament ticket | Pirate Rod Body + Weekly ticket |
| 30 | Boss tournament ticket | Pirate Hook + Boss ticket |
| 40 | Boss tournament ticket | Pirate Reel + Boss ticket |
| 50 | Championship ticket | Pirate Animation + Champ ticket |

**Level 50 Animation (Premium Only)**:
- Fish caught → Pirate ship appears → Cannons fire → Fish lands in basket
- Implemented via Fabric.js sprite sequence

**Prestige System (Post-50)**:
- Levels 60, 70, 80, 90, 100: Grant prestige loot chest
- Level 100: "Pirate King" title (permanent, soulbound, displayable badge)
- Chest contents: 5000 coins + 5 Kraken Eyes
- Tracked via `userStats.pendingChests`

### Tournament Economics (EXACT FORMULAS)

**Daily Tournament** (Fills: 60 players, Entry: $0.50 USDC or Daily Ticket):
- Total pot: $30
- Prize pool (90%): $27
- House cut (10%): $3
- Payouts:
  1. 1st: $13.50 (50%)
  2. 2nd: $8.10 (30%)
  3. 3rd: $4.05 (15%)
  4. 4th: $1.35 (5%)

**Weekly Tournament** (Fills: 75 players, Entry: $2 USDC or Weekly Ticket):
- Total pot: $150
- Prize pool (90%): $135
- House cut (10%): $15
- Payouts:
  1. 1st: $67.50 (50%)
  2. 2nd: $40.50 (30%)
  3. 3rd: $20.25 (15%)
  4. 4th: $6.75 (5%)

**Boss Tournament** (Fills: 31 players, Entry: $7.99 USDC or Boss Ticket):
- Total pot: $247.69
- Prize pool (80%): $198.15
- House cut (20%): $49.54
- Payouts:
  1. 1st: $98 (49.5%)
  2. 2nd: $59 (30%)
  3. 3rd: $29.50 (15%)
  4. 4th: $9.85 (5%)
  5. 5th: $2 (0.5%)

**Championship** (Fills: 200 players, Entry: $50 USDC or Championship Ticket):
- Total pot: $10,000
- Prize pool (80%): $8,000
- House cut (20%): $2,000
- Payouts: Top 5 split (TBD exact percentages)

**Tournament Features**:
- Unlimited instances: New instance auto-creates when current fills
- Real-time leaderboards via Socket.IO (5s update interval)
- Scoring: Total fish weight OR total XP (depends on tournament type)
- Anti-cheat: Server-side catch validation, FID-based rate limits
- Settlement: Backend calls `TournamentEscrow.distributePrize()` with calculated amounts

### Monetization Model

**Season Pass ($9.99 USDC, 60-day duration)**:

| Feature | Free | Premium |
|---------|------|---------|
| Cast regeneration | 1 cast per 2 hours (max 15) | Unlimited |
| XP multiplier | 1x | 2x |
| Daily rewards | Basic bait | Premium bait |
| Rod set | Bamboo only | 5-piece Pirate set (soulbound) |
| Level 50 animation | None | Pirate ship cannon |
| Marketplace | Buy only | Buy + Sell |
| Ad skip | Watch for casts | 1 free skip per day |

**Marketplace**:
- 10% fee on all sales (enforced in smart contract)
- Tradeable items: Bait, tickets, loot drops, fish (collection completion)
- Soulbound items (cannot list): Season pass, premium rod parts, titles
- Payment: USDC only
- Listing duration: 7 days, auto-cancel after expiry

**Ad Monetization** (Google AdMob):
- Rewarded video: Watch ad → +2 casts + 25 coins
- Frequency cap: Max 5 ads per day (anti-spam)
- Integration via `AdOverlay.tsx` component

## Critical Implementation Patterns

### Farcaster Mini App Compliance

**NEVER DO:**
- ❌ Use legacy Frames v1 syntax (`fc:frame:image`, `fc:frame:button`)
- ❌ Mix Frame and Mini App terminology
- ❌ Invent manifest fields not in official schema
- ❌ Use `fc:frame` meta tag for new implementations
- ❌ Skip domain signing (builder rewards require it)
- ❌ Test with dev tunnels in production

**ALWAYS DO:**
- ✅ Use `fc:miniapp` meta tag for Mini App v2
- ✅ Call `sdk.actions.ready()` immediately after mount
- ✅ Verify manifest fields against `@farcaster/miniapp-sdk` schema
- ✅ Include `baseBuilderAddress` and `contractAddresses` in manifest
- ✅ Target Base L2 ONLY (chainId 8453 mainnet, 84532 testnet)
- ✅ Ensure all manifest image URLs are live and correct dimensions
- ✅ Validate webhook signatures from Farcaster

### Web3 Best Practices

**USDC Handling**:
- Base Native USDC address: `0xD9aAEc86B65D86f6A7B5B1b0c42FFF36152b37f8` (mainnet)
- Always use 6 decimals: `parseUnits(amount, 6)`
- Check allowance before contract calls via `useContracts.approveUSDC()`
- Handle approval flow: Request approval → Wait for confirmation → Retry main transaction

**Transaction Flow**:
1. Check current allowance via `publicClient.readContract()`
2. If insufficient, call `approve()` and throw error with user message
3. User confirms approval transaction
4. Retry main transaction (purchase, tournament entry, etc.)
5. Wait for confirmation via `useWaitForTransactionReceipt()`
6. Sync on-chain state to local store

**State Synchronization**:
- On wallet connect: Call `checkSeasonPass(address)` to verify on-chain ownership
- If blockchain shows premium but local state doesn't: Call `syncPremiumStatus(true)`
- Toast notification: "Restored Season Pass from On-Chain!"
- Never trust client state for premium benefits on backend

### Security Requirements

**Server-Side Validation**:
- ✅ NEVER trust client XP, scores, or catch data
- ✅ Validate all catches server-side (timing, bait consumption, RNG seed verification)
- ✅ Rate limit casts: 3 per 6 hours for free users (check against `lastCastRefill`)
- ✅ FID-based identity for anti-sybil (no duplicate accounts)
- ✅ Audit log all USDC transactions (wallet, amount, timestamp, tx hash)

**Smart Contract Security**:
- ✅ ReentrancyGuard on all payable functions
- ✅ Ownable pattern for admin functions (minting, fee withdrawals)
- ✅ SafeERC20 for all token transfers
- ✅ Input validation (require statements with descriptive errors)
- ✅ Soulbound enforcement in `_update()` override
- ✅ Fee cap validation (max 20% for tournaments)

**Frontend Security**:
- ✅ Input sanitization via Zod schemas
- ✅ CORS headers for Mini App embedding
- ✅ CSP headers to prevent XSS
- ✅ No private keys in code or commits
- ✅ Environment variables via Doppler (see SECRETS-MANAGEMENT.md)

### Performance Optimization

**Frontend**:
- Lazy load heavy components (Fabric.js canvas, tournament board)
- Debounce Socket.IO updates (5s interval)
- Cache fish images in service worker
- Optimize canvas rendering: RequestAnimationFrame for animations
- Zustand partial state updates to minimize re-renders

**Backend**:
- Redis caching for leaderboards (TTL: 5s)
- Database indexing: FID, tournament ID, timestamp columns
- Batch database writes for catch logs
- Connection pooling for PostgreSQL (Prisma config)

**Smart Contracts**:
- Optimizer enabled (200 runs)
- Batch operations where possible (`mintTicketBatch`)
- Efficient storage layout (pack structs)
- View functions for all read operations (no gas cost)

## Environment Variables

**Frontend** (`.env`):
```bash
# Farcaster
VITE_FARCASTER_APP_ID=seacaster
VITE_APP_URL=https://seacaster.app

# Base
VITE_BASE_RPC_MAINNET=https://mainnet.base.org
VITE_BASE_RPC_SEPOLIA=https://sepolia.base.org
VITE_USDC_ADDRESS=0xD9aAEc86B65D86f6A7B5B1b0c42FFF36152b37f8
VITE_SEASON_PASS_ADDRESS=0x6E1A9f233A4128d0386Ac8cD6A53844787891971
VITE_TOURNAMENT_ESCROW_ADDRESS=0x9465e54e3287ea00E4cF243f86FB927849e780e3
VITE_MARKETPLACE_ADDRESS=0x47DD58c99EE81910f4631Df3aF8Cc8FbfBb25Baf

# Wallet
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id

# API
VITE_BACKEND_URL=https://api.seacaster.app
VITE_SOCKET_URL=wss://api.seacaster.app

# Ads
VITE_ADMOB_APP_ID=ca-app-pub-xxxxx
```

**Backend** (`.env` via Doppler):
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/seacaster
REDIS_URL=redis://default:pass@host:6379

# JWT
JWT_SECRET=your_secret_here

# Farcaster
FARCASTER_WEBHOOK_SECRET=your_webhook_secret

# Web3
PRIVATE_KEY=0x...
RPC_BASE_URL=https://mainnet.base.org
ETHERSCAN_API_KEY=your_etherscan_key

# Admin
ADMIN_WALLET_ADDRESS=0x...
```

## File Structure

```
/SeaCaster/
├── README.md                     # Complete setup guide
├── package.json                  # Root dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite build config
├── tailwind.config.js            # Tailwind CSS config
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker
├── index.html                    # Entry HTML with meta tags
├── index.tsx                     # React entry point
├── App.tsx                       # Main app component
├── types.ts                      # Global TypeScript types
├── constants.ts                  # Game constants (fish, baits, XP)
│
├── .well-known/
│   └── farcaster.json            # Farcaster Mini App manifest
│
├── components/                   # React UI components
│   ├── FishingScene.tsx          # Fabric.js canvas fishing view
│   ├── GameHUD.tsx               # Top bar (XP, coins, casts)
│   ├── BaitSelector.tsx          # Bait radial menu
│   ├── FishModal.tsx             # Catch reward modal
│   ├── TournamentBoard.tsx       # Live leaderboards
│   ├── TournamentCard.tsx        # Tournament instance card
│   ├── MarketplaceTab.tsx        # P2P marketplace UI
│   ├── ProfileModal.tsx          # User stats & wallet
│   ├── DailyStreak.tsx           # Streak counter UI
│   ├── AdOverlay.tsx             # AdMob integration
│   ├── Toast.tsx                 # Toast notification system
│   └── ErrorBoundary.tsx         # Error fallback UI
│
├── hooks/                        # React hooks
│   ├── useContracts.ts           # Smart contract interactions
│   ├── useTournament.ts          # Tournament state & Socket.IO
│   └── useSound.ts               # Sound effects (optional)
│
├── store/                        # Zustand state stores
│   ├── gameStore.ts              # Game state with persistence
│   └── uiStore.ts                # UI state (toasts, modals)
│
├── services/                     # External integrations
│   ├── farcaster.ts              # Farcaster SDK wrapper
│   └── socket.ts                 # Socket.IO client setup
│
├── providers/                    # React context providers
│   └── Web3Provider.tsx          # wagmi + OnchainKit setup
│
├── utils/                        # Utility functions
│   ├── haptics.ts                # Vibration API helpers
│   ├── formatters.ts             # Number/date formatters
│   └── validators.ts             # Input validation
│
├── backend/                      # Express backend
│   ├── server.ts                 # Main Express app
│   ├── routes/
│   │   ├── webhook.ts            # Farcaster webhook handler
│   │   └── game.ts               # Game API routes
│   ├── services/
│   │   └── tournamentService.ts  # Tournament scheduling
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       └── seed.ts               # Test data seeding
│
├── contracts/                    # Hardhat workspace
│   ├── contracts/
│   │   ├── SeaCasterPass.sol     # ERC-1155 season pass
│   │   ├── TournamentEscrow.sol  # Prize pool management
│   │   ├── Marketplace.sol       # P2P trading
│   │   ├── MockUSDC.sol          # Test USDC
│   │   └── MockERC20.sol         # Test ERC20
│   ├── scripts/
│   │   └── deploy.ts             # Deployment script
│   ├── test/                     # Contract tests
│   ├── abis.ts                   # Generated ABIs
│   ├── hardhat.config.ts         # Hardhat config
│   ├── package.json
│   └── README.md
│
└── .agent/                       # AI agent rules
    └── rules/
        ├── seacaster.md          # Farcaster Mini App spec
        └── onchainkit.md         # OnchainKit patterns
```

## Testing Strategy

**Frontend Unit Tests**:
- Fishing RNG calculations (bait effects, rarity weights)
- XP formulas (level requirements, rod bonuses)
- Cast regeneration timing
- Daily streak logic
- Inventory management

**Backend Integration Tests**:
- Tournament lifecycle (create → fill → settle)
- Prize distribution calculations
- Webhook signature validation
- Rate limiting enforcement
- Anti-cheat catch validation

**Contract Tests** (Hardhat):
- Season pass purchase and expiry
- Tournament entry (ticket vs USDC paths)
- Prize distribution with fee splits
- Soulbound transfer blocking
- Edge cases: cancelled tournaments, duplicate entries, zero-value transfers

**E2E Tests** (Playwright/Cypress):
- Full fishing loop (cast → wait → catch → reward)
- Season pass purchase flow (approval → purchase → sync)
- Tournament entry and leaderboard updates
- Marketplace listing and buying
- Share to Farcaster compose

## Deployment Workflow

**Frontend** (Vercel):
1. Push to `main` branch
2. Vercel auto-builds and deploys
3. Update DNS: `seacaster.app` → Vercel project
4. Verify manifest at `https://seacaster.app/.well-known/farcaster.json`

**Backend** (Railway/Cloud Run):
1. Build Docker image or use Railway buildpack
2. Set environment variables via Doppler
3. Deploy with health check endpoint
4. Configure domain: `api.seacaster.app`

**Smart Contracts** (Base):
1. Run tests: `npm test` (all pass)
2. Deploy to Base Sepolia: `npm run deploy:sepolia`
3. Verify on BaseScan: `npm run verify`
4. Test with testnet USDC
5. Deploy to Base mainnet: `npm run deploy:mainnet`
6. Update manifest with production addresses
7. Transfer ownership to multisig wallet

## Additional Documentation

- **Farcaster Mini App Spec**: `.agent/rules/seacaster.md` - Comprehensive checklist
- **OnchainKit Patterns**: `.agent/rules/onchainkit.md` - Component usage
- **Contract Deployment**: `contracts/DEPLOYMENT.md`, `contracts/DEPLOY-NOW.md`
- **Secrets Management**: `SECRETS-MANAGEMENT.md` - Doppler CLI guide
- **Production Checklist**: `README.md` - Launch verification steps
