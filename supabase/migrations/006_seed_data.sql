-- ============================================================================
-- 006_seed_data.sql - Networthy Seed Data
-- ============================================================================
-- Sample data for development and testing
-- This data includes 2+ years of financial history

-- NOTE: Replace auth.uid() with actual UUID in production
-- For development, these values will need to be adjusted per user

-- Disable triggers temporarily for seed data
ALTER TABLE users DISABLE TRIGGER update_users_updated_at;
ALTER TABLE expense_categories DISABLE TRIGGER update_expense_categories_updated_at;
ALTER TABLE income_sources DISABLE TRIGGER update_income_sources_updated_at;

-- ============================================================================
-- SAMPLE USER DATA
-- ============================================================================

-- Users are created by Supabase Auth, so we'll reference them by ID
-- For seed purposes, we assume a test user exists with known ID
-- In production, replace '00000000-0000-0000-0000-000000000001' with actual user ID

INSERT INTO users (id, email, display_name, base_currency, timezone, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'demo@example.com',
  'Demo User',
  'USD',
  'America/New_York',
  NOW() - INTERVAL '2 years',
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXPENSE CATEGORIES
-- ============================================================================

INSERT INTO expense_categories (user_id, name, description, color, budget_limit, budget_period, display_order, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Groceries', 'Food and household items', '#F97316', 600.00, 'monthly', 1, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Transportation', 'Gas, public transit, and car expenses', '#3B82F6', 400.00, 'monthly', 2, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Entertainment', 'Movies, dining, events', '#A855F7', 300.00, 'monthly', 3, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Utilities', 'Electricity, water, internet', '#EF4444', 250.00, 'monthly', 4, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Healthcare', 'Medical, dental, fitness', '#22C55E', 200.00, 'monthly', 5, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Shopping', 'Clothing and personal items', '#EC4899', 250.00, 'monthly', 6, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Education', 'Courses, books, learning materials', '#14B8A6', 200.00, 'monthly', 7, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Other', 'Miscellaneous expenses', '#6B7280', NULL, 'monthly', 8, NOW() - INTERVAL '2 years')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INCOME SOURCES
-- ============================================================================

INSERT INTO income_sources (user_id, name, type, is_recurring, recurring_frequency, display_order, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Salary', 'salary', TRUE, 'monthly', 1, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Freelance Projects', 'freelance', FALSE, NULL, 2, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Investment Returns', 'investment', FALSE, NULL, 3, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Bonus', 'salary', FALSE, NULL, 4, NOW() - INTERVAL '2 years')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE EXPENSES (Last 24 months)
-- ============================================================================

-- Generate expenses for the last 24 months
INSERT INTO expenses (user_id, category_id, description, amount, date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Groceries' LIMIT 1),
  'Weekly groceries',
  ROUND((RANDOM() * 80 + 40)::NUMERIC, 2),
  CURRENT_DATE - (RANDOM() * 730)::INT,
  NOW()
FROM generate_series(1, 100);

INSERT INTO expenses (user_id, category_id, description, amount, date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Transportation' LIMIT 1),
  'Gas',
  ROUND((RANDOM() * 40 + 30)::NUMERIC, 2),
  CURRENT_DATE - (RANDOM() * 730)::INT,
  NOW()
FROM generate_series(1, 50);

INSERT INTO expenses (user_id, category_id, description, amount, date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Entertainment' LIMIT 1),
  'Movies and events',
  ROUND((RANDOM() * 50 + 20)::NUMERIC, 2),
  CURRENT_DATE - (RANDOM() * 730)::INT,
  NOW()
FROM generate_series(1, 40);

INSERT INTO expenses (user_id, category_id, description, amount, date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Utilities' LIMIT 1),
  'Monthly utilities',
  ROUND((RANDOM() * 50 + 80)::NUMERIC, 2),
  DATE_TRUNC('month', CURRENT_DATE - (RANDOM() * 730)::INT)::DATE,
  NOW()
FROM generate_series(1, 24);

-- ============================================================================
-- SAMPLE INCOME (Last 24 months)
-- ============================================================================

-- Monthly salary
INSERT INTO income_records (user_id, source_id, amount, date, tax_withheld, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM income_sources WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Salary' LIMIT 1),
  5000.00,
  DATE_TRUNC('month', CURRENT_DATE - (INTERVAL '1 month' * gs.n))::DATE + 15,
  1000.00,
  NOW()
FROM generate_series(0, 23) AS gs(n);

-- Freelance income
INSERT INTO income_records (user_id, source_id, amount, date, tax_withheld, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM income_sources WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Freelance Projects' LIMIT 1),
  ROUND((RANDOM() * 2000 + 500)::NUMERIC, 2),
  CURRENT_DATE - (RANDOM() * 730)::INT,
  ROUND((RANDOM() * 200 + 50)::NUMERIC, 2),
  NOW()
FROM generate_series(1, 30);

-- Annual bonuses
INSERT INTO income_records (user_id, source_id, amount, date, tax_withheld, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, (SELECT id FROM income_sources WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Bonus' LIMIT 1), 3000.00, CURRENT_DATE - INTERVAL '1 year', 600.00, NOW()),
  ('00000000-0000-0000-0000-000000000001'::UUID, (SELECT id FROM income_sources WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Bonus' LIMIT 1), 3000.00, CURRENT_DATE, 600.00, NOW());

-- ============================================================================
-- SAVINGS GOALS
-- ============================================================================

INSERT INTO savings_goals (user_id, name, target_amount, target_date, category, priority, is_active, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Emergency Fund', 15000.00, CURRENT_DATE + INTERVAL '1 year', 'emergency_fund', 1, TRUE, NOW() - INTERVAL '6 months'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Vacation to Europe', 5000.00, CURRENT_DATE + INTERVAL '8 months', 'vacation', 3, TRUE, NOW() - INTERVAL '3 months'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Down Payment on House', 50000.00, CURRENT_DATE + INTERVAL '3 years', 'home', 2, TRUE, NOW() - INTERVAL '1 year'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'New Car', 35000.00, CURRENT_DATE + INTERVAL '18 months', 'other', 4, TRUE, NOW() - INTERVAL '6 months');

-- ============================================================================
-- SAVINGS GOAL CONTRIBUTIONS
-- ============================================================================

INSERT INTO savings_goal_contributions (user_id, goal_id, amount, date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM savings_goals WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Emergency Fund' LIMIT 1),
  500.00,
  DATE_TRUNC('month', CURRENT_DATE - (INTERVAL '1 month' * gs.n))::DATE,
  NOW()
FROM generate_series(0, 23) AS gs(n);

INSERT INTO savings_goal_contributions (user_id, goal_id, amount, date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM savings_goals WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Vacation to Europe' LIMIT 1),
  400.00,
  DATE_TRUNC('month', CURRENT_DATE - (INTERVAL '1 month' * gs.n))::DATE,
  NOW()
FROM generate_series(0, 11) AS gs(n);

-- ============================================================================
-- INVESTMENT ACCOUNTS
-- ============================================================================

INSERT INTO investment_accounts (user_id, name, account_type, institution, balance, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Brokerage Account', 'brokerage', 'Vanguard', 50000.00, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Roth IRA', 'roth_ira', 'Fidelity', 35000.00, NOW() - INTERVAL '5 years');

-- ============================================================================
-- INVESTMENT HOLDINGS
-- ============================================================================

INSERT INTO investment_holdings (user_id, account_id, symbol, name, asset_class, sector, shares, purchase_price, current_price, purchase_date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM investment_accounts WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Brokerage Account' LIMIT 1),
  'VTI',
  'Vanguard Total Stock Market ETF',
  'etf',
  NULL,
  100.00,
  150.00,
  180.00,
  NOW() - INTERVAL '2 years',
  NOW();

INSERT INTO investment_holdings (user_id, account_id, symbol, name, asset_class, sector, shares, purchase_price, current_price, purchase_date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM investment_accounts WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Brokerage Account' LIMIT 1),
  'BND',
  'Vanguard Total Bond Market ETF',
  'etf',
  NULL,
  150.00,
  80.00,
  85.00,
  NOW() - INTERVAL '1.5 years',
  NOW();

INSERT INTO investment_holdings (user_id, account_id, symbol, name, asset_class, sector, shares, purchase_price, current_price, purchase_date, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM investment_accounts WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID AND name = 'Roth IRA' LIMIT 1),
  'VTSAX',
  'Vanguard Total Stock Market Index Fund',
  'mutual_fund',
  NULL,
  200.00,
  120.00,
  145.00,
  NOW() - INTERVAL '5 years',
  NOW();

-- ============================================================================
-- ASSET ACCOUNTS
-- ============================================================================

INSERT INTO asset_accounts (user_id, name, asset_type, balance, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Checking Account', 'checking', 8000.00, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Savings Account', 'savings', 25000.00, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'High-Yield Savings', 'money_market', 10000.00, NOW() - INTERVAL '1 year');

-- ============================================================================
-- DEBT ACCOUNTS
-- ============================================================================

INSERT INTO debt_accounts (user_id, name, debt_type, balance, annual_rate, monthly_payment, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Student Loan', 'student_loan', 15000.00, 5.50, 250.00, NOW() - INTERVAL '2 years'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Credit Card', 'credit_card', 2500.00, 18.99, 150.00, NOW() - INTERVAL '1 year');

-- ============================================================================
-- NET WORTH SNAPSHOTS (Monthly snapshots for 24 months)
-- ============================================================================

INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_assets, total_debts, net_worth, liquid_assets, investments, real_estate)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  DATE_TRUNC('month', CURRENT_DATE - (INTERVAL '1 month' * gs.n))::DATE,
  (43000.00 + (gs.n * 1000))::DECIMAL,  -- gradually increasing assets
  (17500.00 - (gs.n * 250))::DECIMAL,   -- gradually decreasing debt
  (25500.00 + (gs.n * 1250))::DECIMAL,  -- net worth growing
  (43000.00 + (gs.n * 500))::DECIMAL,
  (50000.00 + (gs.n * 800))::DECIMAL,
  0.00
FROM generate_series(0, 23) AS gs(n)
ON CONFLICT (user_id, snapshot_date) DO NOTHING;

-- ============================================================================
-- RE-ENABLE TRIGGERS
-- ============================================================================

ALTER TABLE users ENABLE TRIGGER update_users_updated_at;
ALTER TABLE expense_categories ENABLE TRIGGER update_expense_categories_updated_at;
ALTER TABLE income_sources ENABLE TRIGGER update_income_sources_updated_at;

-- ============================================================================
-- PRINT CONFIRMATION
-- ============================================================================

SELECT 'Seed data loaded successfully' AS status,
       (SELECT COUNT(*) FROM expenses WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID) AS expense_count,
       (SELECT COUNT(*) FROM income_records WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID) AS income_count,
       (SELECT COUNT(*) FROM savings_goals WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID) AS goal_count,
       (SELECT COUNT(*) FROM investment_holdings WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID) AS holding_count;
