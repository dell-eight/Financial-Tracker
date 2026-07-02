-- ============================================================================
-- 021_fix_soft_delete_rls_remaining.sql
--
-- Applies the same fix as migration 014 to the tables it missed.
--
-- Root cause (same as 014):
--   Migration 010 added `AND deleted_at IS NULL` to SELECT policies so the DB
--   auto-filters deleted rows. However, PostgREST runs a RETURNING check after
--   every UPDATE against the SELECT policy. Setting deleted_at via a soft-delete
--   UPDATE causes the row to vanish from PostgREST's view, which it treats as
--   an RLS violation (403) — even though the UPDATE itself succeeded.
--
-- Fix: remove `AND deleted_at IS NULL` from SELECT policies on tables that use
--   soft-delete mutations. The app already appends .is('deleted_at', null) at
--   the query level in every service call, so no deleted rows are ever surfaced.
--
-- Tables fixed here:
--   asset_accounts   — deleteAsset() was failing (user-reported bug)
--   debt_accounts    — deleteDebt() has the same pattern
--   savings_goals    — deleteSavingsGoal() has the same pattern
--   investment_holdings — soft-deleted when shares reach 0
-- ============================================================================

-- asset_accounts
DROP POLICY IF EXISTS "Users can read own active asset accounts" ON asset_accounts;
CREATE POLICY "Users can read own asset accounts" ON asset_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- debt_accounts
DROP POLICY IF EXISTS "Users can read own active debt accounts" ON debt_accounts;
CREATE POLICY "Users can read own debt accounts" ON debt_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- savings_goals
DROP POLICY IF EXISTS "Users can read own active savings goals" ON savings_goals;
CREATE POLICY "Users can read own savings goals" ON savings_goals
  FOR SELECT USING (auth.uid() = user_id);

-- investment_holdings
DROP POLICY IF EXISTS "Users can read own active investment holdings" ON investment_holdings;
CREATE POLICY "Users can read own investment holdings" ON investment_holdings
  FOR SELECT USING (auth.uid() = user_id);
