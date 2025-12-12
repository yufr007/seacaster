-- Silence Security Linter: Add explicit "Deny" policies to private tables
-- (Service Role still bypasses these, preserving Backend access)

-- AuditLog
CREATE POLICY "Private: AuditLog" ON "AuditLog" FOR ALL TO anon USING (false);

-- Catch
CREATE POLICY "Private: Catch" ON "Catch" FOR ALL TO anon USING (false);

-- Inventory
CREATE POLICY "Private: Inventory" ON "Inventory" FOR ALL TO anon USING (false);

-- MarketplacePurchase
CREATE POLICY "Private: MarketplacePurchase" ON "MarketplacePurchase" FOR ALL TO anon USING (false);

-- RateLimitEntry
CREATE POLICY "Private: RateLimitEntry" ON "RateLimitEntry" FOR ALL TO anon USING (false);

-- TournamentEntry
CREATE POLICY "Private: TournamentEntry" ON "TournamentEntry" FOR ALL TO anon USING (false);
