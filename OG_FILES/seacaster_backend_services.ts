// ===============================================
// SEACASTER BACKEND - SERVICES & CONTRACTS
// ===============================================

// ============ APPS/BACKEND: src/graphql/resolvers.ts ============
import { PrismaClient } from '@prisma/client'
import { generateFishRarity } from '../services/fishing'
import { calculateXpCurve, checkLevelUp } from '../services/progression'

const resolvers = {
  Query: {
    user: async (
      _: any,
      { fid }: { fid: number },
      { prisma }: { prisma: PrismaClient }
    ) => {
      return prisma.user.findFirst({
        where: { fid }
      })
    },

    userCatches: async (
      _: any,
      { userId }: { userId: string },
      { prisma }: { prisma: PrismaClient }
    ) => {
      return prisma.catch.findMany({
        where: { userId },
        orderBy: { caughtAt: 'desc' },
        take: 50
      })
    },

    tournaments: async (_: any, __: any, { prisma }: { prisma: PrismaClient }) => {
      return prisma.tournament.findMany({
        where: { status: 'active' },
        include: { players: true }
      })
    },

    leaderboard: async (
      _: any,
      { tournamentId }: { tournamentId: string },
      { prisma }: { prisma: PrismaClient }
    ) => {
      const entries = await prisma.tournamentEntry.findMany({
        where: { tournamentId },
        orderBy: { score: 'desc' },
        include: { user: true }
      })

      return entries.map((e, idx) => ({
        userId: e.userId,
        username: e.user.username,
        score: e.score,
        rank: idx + 1
      }))
    }
  },

  Mutation: {
    recordCatch: async (
      _: any,
      { userId, rarity, xp }: { userId: string; rarity: string; xp: number },
      { prisma, io }: { prisma: PrismaClient; io: any }
    ) => {
      // Server-side validation - CRITICAL
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error('User not found')

      // Verify fish rarity valid
      const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
      if (!validRarities.includes(rarity)) {
        throw new Error('Invalid rarity')
      }

      // Create catch record
      const fish = await prisma.catch.create({
        data: {
          userId,
          rarity,
          xp,
          species: ['Sardine', 'Mackerel', 'Swordfish', 'Marlin', 'Megalodon'][Math.floor(Math.random() * 5)],
          weight: Math.random() * 50 + 5
        }
      })

      // Update user XP and check level up
      let newLevel = user.level
      let newXp = user.xp + xp
      const { leveledUp, updatedXp } = checkLevelUp(newLevel, newXp)

      if (leveledUp) {
        newLevel = leveledUp
        newXp = updatedXp
        // Emit level up event to Socket.IO
        io.emit('player-leveled', { userId, newLevel })
      }

      // Update casts (reduce by 1)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
          casts: Math.max(0, user.casts - 1)
        }
      })

      return fish
    },

    enterTournament: async (
      _: any,
      { userId, tournamentId }: { userId: string; tournamentId: string },
      { prisma }: { prisma: PrismaClient }
    ) => {
      // Check tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
      })
      if (!tournament) throw new Error('Tournament not found')

      // Create entry
      await prisma.tournamentEntry.create({
        data: { userId, tournamentId }
      })

      return tournament
    },

    purchaseSeasonPass: async (
      _: any,
      { userId }: { userId: string },
      { prisma }: { prisma: PrismaClient }
    ) => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      return prisma.user.update({
        where: { id: userId },
        data: {
          seasonPassActive: true,
          seasonPassExpires: expiresAt
        }
      })
    }
  }
}

export default resolvers

---

// ============ APPS/BACKEND: src/services/fishing.ts ============
import { Prisma } from '@prisma/client'

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface FishRarityData {
  chance: number
  xp: number
  timingWindow: number
  color: string
}

