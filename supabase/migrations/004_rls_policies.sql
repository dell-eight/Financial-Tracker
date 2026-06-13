-- ============================================================================
-- 004_rls_policies.sql - Financial Tracker Row Level Security Policies
-- ============================================================================
-- RLS policies ensure users can only access their own financial data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can only read their own user record
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users cannot delete their own profile (soft delete only)
CREATE POLICY "Users cannot delete profile" ON users
  FOR DELETE USING (FALSE);

-- ============================================================================
-- USER SETTINGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSE CATEGORIES POLICIES
-- ============================================================================

CREATE POLICY "Users can read own expense categories" ON expense_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create expense categories" ON expense_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense categories" ON expense_categories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense categories" ON expense_categories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSES POLICIES
-- ============================================================================

CREATE POLICY "Users can read own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INCOME SOURCES POLICIES
-- ============================================================================

CREATE POLICY "Users can read own income sources" ON income_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create income sources" ON income_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income sources" ON income_sources
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income sources" ON income_sources
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INCOME RECORDS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own income records" ON income_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create income records" ON income_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income records" ON income_records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income records" ON income_records
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SAVINGS GOALS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own savings goals" ON savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create savings goals" ON savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SAVINGS GOAL CONTRIBUTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own goal contributions" ON savings_goal_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create goal contributions" ON savings_goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal contributions" ON savings_goal_contributions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions" ON savings_goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INVESTMENT ACCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own investment accounts" ON investment_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investment accounts" ON investment_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment accounts" ON investment_accounts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment accounts" ON investment_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INVESTMENT HOLDINGS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own investment holdings" ON investment_holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investment holdings" ON investment_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment holdings" ON investment_holdings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment holdings" ON investment_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INVESTMENT TRANSACTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own investment transactions" ON investment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investment transactions" ON investment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment transactions" ON investment_transactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment transactions" ON investment_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- ASSET ACCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own asset accounts" ON asset_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create asset accounts" ON asset_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own asset accounts" ON asset_accounts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own asset accounts" ON asset_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- DEBT ACCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own debt accounts" ON debt_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create debt accounts" ON debt_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debt accounts" ON debt_accounts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debt accounts" ON debt_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- NET WORTH SNAPSHOTS POLICIES
-- ============================================================================

CREATE POLICY "Users can read own net worth snapshots" ON net_worth_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create net worth snapshots" ON net_worth_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own net worth snapshots" ON net_worth_snapshots
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own net worth snapshots" ON net_worth_snapshots
  FOR DELETE USING (auth.uid() = user_id);
