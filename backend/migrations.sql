-- SeaCaster Initial Schema Migration (Run in Supabase SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. MVP Leaderboard (From Guide)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS scores_address_idx ON scores (address);
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
-- Service Role bypasses RLS automatically.
-- Optional: Public read access
CREATE POLICY "Allow public read access" ON scores FOR SELECT TO anon USING (true);

-- 1. ENUMS
CREATE TYPE "TournamentType" AS ENUM ('Daily', 'Weekly', 'Boss', 'Championship');
CREATE TYPE "TournamentStatus" AS ENUM ('OPEN', 'LIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "EntryMethod" AS ENUM ('TICKET', 'USDC');
CREATE TYPE "ItemType" AS ENUM ('BAIT', 'ROD', 'TICKET', 'LOOT', 'FISH');
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED');

-- 2. TABLES

-- User Table
CREATE TABLE "User" (
    "fid" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "walletAddress" TEXT,
    "pfpUrl" TEXT,
    "xp" INTEGER DEFAULT 0,
    "level" INTEGER DEFAULT 1,
    "coins" INTEGER DEFAULT 100,
    "premium" BOOLEAN DEFAULT false,
    "premiumExpiresAt" TIMESTAMP(3),
    "streak" INTEGER DEFAULT 1,
    "highestStreak" INTEGER DEFAULT 1,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "castsRemaining" INTEGER DEFAULT 15,
    "maxCasts" INTEGER DEFAULT 15,
    "lastCastRefill" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingChests" INTEGER DEFAULT 0,
    "notificationsEnabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("fid")
);

-- Indexes
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");
CREATE INDEX "User_lastLogin_idx" ON "User"("lastLogin");

-- Inventory Table
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "baits" JSONB DEFAULT '{"worm": 999}',
    "rods" JSONB DEFAULT '["bamboo"]',
    "premiumParts" JSONB DEFAULT '{}',
    "activeBaitId" TEXT DEFAULT 'worm',
    "activeRodId" TEXT DEFAULT 'bamboo',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Inventory_userId_key" ON "Inventory"("userId");
CREATE INDEX "Inventory_userId_idx" ON "Inventory"("userId");

-- Tournament Table
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "type" "TournamentType" NOT NULL,
    "title" TEXT NOT NULL,
    "prizePool" DECIMAL(10,2) NOT NULL,
    "entryFee" DECIMAL(10,2) NOT NULL,
    "houseCutPercent" DECIMAL(5,2) DEFAULT 10.00,
    "maxParticipants" INTEGER DEFAULT 60,
    "currentParticipants" INTEGER DEFAULT 0,
    "status" "TournamentStatus" DEFAULT 'OPEN',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "contractTournamentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Tournament_type_status_idx" ON "Tournament"("type", "status");
CREATE INDEX "Tournament_endTime_idx" ON "Tournament"("endTime");
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- TournamentEntry (Leaderboard)
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION DEFAULT 0,
    "rank" INTEGER DEFAULT 0,
    "payout" DECIMAL(10,2),
    "entryMethod" "EntryMethod" NOT NULL,
    "ticketId" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TournamentEntry_tournamentId_userId_key" ON "TournamentEntry"("tournamentId", "userId");
CREATE INDEX "TournamentEntry_tournamentId_score_idx" ON "TournamentEntry"("tournamentId", "score");
CREATE INDEX "TournamentEntry_userId_idx" ON "TournamentEntry"("userId");

-- MarketplaceListing
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "priceCoins" INTEGER NOT NULL,
    "status" "ListingStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketplaceListing_status_itemType_idx" ON "MarketplaceListing"("status", "itemType");
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "MarketplaceListing"("sellerId");
CREATE INDEX "MarketplaceListing_expiresAt_idx" ON "MarketplaceListing"("expiresAt");

-- MarketplacePurchase
CREATE TABLE "MarketplacePurchase" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "marketplaceFee" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplacePurchase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketplacePurchase_listingId_key" ON "MarketplacePurchase"("listingId");
CREATE INDEX "MarketplacePurchase_buyerId_idx" ON "MarketplacePurchase"("buyerId");
CREATE INDEX "MarketplacePurchase_purchasedAt_idx" ON "MarketplacePurchase"("purchasedAt");

-- Catch Log
CREATE TABLE "Catch" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "fishId" TEXT NOT NULL,
    "fishName" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "xpGained" INTEGER NOT NULL,
    "coinsGained" INTEGER NOT NULL,
    "baitUsed" TEXT NOT NULL,
    "reactionTime" DOUBLE PRECISION NOT NULL,
    "tournamentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Catch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Catch_userId_timestamp_idx" ON "Catch"("userId", "timestamp");
CREATE INDEX "Catch_tournamentId_idx" ON "Catch"("tournamentId");
CREATE INDEX "Catch_rarity_idx" ON "Catch"("rarity");

-- AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "txHash" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_txHash_idx" ON "AuditLog"("txHash");

-- Rate Limit
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RateLimitEntry_unique_limit" ON "RateLimitEntry"("userId", "action", "windowStart");
CREATE INDEX "RateLimitEntry_user_aciton_idx" ON "RateLimitEntry"("userId", "action");

-- Foreign Keys
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Catch" ADD CONSTRAINT "Catch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tournament" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TournamentEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketplaceListing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketplacePurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Catch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitEntry" ENABLE ROW LEVEL SECURITY;

-- Optional: Public Read Policies
CREATE POLICY "Public Read Tournaments" ON "Tournament" FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Listings" ON "MarketplaceListing" FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Profiles" ON "User" FOR SELECT TO anon USING (true);

-- Private Policies (Explicit Deny for Anon to satisfy Linter)
-- Service Role bypasses these automatically
CREATE POLICY "Private: AuditLog" ON "AuditLog" FOR ALL TO anon USING (false);
CREATE POLICY "Private: Catch" ON "Catch" FOR ALL TO anon USING (false);
CREATE POLICY "Private: Inventory" ON "Inventory" FOR ALL TO anon USING (false);
CREATE POLICY "Private: MarketplacePurchase" ON "MarketplacePurchase" FOR ALL TO anon USING (false);
CREATE POLICY "Private: RateLimitEntry" ON "RateLimitEntry" FOR ALL TO anon USING (false);
CREATE POLICY "Private: TournamentEntry" ON "TournamentEntry" FOR ALL TO anon USING (false);