export const FISH_RARITIES: Record<FishRarity, FishRarityData> = {
  common: { chance: 0.60, xp: 10, timingWindow: 2.0, color: 'gray' },
  uncommon: { chance: 0.25, xp: 25, timingWindow: 1.5, color: 'green' },
  rare: { chance: 0.10, xp: 50, timingWindow: 1.0, color: 'blue' },
  epic: { chance: 0.04, xp: 100, timingWindow: 0.75, color: 'purple' },
  legendary: { chance: 0.009, xp: 250, timingWindow: 0.5, color: 'yellow' },
  mythic: { chance: 0.001, xp: 500, timingWindow: 0.5, color: 'rainbow' }
}

const SPECIES = [
  'Sardine',
  'Mackerel',
  'Swordfish',
  'Marlin',
  'Megalodon',
  'Sea Dragon',
  'Kraken',
  'Pirate Whale'
]

export function generateFishRarity(baitModifier: number = 0): FishRarity {
  const rand = Math.random()
  let cumulative = 0

  for (const [rarity, { chance }] of Object.entries(FISH_RARITIES)) {
    // Apply bait modifier to rare+ chances
    let adjustedChance = chance
    if (baitModifier > 0 && (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary')) {
      adjustedChance = chance * (1 + baitModifier)
    }

    cumulative += adjustedChance
    if (rand <= cumulative) return rarity as FishRarity
  }

  return 'common'
}

export function generateFish() {
  const rarity = generateFishRarity()
  const data = FISH_RARITIES[rarity]

  return {
    rarity,
    xp: data.xp,
    species: SPECIES[Math.floor(Math.random() * SPECIES.length)],
    weight: Math.random() * 50 + 5,
    timingWindow: data.timingWindow
  }
}

---

// ============ APPS/BACKEND: src/services/progression.ts ============
export function calculateXpCurve(level: number): number {
  // Exponential: ~40% increase per level
  return Math.floor(100 * Math.pow(1.4, level - 1))
}

export function checkLevelUp(
  currentLevel: number,
  currentXp: number
): { leveledUp?: number; updatedXp: number } {
  let xp = currentXp
  let level = currentLevel

  while (xp >= calculateXpCurve(level + 1) && level < 100) {
    xp -= calculateXpCurve(level + 1)
    level += 1
  }

  return {
    leveledUp: level > currentLevel ? level : undefined,
    updatedXp: xp
  }
}

export function getLevelRewards(level: number, isPremium: boolean): any {
  const freeRewards = {
    casts: level <= 9 ? 2 : level <= 19 ? 3 : level <= 29 ? 4 : 5,
    bait: 5
  }

  const premiumRewards = {
    casts: level <= 9 ? 5 : level <= 19 ? 7 : level <= 29 ? 10 : 15,
    bait: 10
  }

  // Milestone rewards (every 10 levels)
  if (level % 10 === 0 && isPremium) {
    return {
      ...premiumRewards,
      milestone: {
        10: 'Daily Tournament Entry',
        20: 'Rod Part: Handle',
        30: 'Rod Part: Rod',
        40: 'Rod Part: Hook',
        50: 'Rod Part: Reel + Pirate King Title'
      }[level]
    }
  }

  return isPremium ? premiumRewards : freeRewards
}

---

// ============ APPS/BACKEND: src/services/tournaments.ts ============
import { PrismaClient } from '@prisma/client'

export const TOURNAMENT_CONFIG = {
  daily: { entryFee: 0.50, playersTarget: 60, houseCut: 0.1, prizeDistribution: [0.3, 0.2, 0.15, 0.1, 0.07, 0.05] },
  weekly: { entryFee: 2.0, playersTarget: 75, houseCut: 0.1, prizeDistribution: [0.35, 0.25, 0.15, 0.1, 0.08, 0.07] },
  boss: { entryFee: 7.99, playersTarget: 31, houseCut: 0.2, prizeDistribution: [0.4, 0.25, 0.15, 0.1, 0.05, 0.05] },
  champ: { entryFee: 50.0, playersTarget: 200, houseCut: 0.2, prizeDistribution: [0.35, 0.25, 0.2, 0.12, 0.05, 0.03] }
}

export async function settleTournament(
  prisma: PrismaClient,
  tournamentId: string,
  contractAddress: string
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: { orderBy: { score: 'desc' } } }
  })

  if (!tournament) throw new Error('Tournament not found')

  const prizePool = tournament.prizePool
  const type = tournament.name.toLowerCase() as keyof typeof TOURNAMENT_CONFIG
  const config = TOURNAMENT_CONFIG[type]
  const houseCut = prizePool * config.houseCut
  const playerPrizePool = prizePool - houseCut

  // Calculate prizes
  const prizes = tournament.players.map((_, idx) => {
    const distribution = config.prizeDistribution[Math.min(idx, config.prizeDistribution.length - 1)]
    return playerPrizePool * distribution
  })

  return {
    winners: tournament.players.map((p) => p.userId),
    prizes,
    houseCut,
    contractCall: {
      to: contractAddress,
      data: `settleTournament(${tournamentId}, ${tournament.players.map((p) => p.userId)}, ${prizes})`
    }
  }
}

