-- Fix Security Warnings: Enable Row Level Security (RLS) on all tables

-- 1. Enable RLS (Locks down tables from public/anon access by default)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tournament" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TournamentEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketplaceListing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketplacePurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Catch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitEntry" ENABLE ROW LEVEL SECURITY;

-- 2. Optional: Allow Public Read Access for specific public data
-- (Service Role bypasses RLS automatically, so backend writes still work)

-- Allow anyone to read Tournaments (needed for frontend display without admin key)
CREATE POLICY "Public Read Tournaments" ON "Tournament" FOR SELECT TO anon USING (true);

-- Allow anyone to read Marketplace Listings
CREATE POLICY "Public Read Listings" ON "MarketplaceListing" FOR SELECT TO anon USING (true);

-- Allow anyone to read basic User profiles (username, pfp, etc)
CREATE POLICY "Public Read Profiles" ON "User" FOR SELECT TO anon USING (true);
