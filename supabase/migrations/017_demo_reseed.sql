-- ======================================================================
-- 017_demo_reseed.sql
-- Replaces all demo user data with realistic PHP/Filipino seed data.
-- User: Marco Reyes (demo@example.com) — IT professional, Manila
-- Period: Feb 2026 – Jun 2026 (5 months)
-- Features tested: budget warnings, over-budget, negative cash flow,
--   completed goal, near-complete goal, investment gains/losses,
--   transfers, notification inbox, net worth trend dip + recovery.
-- ======================================================================

DO $$
DECLARE
  uid UUID := '00000000-0000-0000-0000-000000000001';

  -- Expense category IDs
  cat_food    UUID := '00000000-0000-0000-0001-000000000001';
  cat_groc    UUID := '00000000-0000-0000-0001-000000000002';
  cat_trans   UUID := '00000000-0000-0000-0001-000000000003';
  cat_rent    UUID := '00000000-0000-0000-0001-000000000004';
  cat_bills   UUID := '00000000-0000-0000-0001-000000000005';
  cat_ent     UUID := '00000000-0000-0000-0001-000000000006';
  cat_shop    UUID := '00000000-0000-0000-0001-000000000007';
  cat_health  UUID := '00000000-0000-0000-0001-000000000008';
  cat_care    UUID := '00000000-0000-0000-0001-000000000009';
  cat_other   UUID := '00000000-0000-0000-0001-000000000010';

  -- Income source IDs
  src_salary    UUID := '00000000-0000-0000-0002-000000000001';
  src_freelance UUID := '00000000-0000-0000-0002-000000000002';
  src_divs      UUID := '00000000-0000-0000-0002-000000000003';

  -- Savings goal IDs
  goal_emerg  UUID := '00000000-0000-0000-0003-000000000001';
  goal_japan  UUID := '00000000-0000-0000-0003-000000000002';
  goal_laptop UUID := '00000000-0000-0000-0003-000000000003';
  goal_house  UUID := '00000000-0000-0000-0003-000000000004';

  -- Asset account IDs
  acc_bdo   UUID := '00000000-0000-0000-0004-000000000001';
  acc_bpi   UUID := '00000000-0000-0000-0004-000000000002';
  acc_gcash UUID := '00000000-0000-0000-0004-000000000003';

  -- Debt account IDs
  debt_cc   UUID := '00000000-0000-0000-0005-000000000001';
  debt_loan UUID := '00000000-0000-0000-0005-000000000002';

  -- Investment account IDs
  inv_col     UUID := '00000000-0000-0000-0006-000000000001';
  inv_sunlife UUID := '00000000-0000-0000-0006-000000000002';

  -- Investment holding IDs
  hold_tel       UUID := '00000000-0000-0000-0007-000000000001';
  hold_smph      UUID := '00000000-0000-0000-0007-000000000002';
  hold_bdo_h     UUID := '00000000-0000-0000-0007-000000000003';
  hold_sunlifepc UUID := '00000000-0000-0000-0007-000000000004';

