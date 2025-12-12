# SeaCaster Backend

Production-grade backend API for SeaCaster - A Farcaster Mini App fishing game on Base L2.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **GraphQL**: Apollo Server 4
- **Real-time**: Socket.IO
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (Upstash)
- **Authentication**: JWT
- **Validation**: Zod
- **Blockchain**: ethers.js (Base L2)
- **Scheduling**: node-cron

## Architecture

```
backend/
├── src/
│   ├── server.ts              # Main Express + Apollo + Socket.IO server
│   ├── constants.ts            # Game constants (fish, baits, XP formulas)
│   ├── graphql/
│   │   ├── schema.ts           # GraphQL type definitions
│   │   └── resolvers.ts        # GraphQL resolvers
│   ├── services/
│   │   ├── tournamentService.ts        # Tournament logic & scheduling
│   │   ├── catchValidationService.ts   # Anti-cheat validation
│   │   └── marketplaceService.ts       # P2P trading logic
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication
│   │   └── rateLimiter.ts      # Rate limiting (anti-spam)
│   ├── sockets/
│   │   └── tournamentSocket.ts # Real-time leaderboard updates
│   └── routes/
│       ├── webhook.ts          # Farcaster Mini App webhooks
│       └── game.ts             # REST API endpoints
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Test data seeding
├── package.json
└── tsconfig.json
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Supabase)
- Redis (or Upstash)
- Doppler CLI (for secrets management)

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `FRONTEND_URL`: Frontend URL for CORS
- `FARCASTER_WEBHOOK_SECRET`: Farcaster webhook validation

**Optional Variables:**
- `REDIS_URL`: Redis connection (for caching)
- `PRIVATE_KEY`: Wallet private key (for contract interactions)
- `SENTRY_DSN`: Error monitoring

### Database Setup

```bash
# Generate Prisma Client
npm run generate

# Run migrations
npm run migrate

# Seed with test data (development only)
npm run seed
```

### Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:8080`

**Endpoints:**
- GraphQL: `http://localhost:8080/graphql`
- GraphQL Playground: `http://localhost:8080/graphql` (development only)
- Socket.IO: `ws://localhost:8080`
- Health: `http://localhost:8080/health`

## API Documentation

### GraphQL API

#### Queries

```graphql
query {
  # Get current user
  me {
    fid
    username
    xp
    level
    coins
    premium
    inventory {
      baits
      rods
      activeBaitId
    }
  }

  # Get active tournaments
  activeTournaments {
    id
    title
    type
    prizePool
    currentParticipants
    maxParticipants
    timeRemaining
  }

  # Get tournament leaderboard
  tournamentLeaderboard(tournamentId: "abc123", limit: 50) {
    user {
      fid
      username
      level
    }
    score
    rank
  }

  # Get marketplace listings
  marketplaceListings(itemType: BAIT, limit: 20) {
    listings {
      id
      itemId
      priceCoins
      seller {
        username
      }
    }
    hasMore
  }
}
```

#### Mutations

```graphql
mutation {
  # Sync user profile
  syncUserProfile(input: {
    fid: 123
    username: "captain_dev"
    walletAddress: "0x..."
  }) {
    fid
    username
  }

  # Validate and record catch (anti-cheat)
  validateCatch(input: {
    fid: 123
    fishId: "tuna"
    weight: 5.2
    rarity: "Rare"
    baitUsed: "squid"
    reactionTime: 890
    timestamp: 1234567890000
    clientSeed: "random"
  }) {
    valid
    catch {
      xpGained
      coinsGained
    }
  }

  # Claim daily reward
  claimDailyReward {
    success
    coinsAwarded
    castsAwarded
    newStreak
  }

  # Open prestige chest
  openPrestigeChest {
    success
    coinsAwarded
    baitsAwarded
  }

  # Enter tournament
  enterTournament(tournamentId: "abc123", entryMethod: USDC) {
    id
    tournament {
      title
    }
    score
  }

  # Create marketplace listing (premium only)
  createListing(input: {
    itemType: BAIT
    itemId: "chum"
    quantity: 5
    priceCoins: 500
  }) {
    id
    status
    expiresAt
  }

  # Buy marketplace listing
  buyListing(listingId: "xyz789") {
    id
    pricePaid
  }
}
```

### REST API Endpoints

#### POST /api/game/sync
Sync user profile and game state.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Body:**
```json
{
  "username": "captain_dev",
  "walletAddress": "0x...",
  "pfpUrl": "https://..."
}
```

#### POST /api/game/validate-catch
Validate and record a fish catch (anti-cheat).

**Body:**
```json
{
  "fishId": "tuna",
  "weight": 5.2,
  "rarity": "Rare",
  "baitUsed": "squid",
  "reactionTime": 890,
  "timestamp": 1234567890000,
  "clientSeed": "random_seed",
  "tournamentId": "abc123"
}
```