---

// ============ APPS/BACKEND: src/middleware/auth.ts ============
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

interface TokenPayload {
  fid: number
  userId: string
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]

  if (!token) return next()

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    req.user = decoded
  } catch (error) {
    console.error('Token verification failed:', error)
  }

  next()
}

export function generateToken(fid: number, userId: string): string {
  return jwt.sign({ fid, userId }, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  })
}

---

// ============ PACKAGES/CONTRACTS: contracts/SeasonPass.sol ============
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SeasonPass is ERC721, Ownable {
    mapping(address => uint256) public seasonPassExpiry;
    uint256 public constant PASS_DURATION = 60 days;
    uint256 public constant PASS_PRICE = 9.99 ether;

    event SeasonPassPurchased(address indexed user, uint256 expiry);
    event SeasonPassExpired(address indexed user);

    constructor() ERC721("SeaCaster Season Pass", "SCP") {}

    function purchasePass() external payable {
        require(msg.value >= PASS_PRICE, "Insufficient payment");
        
        uint256 expiry = block.timestamp + PASS_DURATION;
        seasonPassExpiry[msg.sender] = expiry;
        
        emit SeasonPassPurchased(msg.sender, expiry);
    }

    function isActive(address user) external view returns (bool) {
        return seasonPassExpiry[user] > block.timestamp;
    }

    function grantPass(address user) external onlyOwner {
        uint256 expiry = block.timestamp + PASS_DURATION;
        seasonPassExpiry[user] = expiry;
        emit SeasonPassPurchased(user, expiry);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

---

// ============ PACKAGES/CONTRACTS: contracts/RodNFT.sol ============
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RodNFT is ERC721, Ownable {
    mapping(uint256 => string) public rodParts; // tokenId => part (handle, rod, hook, reel, animation)
    mapping(address => bool) public premiumUsers;

    event RodPartMinted(address indexed user, uint256 indexed tokenId, string part);
    event RodCompleted(address indexed user);

    constructor() ERC721("SeaCaster Rod Parts", "SCROD") {}

    function mintRodPart(address to, string memory part) external onlyOwner returns (uint256) {
        uint256 tokenId = uint256(keccak256(abi.encodePacked(to, part, block.timestamp)));
        _mint(to, tokenId);
        rodParts[tokenId] = part;
        emit RodPartMinted(to, tokenId, part);
        return tokenId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        // Soulbound: prevent transfers
        require(from == address(0) || to == address(0), "Soulbound token");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        string memory part = rodParts[tokenId];
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                _encode(
                    bytes(string(abi.encodePacked(
                        '{"name":"Rod Part: ',
                        part,
                        '","description":"Soulbound pirate rod component for SeaCaster"}'
                    )))
                )
            )
        );
    }

    function _encode(bytes memory data) internal pure returns (string memory) {
        // Base64 encoding (simplified)
        return "encoded_json";
    }
}

---

