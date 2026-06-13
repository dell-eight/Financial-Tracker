-- ============================================================================
-- 002_views.sql - Financial Tracker Views
-- ============================================================================
-- SQL views for common queries and dashboard data aggregation

-- ============================================================================
-- MONTHLY EXPENSE SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
  e.user_id,
  DATE_TRUNC('month', e.date)::DATE AS month,
  ec.id AS category_id,
  ec.name AS category_name,
  ec.color,
  COUNT(*) AS transaction_count,
  SUM(e.amount) AS total_amount,
  AVG(e.amount) AS avg_amount,
  MAX(e.amount) AS max_amount,
  MIN(e.amount) AS min_amount
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
WHERE e.deleted_at IS NULL AND ec.deleted_at IS NULL
GROUP BY e.user_id, DATE_TRUNC('month', e.date), ec.id, ec.name, ec.color;

-- ============================================================================
-- MONTHLY INCOME SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW monthly_income_summary AS
SELECT
  ir.user_id,
  DATE_TRUNC('month', ir.date)::DATE AS month,
  ics.id AS source_id,
  ics.name AS source_name,
  ics.type,
  ics.color,
  COUNT(*) AS transaction_count,
  SUM(ir.amount) AS total_amount,
  SUM(ir.tax_withheld) AS total_tax,
  SUM(ir.amount - COALESCE(ir.tax_withheld, 0)) AS net_income,
  AVG(ir.amount) AS avg_amount
FROM income_records ir
JOIN income_sources ics ON ir.source_id = ics.id
WHERE ir.deleted_at IS NULL AND ics.deleted_at IS NULL
GROUP BY ir.user_id, DATE_TRUNC('month', ir.date), ics.id, ics.name, ics.type, ics.color;

-- ============================================================================
-- MONTHLY CASH FLOW VIEW
-- ============================================================================

CREATE OR REPLACE VIEW monthly_cash_flow AS
SELECT
  COALESCE(e.user_id, i.user_id) AS user_id,
  COALESCE(e.month, i.month) AS month,
  COALESCE(SUM(i.total_amount), 0) AS total_income,
  COALESCE(SUM(i.total_tax), 0) AS total_tax,
  COALESCE(SUM(i.net_income), 0) AS net_income,
  COALESCE(SUM(e.total_amount), 0) AS total_expenses,
  COALESCE(SUM(i.net_income), 0) - COALESCE(SUM(e.total_amount), 0) AS net_cash_flow
FROM monthly_income_summary i
FULL OUTER JOIN (
  SELECT user_id, month, SUM(total_amount) AS total_amount FROM monthly_expense_summary GROUP BY user_id, month
) e ON i.user_id = e.user_id AND i.month = e.month
GROUP BY COALESCE(e.user_id, i.user_id), COALESCE(e.month, i.month);

-- ============================================================================
-- EXPENSE TRENDS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW expense_trends AS
SELECT
  e.user_id,
  ec.id AS category_id,
  ec.name AS category_name,
  DATE_TRUNC('month', e.date)::DATE AS month,
  EXTRACT(YEAR FROM e.date)::INT AS year,
  EXTRACT(MONTH FROM e.date)::INT AS month_num,
  SUM(e.amount) AS total_amount,
  COUNT(*) AS transaction_count,
  AVG(e.amount) AS avg_transaction
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
WHERE e.deleted_at IS NULL AND ec.deleted_at IS NULL
GROUP BY e.user_id, ec.id, ec.name, DATE_TRUNC('month', e.date), EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date);

-- ============================================================================
-- INCOME TRENDS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW income_trends AS
SELECT
  ir.user_id,
  ics.id AS source_id,
  ics.name AS source_name,
  DATE_TRUNC('month', ir.date)::DATE AS month,
  EXTRACT(YEAR FROM ir.date)::INT AS year,
  EXTRACT(MONTH FROM ir.date)::INT AS month_num,
  SUM(ir.amount) AS total_amount,
  SUM(ir.tax_withheld) AS total_tax,
  SUM(ir.amount - COALESCE(ir.tax_withheld, 0)) AS net_income,
  COUNT(*) AS transaction_count