BEGIN

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 1 — DELETE ALL EXISTING DEMO DATA
-- ══════════════════════════════════════════════════════════════════════
  DELETE FROM public.notifications              WHERE user_id = uid;
  DELETE FROM public.wealth_milestones          WHERE user_id = uid;
  DELETE FROM public.net_worth_snapshots        WHERE user_id = uid;
  DELETE FROM public.transfers                  WHERE user_id = uid;
  DELETE FROM public.investment_transactions    WHERE user_id = uid;
  DELETE FROM public.investment_holdings        WHERE user_id = uid;
  DELETE FROM public.investment_accounts        WHERE user_id = uid;
  DELETE FROM public.savings_goal_contributions WHERE user_id = uid;
  DELETE FROM public.savings_goals              WHERE user_id = uid;
  DELETE FROM public.income_records             WHERE user_id = uid;
  DELETE FROM public.income_sources             WHERE user_id = uid;
  DELETE FROM public.expenses                   WHERE user_id = uid;
  DELETE FROM public.expense_categories         WHERE user_id = uid;
  DELETE FROM public.debt_accounts              WHERE user_id = uid;
  DELETE FROM public.asset_accounts             WHERE user_id = uid;
  DELETE FROM public.user_security_settings     WHERE user_id = uid;
  DELETE FROM public.push_tokens                WHERE user_id = uid;
  DELETE FROM public.user_settings              WHERE user_id = uid;

  UPDATE public.users SET
    base_currency = 'PHP',
    display_name  = 'Marco Reyes',
    timezone      = 'Asia/Manila'
  WHERE id = uid;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 2 — EXPENSE CATEGORIES
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.expense_categories
    (id, user_id, name, budget_limit, budget_period, is_recurring, color, icon, display_order)
  VALUES
    (cat_food,   uid, 'Food & Dining',     8000,  'monthly', false, '#FF6E52', '🍔',  1),
    (cat_groc,   uid, 'Groceries',         6000,  'monthly', false, '#FF9500', '🛒',  2),
    (cat_trans,  uid, 'Transportation',    3500,  'monthly', false, '#4F46E5', '🚗',  3),
    (cat_rent,   uid, 'Rent & Housing',   15000,  'monthly', true,  '#755DEF', '🏠',  4),
    (cat_bills,  uid, 'Bills & Utilities', 4500,  'monthly', true,  '#00C8C8', '💡',  5),
    (cat_ent,    uid, 'Entertainment',     3000,  'monthly', false, '#FF3B80', '🎬',  6),
    (cat_shop,   uid, 'Shopping',          5000,  'monthly', false, '#FF9F0A', '🛍️', 7),
    (cat_health, uid, 'Healthcare',        2500,  'monthly', false, '#30D158', '💊',  8),
    (cat_care,   uid, 'Personal Care',     1500,  'monthly', false, '#BF5AF2', '🪥',  9),
    (cat_other,  uid, 'Other',             NULL,  'monthly', false, '#8E8E93', '📦', 10);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 3 — INCOME SOURCES
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.income_sources
    (id, user_id, name, type, is_recurring, recurring_frequency, color, display_order)
  VALUES
    (src_salary,    uid, 'Monthly Salary',       'salary',     true,  'monthly', '#00C318', 1),
    (src_freelance, uid, 'Freelance Projects',   'freelance',  false, NULL,      '#4F46E5', 2),
    (src_divs,      uid, 'Investment Dividends', 'investment', false, NULL,      '#FF9500', 3);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 4 — ASSET ACCOUNTS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.asset_accounts
    (id, user_id, name, asset_type, balance, currency, institution)
  VALUES
    (acc_bdo,   uid, 'BDO Checking', 'checking', 28500, 'PHP', 'BDO'),
    (acc_bpi,   uid, 'BPI Savings',  'savings',  52000, 'PHP', 'BPI'),
    (acc_gcash, uid, 'GCash Wallet', 'cash',      3200, 'PHP', 'GCash');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 5 — DEBT ACCOUNTS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.debt_accounts
    (id, user_id, name, debt_type, balance, original_amount, annual_rate,
     monthly_payment, minimum_payment, due_date, currency, institution)
  VALUES
    (debt_cc,   uid, 'BDO Credit Card', 'credit_card',   18500, 50000, 36.00, 5000, 2500, 25, 'PHP', 'BDO'),
    (debt_loan, uid, 'SSS Salary Loan', 'personal_loan', 48000, 60000, 10.00, 4000, 4000, 15, 'PHP', 'SSS');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 6 — INVESTMENT ACCOUNTS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.investment_accounts
    (id, user_id, name, account_type, institution, balance, currency)
  VALUES
    (inv_col,     uid, 'COL Financial Portfolio', 'brokerage', 'COL Financial', 95000, 'PHP'),
    (inv_sunlife, uid, 'Sun Life UITF',            'other',     'Sun Life',      42000, 'PHP');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 7 — INVESTMENT HOLDINGS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.investment_holdings
    (id, user_id, account_id, symbol, name, asset_class, sector,
     shares, purchase_price, current_price, purchase_date, currency)
  VALUES
    (hold_tel,       uid, inv_col,     'TEL',       'PLDT Inc.',          'stocks', 'telecom',    50,    1100.00, 1280.00, '2026-02-10', 'PHP'),
    (hold_smph,      uid, inv_col,     'SMPH',      'SM Prime Holdings',  'stocks', 'realestate', 1500,  32.00,   29.50,   '2026-02-25', 'PHP'),
    (hold_bdo_h,     uid, inv_col,     'BDO',       'BDO Unibank',        'stocks', 'finance',    300,   130.00,  148.00,  '2026-03-20', 'PHP'),
    (hold_sunlifepc, uid, inv_sunlife, 'SUNLIFEPC', 'Sun Life Peso Fund', 'other',  NULL,         1,     40000.00,42000.00,'2026-04-22', 'PHP');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 8 — SAVINGS GOALS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.savings_goals
    (id, user_id, name, description, target_amount, current_amount,
     target_date, category, priority, color, is_active)
  VALUES
    (goal_emerg,  uid, 'Emergency Fund',      '6 months of living expenses',    60000,  51000, '2026-12-31', 'emergency_fund', 1, '#00C318', true),
    (goal_japan,  uid, 'Japan Vacation',      'Family trip to Japan & Tokyo',   80000,  32500, '2027-03-01', 'vacation',       3, '#FF6E52', true),
    (goal_laptop, uid, 'New Laptop',          'MacBook Pro for work',           45000,  45000, '2026-01-31', 'other',          5, '#755DEF', true),
    (goal_house,  uid, 'House Down Payment',  'Down payment for Pasig condo',  500000,  75000, '2029-12-31', 'home',           2, '#4F46E5', true);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 9 — SAVINGS GOAL CONTRIBUTIONS
