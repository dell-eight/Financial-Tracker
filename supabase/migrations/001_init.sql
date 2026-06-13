-- ============================================================================
-- 001_init.sql - Financial Tracker Core Schema
-- ============================================================================
-- Core tables for user data, expenses, income, savings goals, and investments
-- Supports 10+ years of financial records with proper indexing and partitioning

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  fiscal_year_start INT NOT NULL DEFAULT 1, -- 1-12, month when fiscal year starts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- ============================================================================
-- EXPENSE MANAGEMENT
-- ============================================================================

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#FF6E52',
  icon TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  budget_limit DECIMAL(15, 2),
  budget_period TEXT DEFAULT 'monthly', -- 'monthly', 'yearly', 'weekly'
  display_order INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT, -- 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  recurring_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INCOME MANAGEMENT
-- ============================================================================

CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'salary', 'freelance', 'investment', 'passive', 'other'
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT, -- 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  color TEXT DEFAULT '#00C318',
  icon TEXT,
  display_order INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES income_sources(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  tax_withheld DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SAVINGS GOALS
-- ============================================================================

CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  target_date DATE,
  category TEXT, -- 'emergency_fund', 'vacation', 'home', 'education', 'retirement', 'other'
  priority INT DEFAULT 5, -- 1-10 scale
  color TEXT DEFAULT '#755DEF',
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE savings_goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVESTMENT TRACKING
-- ============================================================================

CREATE TABLE investment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  account_type TEXT NOT NULL, -- 'brokerage', 'retirement_401k', 'ira', 'roth_ira', 'crypto', 'other'
  institution TEXT,
  account_number TEXT,
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT DEFAULT '#4F46E5',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL, -- 'stocks', 'bonds', 'etf', 'mutual_fund', 'crypto', 'other'
  sector TEXT, -- for stocks: 'tech', 'healthcare', etc
  shares DECIMAL(20, 8) NOT NULL,
  purchase_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
  holding_id UUID REFERENCES investment_holdings(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'dividend', 'interest', 'fee', 'deposit', 'withdrawal'
  symbol TEXT,
  shares DECIMAL(20, 8),
  price_per_share DECIMAL(15, 2),
  total_amount DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(15, 2) DEFAULT 0,
  date DATE NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NET WORTH & ASSETS
-- ============================================================================

CREATE TABLE asset_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL, -- 'checking', 'savings', 'money_market', 'cash', 'property', 'vehicle', 'other'
  balance DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE debt_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  debt_type TEXT NOT NULL, -- 'mortgage', 'auto_loan', 'student_loan', 'credit_card', 'personal_loan', 'other'
  balance DECIMAL(15, 2) NOT NULL,
  original_amount DECIMAL(15, 2),
  annual_rate DECIMAL(5, 2), -- interest rate percentage
  monthly_payment DECIMAL(15, 2),
  minimum_payment DECIMAL(15, 2),
  due_date INT, -- day of month
  payoff_date DATE,
  currency TEXT DEFAULT 'USD',
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets DECIMAL(15, 2) NOT NULL,
  total_debts DECIMAL(15, 2) NOT NULL,
  net_worth DECIMAL(15, 2) NOT NULL,
  liquid_assets DECIMAL(15, 2),
  investments DECIMAL(15, 2),
  real_estate DECIMAL(15, 2),
  other_assets DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- ============================================================================
-- UNIQUEINDEXES FOR PERFORMANCE
-- ============================================================================
CREATE UNIQUE INDEX uq_expense_categories_user_name
ON expense_categories(user_id, name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_income_sources_user_name
ON income_sources(user_id, name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_savings_goals_user_name
ON savings_goals(user_id, name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_investment_accounts_user_name
ON investment_accounts(user_id, name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_asset_accounts_user_name
ON asset_accounts(user_id, name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_debt_accounts_user_name
ON debt_accounts(user_id, name)
WHERE deleted_at IS NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Expense queries
CREATE INDEX idx_expenses_user_id_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category_date ON expenses(user_id, category_id, date DESC);
CREATE INDEX idx_expenses_user_id_deleted ON expenses(user_id, deleted_at);
CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id, display_order);

-- Income queries
CREATE INDEX idx_income_records_user_id_date ON income_records(user_id, date DESC);
CREATE INDEX idx_income_records_user_source_date ON income_records(user_id, source_id, date DESC);
CREATE INDEX idx_income_sources_user_id ON income_sources(user_id, display_order);

-- Savings goals queries
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id, is_active);
CREATE INDEX idx_savings_contributions_goal_id ON savings_goal_contributions(goal_id);

-- Investment queries
CREATE INDEX idx_investment_accounts_user_id ON investment_accounts(user_id);
CREATE INDEX idx_investment_holdings_account_id ON investment_holdings(account_id);
CREATE INDEX idx_investment_transactions_user_id_date ON investment_transactions(user_id, date DESC);
CREATE INDEX idx_investment_transactions_account_id ON investment_transactions(account_id);

-- Net worth queries
CREATE INDEX idx_asset_accounts_user_id ON asset_accounts(user_id);
CREATE INDEX idx_debt_accounts_user_id ON debt_accounts(user_id);
CREATE INDEX idx_net_worth_snapshots_user_date ON net_worth_snapshots(user_id, snapshot_date DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_sources_updated_at BEFORE UPDATE ON income_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_records_updated_at BEFORE UPDATE ON income_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_accounts_updated_at BEFORE UPDATE ON investment_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_accounts_updated_at BEFORE UPDATE ON asset_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debt_accounts_updated_at BEFORE UPDATE ON debt_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync auth.users → public.users on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Calculate user net worth
CREATE OR REPLACE FUNCTION calculate_user_net_worth(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_total_assets DECIMAL(15, 2) := 0;
  v_total_debts DECIMAL(15, 2) := 0;
BEGIN
  -- Sum all assets: cash accounts + investment accounts + holding market value
  SELECT COALESCE(SUM(balance), 0) INTO v_total_assets
  FROM (
    SELECT balance FROM asset_accounts       WHERE user_id = p_user_id AND deleted_at IS NULL
    UNION ALL
    SELECT balance FROM investment_accounts  WHERE user_id = p_user_id AND deleted_at IS NULL
    UNION ALL
    SELECT shares * current_price FROM investment_holdings WHERE user_id = p_user_id AND deleted_at IS NULL
  ) t;

  -- Sum all debts
  SELECT COALESCE(SUM(balance), 0) INTO v_total_debts
  FROM debt_accounts
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  RETURN v_total_assets - v_total_debts;
END;
$$ LANGUAGE plpgsql;
