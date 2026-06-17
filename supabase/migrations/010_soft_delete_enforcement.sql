-- ============================================================================
-- 010_soft_delete_enforcement.sql
-- Enforce soft-delete at the database layer.
--
-- 1. Block hard DELETE on all financial tables that use deleted_at — any
--    DELETE attempt returns an RLS violation; the app must set deleted_at
--    instead (soft delete).
-- 2. Update SELECT policies to auto-filter soft-deleted rows at the DB level,
--    so the application never accidentally surfaces deleted records even if
--    it forgets to add .is('deleted_at', null).
-- ============================================================================

-- ============================================================================
-- BLOCK HARD DELETES
-- Replace permissive DELETE USING (auth.uid() = user_id) with USING (FALSE)
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users cannot hard delete expenses" ON expenses
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own income records" ON income_records;
CREATE POLICY "Users cannot hard delete income records" ON income_records
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own income sources" ON income_sources;
CREATE POLICY "Users cannot hard delete income sources" ON income_sources
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own expense categories" ON expense_categories;
CREATE POLICY "Users cannot hard delete expense categories" ON expense_categories
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;
CREATE POLICY "Users cannot hard delete savings goals" ON savings_goals
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own investment accounts" ON investment_accounts;
CREATE POLICY "Users cannot hard delete investment accounts" ON investment_accounts
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own investment holdings" ON investment_holdings;
CREATE POLICY "Users cannot hard delete investment holdings" ON investment_holdings
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own asset accounts" ON asset_accounts;
CREATE POLICY "Users cannot hard delete asset accounts" ON asset_accounts
  FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Users can delete own debt accounts" ON debt_accounts;
CREATE POLICY "Users cannot hard delete debt accounts" ON debt_accounts
  FOR DELETE USING (FALSE);

-- ============================================================================
-- AUTO-FILTER SOFT-DELETED ROWS IN SELECT POLICIES
-- Add `AND deleted_at IS NULL` so deleted records are invisible by default.
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
CREATE POLICY "Users can read own active expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own income records" ON income_records;
CREATE POLICY "Users can read own active income records" ON income_records
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own income sources" ON income_sources;
CREATE POLICY "Users can read own active income sources" ON income_sources
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own expense categories" ON expense_categories;
CREATE POLICY "Users can read own active expense categories" ON expense_categories
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own savings goals" ON savings_goals;
CREATE POLICY "Users can read own active savings goals" ON savings_goals
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own investment accounts" ON investment_accounts;
CREATE POLICY "Users can read own active investment accounts" ON investment_accounts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own investment holdings" ON investment_holdings;
CREATE POLICY "Users can read own active investment holdings" ON investment_holdings
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own asset accounts" ON asset_accounts;
CREATE POLICY "Users can read own active asset accounts" ON asset_accounts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own debt accounts" ON debt_accounts;
CREATE POLICY "Users can read own active debt accounts" ON debt_accounts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