-- ══════════════════════════════════════════════════════════════════════

  -- Emergency Fund  (target ₱60,000 | current ₱51,000 = 85%)
  -- 8,000 + 6×3,000 + 5×5,000 = 8,000 + 18,000 + 25,000 = 51,000 ✓
  INSERT INTO public.savings_goal_contributions (user_id, goal_id, amount, date, description) VALUES
    (uid, goal_emerg, 8000, '2025-04-10', 'Initial emergency fund deposit'),
    (uid, goal_emerg, 3000, '2025-08-10', 'Monthly contribution'),
    (uid, goal_emerg, 3000, '2025-09-10', 'Monthly contribution'),
    (uid, goal_emerg, 3000, '2025-10-10', 'Monthly contribution'),
    (uid, goal_emerg, 3000, '2025-11-10', 'Monthly contribution'),
    (uid, goal_emerg, 3000, '2025-12-10', 'Monthly contribution'),
    (uid, goal_emerg, 3000, '2026-01-10', 'Monthly contribution'),
    (uid, goal_emerg, 5000, '2026-02-10', 'Monthly contribution - increased'),
    (uid, goal_emerg, 5000, '2026-03-10', 'Monthly contribution'),
    (uid, goal_emerg, 5000, '2026-04-10', 'Monthly contribution'),
    (uid, goal_emerg, 5000, '2026-05-10', 'Monthly contribution'),
    (uid, goal_emerg, 5000, '2026-06-10', 'Monthly contribution');

  -- Japan Vacation  (target ₱80,000 | current ₱32,500 = 41%)
  -- 3×2,500 + 5×5,000 = 7,500 + 25,000 = 32,500 ✓
  INSERT INTO public.savings_goal_contributions (user_id, goal_id, amount, date, description) VALUES
    (uid, goal_japan, 2500, '2025-11-05', 'Japan fund - initial'),
    (uid, goal_japan, 2500, '2025-12-05', 'Japan fund'),
    (uid, goal_japan, 2500, '2026-01-05', 'Japan fund'),
    (uid, goal_japan, 5000, '2026-02-05', 'Japan fund - increased contribution'),
    (uid, goal_japan, 5000, '2026-03-05', 'Japan fund'),
    (uid, goal_japan, 5000, '2026-04-05', 'Japan fund'),
    (uid, goal_japan, 5000, '2026-05-05', 'Japan fund'),
    (uid, goal_japan, 5000, '2026-06-05', 'Japan fund');

  -- New Laptop  (target ₱45,000 | current ₱45,000 = 100% COMPLETED)
  -- 15,000 + 10,000 + 10,000 + 5,000 + 5,000 = 45,000 ✓
  INSERT INTO public.savings_goal_contributions (user_id, goal_id, amount, date, description) VALUES
    (uid, goal_laptop, 15000, '2025-08-15', 'Laptop fund - initial deposit'),
    (uid, goal_laptop, 10000, '2025-09-15', 'Laptop fund'),
    (uid, goal_laptop, 10000, '2025-10-15', 'Laptop fund'),
    (uid, goal_laptop,  5000, '2025-11-15', 'Laptop fund'),
    (uid, goal_laptop,  5000, '2025-12-15', 'Laptop fund - goal reached!');

  -- House Down Payment  (target ₱500,000 | current ₱75,000 = 15%)
  -- 10 × 7,500 = 75,000 ✓
  INSERT INTO public.savings_goal_contributions (user_id, goal_id, amount, date, description) VALUES
    (uid, goal_house, 7500, '2025-01-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-02-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-03-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-04-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-05-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-06-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-07-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-08-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-09-20', 'Down payment fund'),
    (uid, goal_house, 7500, '2025-10-20', 'Down payment fund');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 10 — INCOME RECORDS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.income_records (user_id, source_id, amount, date, description, tax_withheld) VALUES
    -- Salary (monthly, ₱45,000 gross, ₱6,750 tax withheld)
    (uid, src_salary, 45000, '2026-02-05', 'February salary',    6750),
    (uid, src_salary, 45000, '2026-03-05', 'March salary',       6750),
    (uid, src_salary, 45000, '2026-04-05', 'April salary',       6750),
    (uid, src_salary, 45000, '2026-05-05', 'May salary',         6750),
    (uid, src_salary, 45000, '2026-06-05', 'June salary',        6750),
    -- Freelance (irregular, higher March & May)
    (uid, src_freelance, 12000, '2026-03-15', 'Freelance: website redesign project', 1200),
    (uid, src_freelance, 18000, '2026-05-20', 'Freelance: e-commerce app module',    1800),
    -- Investment dividends
    (uid, src_divs, 450, '2026-03-08', 'BDO Unibank cash dividend',  0),
    (uid, src_divs, 800, '2026-05-15', 'PLDT Inc. cash dividend',    0),
    (uid, src_divs, 450, '2026-06-10', 'BDO Unibank cash dividend',  0);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 11 — INVESTMENT TRANSACTIONS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.investment_transactions
    (user_id, account_id, holding_id, transaction_type, symbol, shares,
     price_per_share, total_amount, fee, date, description)
  VALUES
    (uid, inv_col,     hold_tel,       'buy',      'TEL',       50,   1100.00,  55000, 250, '2026-02-10', 'Buy PLDT shares'),
    (uid, inv_col,     hold_smph,      'buy',      'SMPH',      1500, 32.00,    48000, 200, '2026-02-25', 'Buy SM Prime shares'),
    (uid, inv_col,     hold_bdo_h,     'buy',      'BDO',       300,  130.00,   39000, 200, '2026-03-20', 'Buy BDO Unibank shares'),
    (uid, inv_col,     NULL,           'dividend', 'BDO',       NULL, NULL,       450,   0, '2026-03-08', 'BDO cash dividend'),
    (uid, inv_col,     hold_smph,      'sell',     'SMPH',      500,  29.00,    14500, 150, '2026-04-05', 'Partial sell SMPH - taking partial loss'),
    (uid, inv_sunlife, hold_sunlifepc, 'deposit',  'SUNLIFEPC', NULL, NULL,     40000,   0, '2026-04-22', 'Sun Life UITF initial deposit'),
    (uid, inv_col,     NULL,           'dividend', 'TEL',       NULL, NULL,       800,   0, '2026-05-15', 'PLDT cash dividend'),
    (uid, inv_col,     NULL,           'dividend', 'BDO',       NULL, NULL,       450,   0, '2026-06-10', 'BDO cash dividend');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 12 — TRANSFERS
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.transfers (user_id, from_account_id, to_account_id, amount, date, notes) VALUES
    (uid, acc_bdo, acc_bpi,   5000, '2026-02-15', 'Monthly savings transfer'),
    (uid, acc_bdo, acc_bpi,   8000, '2026-03-15', 'Extra savings from freelance income'),
    (uid, acc_bdo, acc_gcash, 2000, '2026-04-30', 'GCash top-up for online payments'),
    (uid, acc_bpi, acc_bdo,  10000, '2026-05-12', 'Cover May medical expenses');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 13 — EXPENSES