FROM income_records ir
JOIN income_sources ics ON ir.source_id = ics.id
WHERE ir.deleted_at IS NULL AND ics.deleted_at IS NULL
GROUP BY ir.user_id, ics.id, ics.name, DATE_TRUNC('month', ir.date), EXTRACT(YEAR FROM ir.date), EXTRACT(MONTH FROM ir.date);

-- ============================================================================
-- INVESTMENT SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW investment_summary AS
SELECT
  ih.user_id,
  ia.id AS account_id,
  ia.name AS account_name,
  ia.account_type,
  ih.symbol,
  ih.name AS holding_name,
  ih.asset_class,
  ih.sector,
  ih.shares,
  ih.current_price,
  ih.purchase_price,
  (ih.shares * ih.current_price) AS current_value,
  (ih.shares * ih.purchase_price) AS cost_basis,
  ((ih.shares * ih.current_price) - (ih.shares * ih.purchase_price)) AS unrealized_gain_loss,
  CASE
    WHEN (ih.shares * ih.purchase_price) > 0
    THEN (((ih.shares * ih.current_price) - (ih.shares * ih.purchase_price)) / (ih.shares * ih.purchase_price) * 100)
    ELSE 0
  END AS gain_loss_percent
FROM investment_holdings ih
JOIN investment_accounts ia ON ih.account_id = ia.id
WHERE ih.deleted_at IS NULL AND ia.deleted_at IS NULL;

-- ============================================================================
-- ASSET ALLOCATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW asset_allocation AS
SELECT
  user_id,
  asset_class,
  SUM(current_value) AS total_value,
  SUM(cost_basis) AS total_cost,
  SUM(unrealized_gain_loss) AS total_gain_loss,
  COUNT(DISTINCT symbol) AS num_holdings,
  ROUND(SUM(current_value) / SUM(SUM(current_value)) OVER (PARTITION BY user_id) * 100, 2) AS allocation_percent
FROM investment_summary
GROUP BY user_id, asset_class;

-- ============================================================================
-- SAVINGS GOAL STATUS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW savings_goal_status AS
SELECT
  sg.id,
  sg.user_id,
  sg.name,
  sg.description,
  sg.category,
  sg.target_amount,
  COALESCE(sgc.current_balance, 0) AS current_amount,
  sg.target_date,
  CASE
    WHEN sg.target_date IS NOT NULL
    THEN DATE_PART('day', sg.target_date - CURRENT_DATE)
    ELSE NULL
  END AS days_remaining,
  CASE
    WHEN sg.target_amount > 0
    THEN (COALESCE(sgc.current_balance, 0) / sg.target_amount * 100)
    ELSE 0
  END AS progress_percent,
  CASE
    WHEN sg.target_date IS NOT NULL AND sg.target_amount > 0
    THEN ((COALESCE(sgc.current_balance, 0) - 0) /
          NULLIF(DATE_PART('day', sg.target_date - CURRENT_DATE), 0))
    ELSE NULL
  END AS daily_required_savings,
  sg.is_active,
  sg.color,
  sg.icon
FROM savings_goals sg
LEFT JOIN (
  SELECT goal_id, SUM(amount) AS current_balance
  FROM savings_goal_contributions
  GROUP BY goal_id
) sgc ON sg.id = sgc.goal_id
WHERE sg.deleted_at IS NULL;

-- ============================================================================
-- NET WORTH DETAIL VIEW
-- ============================================================================

CREATE OR REPLACE VIEW net_worth_detail AS
WITH asset_totals AS (
  SELECT
    user_id,
    'Cash & Equivalents' AS category,
    SUM(balance) AS amount
  FROM asset_accounts
  WHERE asset_type IN ('checking', 'savings', 'money_market', 'cash') AND deleted_at IS NULL
  GROUP BY user_id

  UNION ALL

  SELECT
    user_id,
    'Investments' AS category,
    SUM(shares * current_price) AS amount
  FROM investment_holdings
  WHERE deleted_at IS NULL
  GROUP BY user_id

  UNION ALL

  SELECT
    user_id,
    'Property & Assets' AS category,
    SUM(balance) AS amount
  FROM asset_accounts
  WHERE asset_type IN ('property', 'vehicle', 'other') AND deleted_at IS NULL
  GROUP BY user_id
),
debt_totals AS (
  SELECT
    user_id,
    SUM(balance) AS total_debt
  FROM debt_accounts
  WHERE deleted_at IS NULL
  GROUP BY user_id
)
SELECT
  COALESCE(a.user_id, d.user_id) AS user_id,
  a.category,
  COALESCE(a.amount, 0) AS amount,
  COALESCE(d.total_debt, 0) AS total_debt,
  COALESCE(a.amount, 0) - COALESCE(d.total_debt, 0) AS net_worth
