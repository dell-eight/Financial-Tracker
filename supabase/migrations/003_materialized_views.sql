-- ============================================================================
-- 003_materialized_views.sql - Financial Tracker Materialized Views
-- ============================================================================
-- Materialized views for complex aggregations and analytics
-- Refresh schedule: Daily at 2 AM UTC

-- ============================================================================
-- ANNUAL SUMMARY MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_annual_summary AS
SELECT
  u.id AS user_id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INT AS year,
  -- Income
  COALESCE(SUM(CASE WHEN ir.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN ir.amount ELSE 0 END), 0) AS annual_income,
  COALESCE(SUM(CASE WHEN ir.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN ir.tax_withheld ELSE 0 END), 0) AS annual_tax,
  -- Expenses
  COALESCE(SUM(CASE WHEN e.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN e.amount ELSE 0 END), 0) AS annual_expenses,
  -- Savings
  COALESCE(SUM(CASE WHEN ir.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN ir.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN e.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN e.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN ir.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN ir.tax_withheld ELSE 0 END), 0) AS annual_net_savings,
  CURRENT_DATE AS calculated_date
FROM users u
LEFT JOIN income_records ir ON u.id = ir.user_id AND ir.deleted_at IS NULL
LEFT JOIN expenses e ON u.id = e.user_id AND e.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id;

CREATE INDEX        idx_mv_annual_summary_user_id    ON mv_annual_summary(user_id);
CREATE UNIQUE INDEX uidx_mv_annual_summary_user_id  ON mv_annual_summary(user_id);

-- ============================================================================
-- NET WORTH HISTORY MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_net_worth_history AS
SELECT
  nws.user_id,
  nws.snapshot_date,
  nws.total_assets,
  nws.total_debts,
  nws.net_worth,
  nws.liquid_assets,
  nws.investments,
  nws.real_estate,
  -- Month over month change
  LAG(nws.net_worth) OVER (PARTITION BY nws.user_id ORDER BY nws.snapshot_date) AS previous_month_net_worth,
  (nws.net_worth - LAG(nws.net_worth) OVER (PARTITION BY nws.user_id ORDER BY nws.snapshot_date)) AS monthly_net_worth_change,
  CASE
    WHEN LAG(nws.net_worth) OVER (PARTITION BY nws.user_id ORDER BY nws.snapshot_date) IS NOT NULL AND
         LAG(nws.net_worth) OVER (PARTITION BY nws.user_id ORDER BY nws.snapshot_date) > 0
    THEN ((nws.net_worth - LAG(nws.net_worth) OVER (PARTITION BY nws.user_id ORDER BY nws.snapshot_date)) /
          LAG(nws.net_worth) OVER (PARTITION BY nws.user_id ORDER BY nws.snapshot_date) * 100)
    ELSE 0
  END AS monthly_net_worth_change_percent
FROM net_worth_snapshots nws
WHERE nws.snapshot_date >= CURRENT_DATE - INTERVAL '10 years';

CREATE INDEX        idx_mv_net_worth_history_user_date  ON mv_net_worth_history(user_id, snapshot_date DESC);
CREATE UNIQUE INDEX uidx_mv_net_worth_history_user_date ON mv_net_worth_history(user_id, snapshot_date);