-- Totals per month (budget limits in parentheses):
--   Feb: Rent 15k | Groc 4.8k/6k(80%) | Food 4.2k/8k | Trans 2.1k | Bills 3.8k | Ent 1.5k | Shop 2.8k | Care 0.9k
--   Mar: Rent 15k | Groc 5.1k | Food 5.4k | Trans 2.8k | Bills 4.2k | Ent 2.7k/3k(90%) | Shop 3.1k | Care 1.2k
--   Apr: Rent 15k | Groc 5.8k | Food 7.1k/8k(89%) | Trans 4.2k/3.5k(120%!) | Bills 4.5k | Ent 2.1k | Shop 5.5k/5k(110%!) | Health 1.2k
--   May: Rent 15k | Groc 5.5k | Food 3.8k | Trans 2.4k | Bills 3.9k | Ent 0.8k | Shop 1.2k | Health 8.5k/2.5k(340%!) | Care 0.6k
--   Jun: Rent 15k | Groc 2.8k | Food 2.1k | Trans 1.4k | Bills 4.0k | Ent 0.7k | Shop 1.5k | Health 0.5k
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.expenses (user_id, category_id, description, amount, date) VALUES

  -- ── FEBRUARY 2026 ────────────────────────────────────────────────────
  -- Rent (₱15,000)
  (uid, cat_rent,  'February rent',                              15000, '2026-02-01'),
  -- Groceries — ₱4,800 total (80% of ₱6,000 → triggers warning)
  (uid, cat_groc,  'Puregold weekly groceries',                    800, '2026-02-02'),
  (uid, cat_groc,  'SM Supermarket — monthly stock-up',           1000, '2026-02-08'),
  (uid, cat_groc,  'Robinsons Supermarket',                        750, '2026-02-14'),
  (uid, cat_groc,  'S&R Membership Shopping',                     1200, '2026-02-20'),
  (uid, cat_groc,  'Puregold — week 4',                           1050, '2026-02-26'),
  -- Food & Dining — ₱4,200 total
  (uid, cat_food,  'Jollibee lunch',                               400, '2026-02-03'),
  (uid, cat_food,  'Shakey''s dinner with friends',                300, '2026-02-05'),
  (uid, cat_food,  'Yellow Cab pizza night',                       580, '2026-02-07'),
  (uid, cat_food,  'Valentine''s dinner at Ninyo Fusion',          890, '2026-02-14'),
  (uid, cat_food,  'Mang Inasal lunch',                           280, '2026-02-16'),
  (uid, cat_food,  'Sushi Nori dinner',                           320, '2026-02-19'),
  (uid, cat_food,  'Thai restaurant',                             750, '2026-02-22'),
  (uid, cat_food,  'Family lunch at Vikings buffet',              680, '2026-02-28'),
  -- Transportation — ₱2,100 total
  (uid, cat_trans, 'Grab — office commute',                       350, '2026-02-03'),
  (uid, cat_trans, 'Grab — rainy day surge',                      450, '2026-02-06'),
  (uid, cat_trans, 'Grab — Makati to BGC',                        280, '2026-02-11'),
  (uid, cat_trans, 'Gas refill — half tank',                      780, '2026-02-18'),
  (uid, cat_trans, 'Grab — late night',                           240, '2026-02-25'),
  -- Bills & Utilities — ₱3,800 total
  (uid, cat_bills, 'Meralco electric bill',                      2200, '2026-02-05'),
  (uid, cat_bills, 'Maynilad water bill',                         400, '2026-02-10'),
  (uid, cat_bills, 'Globe Fiber broadband',                      1200, '2026-02-10'),
  -- Entertainment — ₱1,500 total
  (uid, cat_ent,   'Netflix monthly subscription',                549, '2026-02-03'),
  (uid, cat_ent,   'Cinema — Araneta',                           651, '2026-02-08'),
  (uid, cat_ent,   'Steam game purchase',                         300, '2026-02-21'),
  -- Shopping — ₱2,800 total
  (uid, cat_shop,  'SM Dept Store — polo shirts',                 580, '2026-02-06'),
  (uid, cat_shop,  'Household supplies — Ace Hardware',           680, '2026-02-11'),
  (uid, cat_shop,  'New sneakers — Bratpack',                     900, '2026-02-16'),
  (uid, cat_shop,  'Kitchen items — Landmark',                    640, '2026-02-22'),
  -- Personal Care — ₱900 total
  (uid, cat_care,  'Haircut — Bench Fix',                         550, '2026-02-08'),
  (uid, cat_care,  'Toiletries — Watson''s',                      350, '2026-02-15'),

  -- ── MARCH 2026 ───────────────────────────────────────────────────────
  -- Rent (₱15,000)
  (uid, cat_rent,  'March rent',                                 15000, '2026-03-01'),
  -- Groceries — ₱5,100 total
  (uid, cat_groc,  'Puregold weekly groceries',                    850, '2026-03-01'),
  (uid, cat_groc,  'SM Supermarket',                             1100, '2026-03-07'),
  (uid, cat_groc,  'Robinsons Supermarket',                        900, '2026-03-14'),
  (uid, cat_groc,  'S&R Membership Shopping',                     1200, '2026-03-21'),
  (uid, cat_groc,  'Puregold — end of month',                    1050, '2026-03-28'),
  -- Food & Dining — ₱5,400 total
  (uid, cat_food,  'Jollibee breakfast',                          600, '2026-03-02'),
  (uid, cat_food,  'Yabu Katsu dinner',                           900, '2026-03-06'),
  (uid, cat_food,  'Mang Inasal lunch',                           400, '2026-03-09'),
  (uid, cat_food,  'Ramen Nagi with officemates',                 850, '2026-03-13'),
  (uid, cat_food,  'Samgyupsalamat — Korean BBQ',               1050, '2026-03-18'),
  (uid, cat_food,  'Coffee shop — work from cafe',                600, '2026-03-22'),
  (uid, cat_food,  'Vikings buffet — birthday celebration',      1000, '2026-03-28'),
  -- Transportation — ₱2,800 total
  (uid, cat_trans, 'Grab rides — week 1',                         450, '2026-03-04'),
  (uid, cat_trans, 'Grab rides — week 2',                         680, '2026-03-11'),
  (uid, cat_trans, 'Gas refill',                                  800, '2026-03-17'),
  (uid, cat_trans, 'Grab — weekend trips',                        500, '2026-03-23'),
  (uid, cat_trans, 'Grab — week 4',                               370, '2026-03-29'),
  -- Bills & Utilities — ₱4,200 total (higher summer electric)
  (uid, cat_bills, 'Meralco electric bill — March (hot season)',2700, '2026-03-05'),
  (uid, cat_bills, 'Maynilad water bill',                         450, '2026-03-10'),
  (uid, cat_bills, 'Globe Fiber broadband',                      1050, '2026-03-10'),
  -- Entertainment — ₱2,700 total (90% of ₱3,000 → warning!)
  (uid, cat_ent,   'Netflix monthly subscription',                549, '2026-03-03'),
  (uid, cat_ent,   'Cinema — two movies this month',              751, '2026-03-09'),
  (uid, cat_ent,   'Spotify Premium',                             149, '2026-03-03'),
  (uid, cat_ent,   'Switch game cartridge',                      1251, '2026-03-20'),
  -- Shopping — ₱3,100 total
  (uid, cat_shop,  'H&M sale — tops and bottoms',                 680, '2026-03-07'),
  (uid, cat_shop,  'Uniqlo — work clothes',                       920, '2026-03-12'),
  (uid, cat_shop,  'Decathlon — gym shoes',                       850, '2026-03-22'),
  (uid, cat_shop,  'Home organization — Daiso + others',          650, '2026-03-27'),
  -- Personal Care — ₱1,200 total
  (uid, cat_care,  'Haircut + hair treatment',                    750, '2026-03-08'),
  (uid, cat_care,  'Skincare and toiletries',                     450, '2026-03-20'),

  -- ── APRIL 2026 ───────────────────────────────────────────────────────
  -- Rent (₱15,000)
  (uid, cat_rent,  'April rent',                                 15000, '2026-04-01'),
  -- Groceries — ₱5,800 total
  (uid, cat_groc,  'Puregold weekly groceries',                    900, '2026-04-04'),
  (uid, cat_groc,  'SM Supermarket',                             1200, '2026-04-10'),
  (uid, cat_groc,  'Robinsons Supermarket',                      1000, '2026-04-16'),
  (uid, cat_groc,  'S&R Membership Shopping',                    1400, '2026-04-22'),
  (uid, cat_groc,  'Puregold — end of month',                    1300, '2026-04-28'),
  -- Food & Dining — ₱7,100 total (89% of ₱8,000 → warning!)
  (uid, cat_food,  'Jollibee — Holy Week',                        850, '2026-04-02'),
  (uid, cat_food,  'Gerry''s Grill family dinner',               1200, '2026-04-05'),
  (uid, cat_food,  'Shakey''s takeout',                           650, '2026-04-09'),
  (uid, cat_food,  'Yabu for team lunch',                         980, '2026-04-12'),
  (uid, cat_food,  'Beach resort meals — out of town',            750, '2026-04-17'),
  (uid, cat_food,  'McDonald''s quick dinner',                    650, '2026-04-20'),
  (uid, cat_food,  'Sambokojin buffet',                           820, '2026-04-24'),
  (uid, cat_food,  'Starbucks — end of month meetings',          1200, '2026-04-29'),
  -- Transportation — ₱4,200 total (120% of ₱3,500 → OVER BUDGET!)
  -- Reason: out-of-town trip + extra Grab rides
  (uid, cat_trans, 'Grab — daily commute week 1',                 450, '2026-04-03'),
  (uid, cat_trans, 'Gas refill — before road trip',              1200, '2026-04-08'),
  (uid, cat_trans, 'Grab — out-of-town return',                   580, '2026-04-09'),
  (uid, cat_trans, 'Grab — week 3',                               680, '2026-04-18'),
  (uid, cat_trans, 'Gas refill — mid month',                      750, '2026-04-23'),
  (uid, cat_trans, 'Grab — week 4 surge',                         540, '2026-04-28'),
  -- Bills & Utilities — ₱4,500 total (exactly at budget limit)
  (uid, cat_bills, 'Meralco electric bill — April',             2800, '2026-04-05'),
  (uid, cat_bills, 'Maynilad water bill',                         500, '2026-04-10'),
  (uid, cat_bills, 'Globe Fiber broadband',                      1200, '2026-04-10'),
  -- Entertainment — ₱2,100 total
  (uid, cat_ent,   'Netflix monthly subscription',                549, '2026-04-03'),
  (uid, cat_ent,   'Cinema — two films',                          801, '2026-04-18'),
  (uid, cat_ent,   'Spotify Premium',                             149, '2026-04-03'),
  (uid, cat_ent,   'Digital games — PSN',                         601, '2026-04-22'),
  -- Shopping — ₱5,500 total (110% of ₱5,000 → OVER BUDGET!)
  (uid, cat_shop,  'SM Dept Store — summer clothes',              680, '2026-04-06'),
  (uid, cat_shop,  'Batangas trip supplies',                     1200, '2026-04-07'),
  (uid, cat_shop,  'Laptop bag — Lazada',                         800, '2026-04-14'),
  (uid, cat_shop,  'Home appliance — electric fan',              1500, '2026-04-20'),
  (uid, cat_shop,  'Grocery extras — toiletries bulk',            1320, '2026-04-26'),
  -- Healthcare — ₱1,200 total
  (uid, cat_health,'Annual physical exam + labs',                 750, '2026-04-12'),
  (uid, cat_health,'Prescription vitamins',                       450, '2026-04-13'),

  -- ── MAY 2026 ─────────────────────────────────────────────────────────
  -- Rent (₱15,000)
  (uid, cat_rent,  'May rent',                                   15000, '2026-05-01'),
  -- Groceries — ₱5,500 total
  (uid, cat_groc,  'Puregold weekly groceries',                    900, '2026-05-03'),
  (uid, cat_groc,  'SM Supermarket',                             1100, '2026-05-09'),
  (uid, cat_groc,  'Robinsons Supermarket',                        850, '2026-05-16'),
  (uid, cat_groc,  'S&R Membership Shopping',                    1350, '2026-05-22'),
  (uid, cat_groc,  'Puregold — end of month',                    1300, '2026-05-28'),
  -- Food & Dining — ₱3,800 total (reduced — stayed home after hospital)
  (uid, cat_food,  'Jollibee — Labor Day',                        580, '2026-05-01'),
  (uid, cat_food,  'Grab food delivery',                          850, '2026-05-08'),
  (uid, cat_food,  'Mang Inasal — quick lunch',                   650, '2026-05-14'),
  (uid, cat_food,  'Healthy meal delivery — recovery',            720, '2026-05-17'),
  (uid, cat_food,  'Family dinner — got better!',                1000, '2026-05-30'),
  -- Transportation — ₱2,400 total
  (uid, cat_trans, 'Grab — hospital visits',                      450, '2026-05-10'),
  (uid, cat_trans, 'Grab — week 2',                               680, '2026-05-15'),
  (uid, cat_trans, 'Gas refill',                                   820, '2026-05-22'),
  (uid, cat_trans, 'Grab — week 4',                               450, '2026-05-28'),
  -- Bills & Utilities — ₱3,900 total
  (uid, cat_bills, 'Meralco electric bill — May',               2400, '2026-05-05'),
  (uid, cat_bills, 'Maynilad water bill',                         450, '2026-05-10'),
  (uid, cat_bills, 'Globe Fiber broadband',                      1050, '2026-05-10'),
  -- Entertainment — ₱800 total (stayed home to recover)
  (uid, cat_ent,   'Netflix monthly subscription',                549, '2026-05-03'),
  (uid, cat_ent,   'Spotify Premium',                             149, '2026-05-03'),
  (uid, cat_ent,   'Mobile game top-up — bored at home',          102, '2026-05-15'),
  -- Shopping — ₱1,200 total
  (uid, cat_shop,  'Medical supplies — thermometer, meds',        750, '2026-05-11'),
  (uid, cat_shop,  'Comfortable home clothes for recovery',       450, '2026-05-18'),
  -- Healthcare — ₱8,500 total (340% of ₱2,500 → MASSIVE OVER BUDGET!)
  (uid, cat_health,'St. Luke''s ER visit + 1-night admission',  6000, '2026-05-10'),
  (uid, cat_health,'Follow-up consult + diagnostics',           1500, '2026-05-14'),
  (uid, cat_health,'Prescription antibiotics + meds',           1000, '2026-05-14'),
  -- Personal Care — ₱600 total (minimal this month)
  (uid, cat_care,  'Toiletries restock',                          350, '2026-05-05'),
  (uid, cat_care,  'Haircut',                                     250, '2026-05-26'),

  -- ── JUNE 2026 (through Jun 21) ────────────────────────────────────────
  -- Rent (₱15,000)
  (uid, cat_rent,  'June rent',                                  15000, '2026-06-01'),
  -- Groceries — ₱2,800 total (half month)
  (uid, cat_groc,  'Puregold weekly groceries',                    850, '2026-06-02'),
  (uid, cat_groc,  'SM Supermarket',                               950, '2026-06-09'),
  (uid, cat_groc,  'Robinsons Supermarket',                       1000, '2026-06-16'),
  -- Food & Dining — ₱2,100 total
  (uid, cat_food,  'Jollibee family breakfast',                    380, '2026-06-03'),
  (uid, cat_food,  'Yabu — Father''s Day treat',                  650, '2026-06-14'),
  (uid, cat_food,  'Mang Inasal lunch',                           420, '2026-06-17'),
  (uid, cat_food,  'Coffee shop work session',                    650, '2026-06-20'),
  -- Transportation — ₱1,400 total
  (uid, cat_trans, 'Grab — week 1',                               280, '2026-06-04'),
  (uid, cat_trans, 'Grab — week 2',                               450, '2026-06-10'),
  (uid, cat_trans, 'Gas refill — half tank',                      350, '2026-06-15'),
  (uid, cat_trans, 'Grab — week 3',                               320, '2026-06-19'),
  -- Bills & Utilities — ₱4,000 total
  (uid, cat_bills, 'Meralco electric bill — June',              2500, '2026-06-05'),
  (uid, cat_bills, 'Maynilad water bill',                         450, '2026-06-10'),
  (uid, cat_bills, 'Globe Fiber broadband',                      1050, '2026-06-10'),
  -- Entertainment — ₱700 total
  (uid, cat_ent,   'Netflix monthly subscription',                549, '2026-06-03'),
  (uid, cat_ent,   'Spotify Premium',                             149, '2026-06-03'),
  -- Shopping — ₱1,500 total
  (uid, cat_shop,  'Divisoria haul — clothes',                    900, '2026-06-07'),
  (uid, cat_shop,  'Household items',                             600, '2026-06-14'),
  -- Healthcare — ₱500 total (follow-up checkup only)
  (uid, cat_health,'Follow-up medical consult — all clear!',      500, '2026-06-18');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 14 — NET WORTH SNAPSHOTS