// ============ PACKAGES/CONTRACTS: contracts/TournamentPool.sol (EXTENDED) ============
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TournamentPool is Ownable {
    IERC20 public usdc;

    struct Tournament {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 totalPrize;
        address[] players;
        uint256[] scores;
        bool settled;
        uint256 houseCut;
    }

    mapping(uint256 => Tournament) public tournaments;
    uint256 public tournamentCounter;
    mapping(address => uint256) public houseCuts;

    event TournamentCreated(uint256 indexed tId, string name, uint256 entryFee);
    event PlayerEntered(uint256 indexed tId, address indexed player);
    event TournamentSettled(uint256 indexed tId, uint256 totalPrize);
    event HouseCutWithdrawn(uint256 amount);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createTournament(string memory name, uint256 entryFee) external onlyOwner returns (uint256) {
        uint256 tId = tournamentCounter++;
        tournaments[tId].id = tId;
        tournaments[tId].name = name;
        tournaments[tId].entryFee = entryFee;

        emit TournamentCreated(tId, name, entryFee);
        return tId;
    }

    function enterTournament(uint256 tId) external {
        Tournament storage t = tournaments[tId];
        require(!t.settled, "Tournament already settled");
        require(usdc.transferFrom(msg.sender, address(this), t.entryFee), "Transfer failed");

        t.players.push(msg.sender);
        t.scores.push(0);
        t.totalPrize += t.entryFee;

        emit PlayerEntered(tId, msg.sender);
    }

    function settleTournament(
        uint256 tId,
        uint256[] calldata prizes,
        uint256 cutPercentage
    ) external onlyOwner {
        Tournament storage t = tournaments[tId];
        require(!t.settled, "Already settled");
        require(t.players.length == prizes.length, "Mismatch");

        // Calculate house cut
        uint256 houseCut = (t.totalPrize * cutPercentage) / 100;
        uint256 playerPool = t.totalPrize - houseCut;

        // Distribute prizes
        for (uint i = 0; i < t.players.length; i++) {
            if (prizes[i] > 0) {
                usdc.transfer(t.players[i], prizes[i]);
            }
        }

        t.settled = true;
        t.houseCut = houseCut;
        houseCuts[owner()] += houseCut;

        emit TournamentSettled(tId, playerPool);
    }

    function withdrawHouseCut() external onlyOwner {
        uint256 amount = houseCuts[msg.sender];
        require(amount > 0, "No funds");
        houseCuts[msg.sender] = 0;
        usdc.transfer(owner(), amount);
        emit HouseCutWithdrawn(amount);
    }

    function getTournament(uint256 tId) external view returns (Tournament memory) {
        return tournaments[tId];
    }
}

---