FROM asset_totals a
FULL OUTER JOIN debt_totals d ON a.user_id = d.user_id;

-- ============================================================================
-- MONTHLY BUDGET VS ACTUAL VIEW
-- ============================================================================

CREATE OR REPLACE VIEW budget_vs_actual AS
SELECT
  e.user_id,
  e.month,
  ec.id AS category_id,
  ec.name AS category_name,
  ec.budget_limit,
  e.total_amount AS actual_spent,
  CASE
    WHEN ec.budget_limit IS NOT NULL
    THEN (e.total_amount / ec.budget_limit * 100)
    ELSE NULL
  END AS percent_of_budget,
  CASE
    WHEN ec.budget_limit IS NOT NULL
    THEN ec.budget_limit - e.total_amount
    ELSE NULL
  END AS remaining_budget
FROM monthly_expense_summary e
JOIN expense_categories ec ON e.category_id = ec.id AND e.user_id = ec.user_id
WHERE e.total_amount > 0;

-- ============================================================================
-- FINANCIAL HEALTH METRICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW financial_health_metrics AS
SELECT
  u.id AS user_id,
  CURRENT_DATE AS as_of_date,
  -- Net Worth
  COALESCE(
    (SELECT SUM(balance) FROM asset_accounts WHERE user_id = u.id AND deleted_at IS NULL) +
    (SELECT COALESCE(SUM(shares * current_price), 0) FROM investment_holdings WHERE user_id = u.id AND deleted_at IS NULL) +
    (SELECT COALESCE(SUM(balance), 0) FROM investment_accounts WHERE user_id = u.id AND deleted_at IS NULL),
    0
  ) -
  COALESCE((SELECT SUM(balance) FROM debt_accounts WHERE user_id = u.id AND deleted_at IS NULL), 0) AS net_worth,
  -- Monthly Expenses (last 30 days)
  COALESCE(
    (SELECT SUM(amount) FROM expenses WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL),
    0
  ) AS monthly_expenses,
  -- Monthly Income (last 30 days)
  COALESCE(
    (SELECT SUM(amount) FROM income_records WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL),
    0
  ) AS monthly_income,
  -- Savings Rate
  CASE
    WHEN COALESCE((SELECT SUM(amount) FROM income_records WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL), 0) > 0
    THEN ((COALESCE((SELECT SUM(amount) FROM income_records WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL), 0) -
           COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL), 0)) /
          COALESCE((SELECT SUM(amount) FROM income_records WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL), 1) * 100)
    ELSE 0
  END AS savings_rate_percent,
  -- Emergency Fund Months
  CASE
    WHEN COALESCE(
      (SELECT SUM(amount) FROM expenses WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL), 0
    ) > 0
    THEN COALESCE(
      (SELECT SUM(balance) FROM asset_accounts WHERE user_id = u.id AND asset_type IN ('savings', 'money_market') AND deleted_at IS NULL), 0
    ) / COALESCE(
      (SELECT SUM(amount) FROM expenses WHERE user_id = u.id AND date >= CURRENT_DATE - 30 AND deleted_at IS NULL), 1
    )
    ELSE 0
  END AS emergency_fund_months,
  -- Total Assets
  COALESCE(
    (SELECT SUM(balance) FROM asset_accounts WHERE user_id = u.id AND deleted_at IS NULL) +
    (SELECT COALESCE(SUM(shares * current_price), 0) FROM investment_holdings WHERE user_id = u.id AND deleted_at IS NULL) +
    (SELECT COALESCE(SUM(balance), 0) FROM investment_accounts WHERE user_id = u.id AND deleted_at IS NULL),
    0
  ) AS total_assets,
  -- Total Debt
  COALESCE((SELECT SUM(balance) FROM debt_accounts WHERE user_id = u.id AND deleted_at IS NULL), 0) AS total_debt
FROM users u
WHERE u.deleted_at IS NULL;