-- Assets breakdown: cash accounts + investment accounts + (goal savings implicit)
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.net_worth_snapshots
    (user_id, snapshot_date, captured_at,
     total_assets, total_debts, net_worth,
     liquid_assets, investments, real_estate, other_assets,
     created_at, updated_at)
  VALUES
    -- snapshot_date = month key (first of month)
    -- captured_at   = actual date the measurement was taken
    (uid, '2026-02-01', '2026-02-28 20:00:00+08',
     380000, 80000, 300000, 216500, 103000, 0, 60500,
     '2026-02-28 12:00:00+00', '2026-02-28 12:00:00+00'),

    (uid, '2026-03-01', '2026-03-31 20:00:00+08',
     418000, 76000, 342000, 234000, 118000, 0, 66000,
     '2026-03-31 12:00:00+00', '2026-03-31 12:00:00+00'),

    (uid, '2026-04-01', '2026-04-30 20:00:00+08',
     397000, 72000, 325000, 220000, 111000, 0, 66000,
     '2026-04-30 12:00:00+00', '2026-04-30 12:00:00+00'),

    (uid, '2026-05-01', '2026-05-31 20:00:00+08',
     444000, 69000, 375000, 249350, 128150, 0, 66500,
     '2026-05-31 12:00:00+00', '2026-05-31 12:00:00+00'),

    -- Jun: snapshot_date=Jun 01 (month key), captured_at=Jun 20 (actual measurement)
    -- net_worth matches live NW exactly: bank+investments+savings−debts = ₱415,350
    (uid, '2026-06-01', '2026-06-20 20:00:00+08',
     481850, 66500, 415350, 287050, 194650, 0, 150,
     '2026-06-20 12:00:00+00', '2026-06-20 12:00:00+00');

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 15 — WEALTH MILESTONES
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.wealth_milestones
    (user_id, milestone_type, achieved_at, net_worth_at_achievement, celebrated)
  VALUES
    (uid, 'net_worth_100k',      '2026-02-28 00:00:00+08', 271000, true),
    (uid, 'first_goal_completed','2026-01-15 00:00:00+08', 265000, true);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 16 — NOTIFICATIONS (pre-seeded inbox items)