#### POST /api/game/regenerate-casts
Trigger cast regeneration calculation.

**Response:**
```json
{
  "castsRemaining": 12,
  "castsRestored": 2,
  "nextCastIn": 3600000
}
```

#### GET /api/game/profile/:fid
Get user profile and stats.

### Socket.IO Events

#### Client → Server

```javascript
// Join tournament room
socket.emit('join:tournament', tournamentId)

// Leave tournament room
socket.emit('leave:tournament', tournamentId)

// Request leaderboard update
socket.emit('leaderboard:request', tournamentId)
```

#### Server → Client

```javascript
// Leaderboard update (every 5 seconds)
socket.on('leaderboard:update', (leaderboard) => {
  // Array of { rank, fid, username, score, payout }
})

// Tournament event
socket.on('tournament:update', (event) => {
  // { tournamentId, action: 'NEW_ENTRY' | 'SCORE_UPDATED' | 'SETTLED', timestamp }
})

// Error
socket.on('error', (error) => {
  // { message: string }
})
```

## Anti-Cheat System

The backend validates all catches server-side to prevent cheating:

1. **Timing Validation**: Reaction time must be within fish's catch window (adjusted for player level)
2. **Rate Limiting**: Max 3 catches per 30 seconds
3. **Cast Validation**: Users must have casts remaining (unless premium)
4. **Fish Data Validation**: Fish ID and rarity must match
5. **Timestamp Validation**: Catch timestamp must be recent (<60 seconds)

## Tournament System

### Automatic Scheduling

Cron jobs handle tournament lifecycle:

- **Every 5 minutes**: Check and settle ended tournaments
- **Every hour**: Auto-create new tournament instances
- **Every hour**: Expire old marketplace listings
- **Daily at 2am**: Cleanup old rate limit entries

### Tournament Types

| Type | Prize Pool | Entry Fee | Max Players | House Cut | Duration |
|------|-----------|-----------|-------------|-----------|----------|
| Daily | $30 | $0.50 | 60 | 10% | 24 hours |
| Weekly | $150 | $2.00 | 75 | 10% | 7 days |
| Boss | $247.69 | $7.99 | 31 | 20% | 24 hours |
| Championship | $10,000 | $50.00 | 200 | 20% | 7 days |

### Prize Distribution

- **Daily**: 50%, 30%, 15%, 5% (top 4)
- **Weekly**: 50%, 30%, 15%, 5% (top 4)
- **Boss**: 49.5%, 30%, 15%, 5%, 0.5% (top 5)
- **Championship**: 30%, 25%, 15%, 10%, 10%, 5%, 5% (top 7)

## Database Schema

Key models:

- **User**: FID-based identity, XP, level, coins, premium status, inventory
- **Inventory**: Baits, rods, premium parts (JSON)
- **Tournament**: Type, prize pool, participants, status
- **TournamentEntry**: User scores and ranks
- **Catch**: Fish catches with validation data
- **MarketplaceListing**: P2P item trading
- **AuditLog**: All critical actions logged

## Security

### Authentication

JWT tokens with 7-day expiration:

```typescript
const token = generateToken(fid, username, isAdmin)
```

Middleware validates tokens on protected routes:

```typescript
router.use(verifyToken)
```

### Rate Limiting

Prevents abuse:

- **Cast**: 3 per 6 hours (free), unlimited (premium)
- **API Call**: 100 per minute
- **Tournament Entry**: 5 per minute

### Input Validation

All inputs validated with Zod schemas:

```typescript
const ValidateCatchSchema = z.object({
  fishId: z.string(),
  weight: z.number().positive(),
  rarity: z.string(),
  // ...
})
```

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

### Logging

Structured logs with Winston:

```
[2025-01-01T00:00:00.000Z] GET /graphql
[Settlement] Processing Daily Catch Challenge (abc123)
[Socket.IO] Client connected: xyz789
[Webhook] Received event: miniapp_added FID: 123
```

### Audit Trail

All critical actions logged to `AuditLog` table:
- Season pass purchases
- Tournament entries and wins
- Rare/Legendary catches
- Marketplace transactions
- Server errors

## Deployment

### Build

```bash
npm run build
```

Output: `dist/` directory

### Production

```bash
NODE_ENV=production npm start
```

### Environment Variables (Production)

Use Doppler or similar secrets manager:

```bash
doppler run -- npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 8080
CMD ["npm", "start"]
```

### Recommended Hosting

- **Railway**: Auto-deployment from Git
- **Google Cloud Run**: Serverless containers
- **Render**: Easy PostgreSQL + Redis

## Testing

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

## Contributing

1. Create feature branch
2. Write tests
3. Run `npm run migrate` if schema changed
4. Test locally with `npm run dev`
5. Submit PR with description

## Support

For issues or questions, contact the SeaCaster team on Farcaster:
- @pirosb3
- @linda
- @deodad