-- ============================================================================
-- EXPENSE ANALYTICS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_expense_analytics AS
WITH monthly_totals AS (
  SELECT
    e.user_id,
    ec.id AS category_id,
    ec.name AS category_name,
    DATE_TRUNC('month', e.date)::DATE AS month,
    SUM(e.amount) AS monthly_total,
    COUNT(*) AS transaction_count,
    AVG(e.amount) AS avg_transaction
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE e.deleted_at IS NULL AND ec.deleted_at IS NULL
  GROUP BY e.user_id, ec.id, ec.name, DATE_TRUNC('month', e.date)
),
rolling_average AS (
  SELECT
    user_id,
    category_id,
    category_name,
    month,
    monthly_total,
    transaction_count,
    avg_transaction,
    AVG(monthly_total) OVER (PARTITION BY user_id, category_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS avg_12_month,
    MIN(monthly_total) OVER (PARTITION BY user_id, category_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS min_12_month,
    MAX(monthly_total) OVER (PARTITION BY user_id, category_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS max_12_month
  FROM monthly_totals
)
SELECT
  user_id,
  category_id,
  category_name,
  month,
  monthly_total,
  transaction_count,
  avg_transaction,
  avg_12_month,
  min_12_month,
  max_12_month
FROM rolling_average
WHERE month >= CURRENT_DATE - INTERVAL '10 years';

CREATE INDEX        idx_mv_expense_analytics_user_month  ON mv_expense_analytics(user_id, month DESC);
CREATE UNIQUE INDEX uidx_mv_expense_analytics_user_month ON mv_expense_analytics(user_id, category_id, month);

-- ============================================================================
-- BUDGET PERFORMANCE MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_budget_performance AS
SELECT
  bva.user_id,
  bva.month,
  bva.category_id,
  bva.category_name,
  bva.budget_limit,
  bva.actual_spent,
  bva.percent_of_budget,
  bva.remaining_budget,
  CASE
    WHEN bva.percent_of_budget <= 80 THEN 'On Track'
    WHEN bva.percent_of_budget <= 100 THEN 'Warning'
    ELSE 'Over Budget'
  END AS status,
  -- Average spending for this category
  COALESCE(
    AVG(bva.actual_spent) OVER (PARTITION BY bva.user_id, bva.category_id ORDER BY bva.month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW),
    bva.actual_spent
  ) AS avg_12_month_spending
FROM budget_vs_actual bva
WHERE bva.month >= CURRENT_DATE - INTERVAL '10 years';

CREATE INDEX        idx_mv_budget_performance_user_month  ON mv_budget_performance(user_id, month DESC);
CREATE UNIQUE INDEX uidx_mv_budget_performance_user_month ON mv_budget_performance(user_id, category_id, month);

-- ============================================================================
-- INVESTMENT PERFORMANCE MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_investment_performance AS
SELECT
  ih.id                                            AS holding_id,
  ih.user_id,
  ia.id                                            AS account_id,
  ia.name                                          AS account_name,
  ia.account_type,
  ih.symbol,
  ih.name                                          AS holding_name,
  ih.asset_class,
  ih.sector,
  ih.shares,
  ih.current_price,
  ih.purchase_price,
  (ih.shares * ih.current_price)                   AS current_value,
  (ih.shares * ih.purchase_price)                  AS cost_basis,
  ((ih.shares * ih.current_price) - (ih.shares * ih.purchase_price)) AS unrealized_gain_loss,
  CASE
    WHEN (ih.shares * ih.purchase_price) > 0
    THEN (((ih.shares * ih.current_price) - (ih.shares * ih.purchase_price)) /
          (ih.shares * ih.purchase_price) * 100)
    ELSE 0
  END                                              AS gain_loss_percent,
  CASE
    WHEN (ih.shares * ih.current_price) > (ih.shares * ih.purchase_price) THEN 'Gain'
    WHEN (ih.shares * ih.current_price) < (ih.shares * ih.purchase_price) THEN 'Loss'
    ELSE 'Neutral'
  END                                              AS performance_status,
  ROUND(
    (ih.shares * ih.current_price) /
    NULLIF(SUM(ih.shares * ih.current_price) OVER (PARTITION BY ih.user_id), 0) * 100,
    2
  )                                                AS portfolio_percent
FROM investment_holdings ih
JOIN investment_accounts ia ON ih.account_id = ia.id
WHERE ih.deleted_at IS NULL AND ia.deleted_at IS NULL;

CREATE INDEX        idx_mv_investment_performance_user    ON mv_investment_performance(user_id);
CREATE UNIQUE INDEX uidx_mv_investment_performance_holding ON mv_investment_performance(holding_id);

-- ============================================================================
-- ASSET ALLOCATION HISTORICAL MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_asset_allocation_history AS
SELECT
  nws.user_id,
  nws.snapshot_date,
  'Liquid Assets' AS asset_type,
  COALESCE(nws.liquid_assets, 0) AS value,
  CASE
    WHEN nws.total_assets > 0
    THEN ROUND(COALESCE(nws.liquid_assets, 0) / nws.total_assets * 100, 2)
    ELSE 0
  END AS allocation_percent
FROM net_worth_snapshots nws
WHERE nws.snapshot_date >= CURRENT_DATE - INTERVAL '10 years'

UNION ALL

SELECT
  nws.user_id,
  nws.snapshot_date,
  'Investments' AS asset_type,
  COALESCE(nws.investments, 0) AS value,
  CASE
    WHEN nws.total_assets > 0
    THEN ROUND(COALESCE(nws.investments, 0) / nws.total_assets * 100, 2)
    ELSE 0
  END AS allocation_percent
FROM net_worth_snapshots nws
WHERE nws.snapshot_date >= CURRENT_DATE - INTERVAL '10 years'

UNION ALL

SELECT
  nws.user_id,
  nws.snapshot_date,
  'Real Estate' AS asset_type,
  COALESCE(nws.real_estate, 0) AS value,
  CASE
    WHEN nws.total_assets > 0
    THEN ROUND(COALESCE(nws.real_estate, 0) / nws.total_assets * 100, 2)
    ELSE 0
  END AS allocation_percent
FROM net_worth_snapshots nws
WHERE nws.snapshot_date >= CURRENT_DATE - INTERVAL '10 years';

CREATE INDEX        idx_mv_asset_allocation_history_user_date  ON mv_asset_allocation_history(user_id, snapshot_date DESC);
CREATE UNIQUE INDEX uidx_mv_asset_allocation_history_user_date ON mv_asset_allocation_history(user_id, snapshot_date, asset_type);

-- ============================================================================
-- INCOME ANALYSIS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_income_analysis AS
WITH monthly_income AS (
  SELECT
    user_id,
    source_id,
    source_name,
    type,
    DATE_TRUNC('month', date)::DATE AS month,
    SUM(amount) AS monthly_income,
    SUM(tax_withheld) AS monthly_tax,
    COUNT(*) AS transaction_count
  FROM (
    SELECT
      ir.user_id,
      ics.id AS source_id,
      ics.name AS source_name,
      ics.type,
      ir.date,
      ir.amount,
      ir.tax_withheld
    FROM income_records ir
    JOIN income_sources ics ON ir.source_id = ics.id
    WHERE ir.deleted_at IS NULL AND ics.deleted_at IS NULL
  ) t
  GROUP BY user_id, source_id, source_name, type, DATE_TRUNC('month', date)
)
SELECT
  user_id,
  source_id,
  source_name,
  type,
  month,
  monthly_income,
  monthly_tax,
  transaction_count,
  AVG(monthly_income) OVER (PARTITION BY user_id, source_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS avg_12_month,
  MAX(monthly_income) OVER (PARTITION BY user_id, source_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS max_12_month,
  MIN(monthly_income) OVER (PARTITION BY user_id, source_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS min_12_month
FROM monthly_income
WHERE month >= CURRENT_DATE - INTERVAL '10 years'
ORDER BY user_id, month DESC;

CREATE INDEX        idx_mv_income_analysis_user_month  ON mv_income_analysis(user_id, month DESC);
CREATE UNIQUE INDEX uidx_mv_income_analysis_user_month ON mv_income_analysis(user_id, source_id, month);

-- ============================================================================
-- FINANCIAL GOALS PROGRESS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW mv_financial_goals_progress AS
SELECT
  sg.id AS goal_id,
  sg.user_id,
  sg.name,
  sg.category,
  sg.target_amount,
  sgs.current_amount,
  sg.target_date,
  sgs.progress_percent,
  sgs.days_remaining,
  CASE
    WHEN sgs.days_remaining > 0 AND sgs.progress_percent < 100
    THEN sgs.daily_required_savings
    ELSE 0
  END AS daily_required_savings,
  sg.priority,
  sg.is_active,
  -- On track indicator
  CASE
    WHEN sg.target_date IS NOT NULL AND sgs.days_remaining > 0
    THEN CASE
      WHEN sgs.progress_percent >= (100 - ((sgs.days_remaining /
            (sg.target_date - sg.created_at::DATE)::DECIMAL)) * 100)
      THEN 'On Track'
      ELSE 'Behind'
    END
    ELSE 'No Target'
  END AS status
FROM savings_goals sg
LEFT JOIN savings_goal_status sgs ON sg.id = sgs.id
WHERE sg.deleted_at IS NULL;

CREATE INDEX        idx_mv_financial_goals_progress_user    ON mv_financial_goals_progress(user_id);
CREATE UNIQUE INDEX uidx_mv_financial_goals_progress_goal  ON mv_financial_goals_progress(goal_id);

-- ============================================================================
-- REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_annual_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_net_worth_history;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_budget_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_investment_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_asset_allocation_history;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_income_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_goals_progress;
  RAISE NOTICE 'Materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;