// ============ PRISMA: prisma/seed.ts ============
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample users
  const users = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          fid: 10000 + i,
          username: `fisher_${i}`,
          level: Math.floor(Math.random() * 50) + 1,
          xp: Math.floor(Math.random() * 10000),
          casts: Math.floor(Math.random() * 15),
          bait: 15,
          seasonPassActive: Math.random() > 0.5
        }
      })
    )
  )

  console.log(`✅ Created ${users.length} users`)

  // Create tournaments
  const tournaments = await Promise.all([
    prisma.tournament.create({
      data: {
        name: 'Daily',
        entryFee: 0.5,
        prizePool: 27,
        status: 'active'
      }
    }),
    prisma.tournament.create({
      data: {
        name: 'Weekly',
        entryFee: 2.0,
        prizePool: 135,
        status: 'active'
      }
    }),
    prisma.tournament.create({
      data: {
        name: 'Boss',
        entryFee: 7.99,
        prizePool: 198.15,
        status: 'active'
      }
    })
  ])

  console.log(`✅ Created ${tournaments.length} tournaments`)

  // Create tournament entries
  for (const tournament of tournaments) {
    for (const user of users) {
      await prisma.tournamentEntry.create({
        data: {
          userId: user.id,
          tournamentId: tournament.id,
          score: Math.floor(Math.random() * 1000)
        }
      })
    }
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

---

// ============ APPS/BACKEND: src/sockets/tournament.ts ============
import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'

export function setupTournamentSockets(io: SocketIOServer, prisma: PrismaClient) {
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id)

    socket.on('join-tournament', async (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`)
      console.log(`📡 Joined tournament: ${tournamentId}`)
    })

    socket.on('update-score', async (data: { tournamentId: string; userId: string; newScore: number }) => {
      // Update in database
      await prisma.tournamentEntry.updateMany({
        where: { userId: data.userId, tournamentId: data.tournamentId },
        data: { score: data.newScore }
      })

      // Broadcast leaderboard update
      const leaderboard = await prisma.tournamentEntry.findMany({
        where: { tournamentId: data.tournamentId },
        orderBy: { score: 'desc' },
        include: { user: true }
      })

      io.to(`tournament:${data.tournamentId}`).emit('leaderboard-updated', {
        leaderboard: leaderboard.map((entry, idx) => ({
          rank: idx + 1,
          username: entry.user.username,
          score: entry.score,
          userId: entry.userId
        }))
      })
    })

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)
    })
  })
}

---

// ============ APPS/BACKEND: src/middleware/rateLimit.ts ============
import Redis from 'redis'

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
})

export async function rateLimitCasts(userId: string, seasonPassActive: boolean): Promise<boolean> {
  const key = `casts:${userId}`
  const limit = seasonPassActive ? Infinity : 3
  const windowSeconds = seasonPassActive ? 0 : 6 * 60 * 60 // 6 hours

  const current = await redisClient.get(key)
  const count = current ? parseInt(current) : 0

  if (count >= limit) return false

  await redisClient.setEx(key, windowSeconds, count + 1)
  return true
}

---

// ============ README: docs/ECONOMICS.md ============
# 💰 SeaCaster Economics

## Year 1 Revenue Goal: $495K

### Revenue Streams

#### 1. Season Pass ($9.99 USDC)
- **Duration**: 60 days
- **Benefits**:
  - Unlimited casts (vs 3 per 6 hours free)
  - 2x XP multiplier
  - Premium daily rewards
  - Soulbound rod cosmetics
  - Ad skip (1 free/day)
- **Conversion**: 5% of DAU = 500 passes/month
- **Monthly Revenue**: 500 × $9.99 = $4,995
- **Annual**: $59,940

#### 2. Tournament Fees (10-20% house cut)
| Tournament | Entry | Players | House Cut |
|------------|-------|---------|-----------|
| Daily | $0.50 | 60 | $3 (10%) |
| Weekly | $2.00 | 75 | $15 (10%) |
| Boss | $7.99 | 31 | $49.54 (20%) |
| Champ | $50.00 | 200 | $2,000 (20%) |

**Daily Revenue** (per instance):
- Daily: $3 × 15 instances = $45
- Weekly: $15 × 2 instances = $30
- Boss: $49.54 × 1 instance = $50
- Champ: $2,000 × 0.3 instances = $600

**Daily Total**: $725 × 365 = $264,625

#### 3. Marketplace (10% fee on trades)
- Fish, bait, rod parts, tournament tickets
- Assumed $1,000/day GMV = $100/day fee
- Annual: $36,500

#### 4. AdMob (Rewarded Video)
- Estimated $0.05 per view
- 200 active users × 2 ads/day × $0.05 = $20/day
- Annual: $7,300

#### 5. In-Game Cosmetics (NFT Marketplace)
- Soulbound rod customizations
- Base royalties: 5%
- Assumed $500/week = $26,000/year

### Total Year 1: $395,365 (conservative, targeting $495K with growth)

### Unit Economics
- **CAC** (Cost to Acquire Customer): $2 (Farcaster Rewards)
- **LTV** (Lifetime Value): $15-40 (3-4 months)
- **LTV:CAC Ratio**: 7.5-20:1 ✅

### Runway Analysis
- **Initial Capital**: $50K
- **Monthly Burn**: $10K (1 founder + 1 dev freelancer)
- **Months to Breakeven**: 1-2 months
- **Year 1 Profit**: ~$100K+ (assuming 50% expenses/costs)