-- 1 read (Feb groceries warning) + 2 unread (Apr over-budget alerts)
-- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.notifications
    (user_id, type, title, body, data, dedupe_key, read_at, created_at)
  VALUES
    (uid,
     'budget_warning',
     '⚠️ Budget Warning: Groceries',
     'You''ve used 80% of your Groceries budget (₱4,800 of ₱6,000).',
     '{"budgetId": "groceries", "ratio": 0.80, "spent": 4800, "limit": 6000, "month": 2, "year": 2026}'::jsonb,
     'seed_80_groc_2026_2',
     '2026-03-01 09:00:00+08',
     '2026-02-28 22:00:00+08'),
    (uid,
     'budget_over',
     '🚨 Over Budget: Transportation',
     'You''ve exceeded your Transportation budget (₱4,200 spent vs ₱3,500 limit).',
     '{"budgetId": "transportation", "ratio": 1.20, "spent": 4200, "limit": 3500, "month": 4, "year": 2026}'::jsonb,
     'seed_100_trans_2026_4',
     NULL,
     '2026-04-30 22:00:00+08'),
    (uid,
     'budget_warning',
     '⚠️ Budget Warning: Food & Dining',
     'You''ve used 89% of your Food & Dining budget (₱7,100 of ₱8,000).',
     '{"budgetId": "food", "ratio": 0.89, "spent": 7100, "limit": 8000, "month": 4, "year": 2026}'::jsonb,
     'seed_80_food_2026_4',
     NULL,
     '2026-04-30 23:00:00+08');

END $$;
