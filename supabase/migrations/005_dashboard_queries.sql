-- ============================================================================
-- 005_dashboard_queries.sql - Networthy Dashboard Queries
-- ============================================================================
-- Pre-built queries and functions for dashboard analytics

-- ============================================================================
-- DASHBOARD SUMMARY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
  net_worth DECIMAL,
  monthly_income DECIMAL,
  monthly_expenses DECIMAL,
  monthly_savings DECIMAL,
  savings_rate_percent NUMERIC,
  emergency_fund_months NUMERIC,
  total_assets DECIMAL,
  total_debts DECIMAL,
  investment_value DECIMAL,
  number_of_goals INT,
  goals_completed INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(fhm.net_worth, 0)::DECIMAL,
    COALESCE(fhm.monthly_income, 0)::DECIMAL,
    COALESCE(fhm.monthly_expenses, 0)::DECIMAL,
    (COALESCE(fhm.monthly_income, 0) - COALESCE(fhm.monthly_expenses, 0))::DECIMAL,
    COALESCE(fhm.savings_rate_percent, 0)::NUMERIC,
    COALESCE(fhm.emergency_fund_months, 0)::NUMERIC,
    COALESCE(fhm.total_assets, 0)::DECIMAL,
    COALESCE(fhm.total_debt, 0)::DECIMAL,
    COALESCE(
      (SELECT SUM(shares * current_price) FROM investment_holdings WHERE user_id = p_user_id AND deleted_at IS NULL),
      0
    )::DECIMAL,
    COALESCE((SELECT COUNT(*) FROM savings_goals WHERE user_id = p_user_id AND deleted_at IS NULL), 0)::INT,
    COALESCE((SELECT COUNT(*) FROM savings_goals WHERE user_id = p_user_id AND is_active = FALSE AND deleted_at IS NULL), 0)::INT
  FROM financial_health_metrics fhm
  WHERE fhm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXPENSE BREAKDOWN BY CATEGORY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_expense_breakdown_by_category(
  p_user_id UUID,
  p_months_back INT DEFAULT 12
)
RETURNS TABLE (
  category_name TEXT,
  category_id UUID,
  color TEXT,
  total_spent DECIMAL,
  transaction_count INT,
  average_transaction DECIMAL,
  percent_of_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH category_totals AS (
    SELECT
      ec.name,
      ec.id,
      ec.color,
      SUM(e.amount) AS total,
      COUNT(*) AS count,
      AVG(e.amount) AS avg,
      SUM(SUM(e.amount)) OVER () AS grand_total
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.user_id = p_user_id
      AND e.deleted_at IS NULL
      AND ec.deleted_at IS NULL
      AND e.date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
    GROUP BY ec.id, ec.name, ec.color
  )
  SELECT
    name::TEXT,
    id::UUID,
    color::TEXT,
    total::DECIMAL,
    count::INT,
    avg::DECIMAL,
    ROUND((total / NULLIF(grand_total, 0) * 100)::NUMERIC, 2)
  FROM category_totals
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXPENSE TRENDS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_expense_trends(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_months_back INT DEFAULT 12
)
RETURNS TABLE (
  month DATE,
  category_name TEXT,
  amount DECIMAL,
  transaction_count INT,
  avg_transaction DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', e.date)::DATE,
    ec.name,
    SUM(e.amount)::DECIMAL,
    COUNT(*)::INT,
    AVG(e.amount)::DECIMAL
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE e.user_id = p_user_id
    AND e.deleted_at IS NULL
    AND ec.deleted_at IS NULL
    AND e.date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
    AND (p_category_id IS NULL OR e.category_id = p_category_id)
  GROUP BY DATE_TRUNC('month', e.date), ec.id, ec.name
  ORDER BY DATE_TRUNC('month', e.date) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INCOME BREAKDOWN FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_income_breakdown(
  p_user_id UUID,
  p_months_back INT DEFAULT 12
)
RETURNS TABLE (
  source_name TEXT,
  source_id UUID,
  income_type TEXT,
  color TEXT,
  total_income DECIMAL,
  total_tax DECIMAL,
  net_income DECIMAL,
  transaction_count INT,
  percent_of_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH income_totals AS (
    SELECT
      ics.name,
      ics.id,
      ics.type,
      ics.color,
      SUM(ir.amount) AS total,
      SUM(ir.tax_withheld) AS tax,
      SUM(ir.amount - COALESCE(ir.tax_withheld, 0)) AS net,
      COUNT(*) AS count,
      SUM(SUM(ir.amount)) OVER () AS grand_total
    FROM income_records ir
    JOIN income_sources ics ON ir.source_id = ics.id
    WHERE ir.user_id = p_user_id
      AND ir.deleted_at IS NULL
      AND ics.deleted_at IS NULL
      AND ir.date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
    GROUP BY ics.id, ics.name, ics.type, ics.color
  )
  SELECT
    name::TEXT,
    id::UUID,
    type::TEXT,
    color::TEXT,
    total::DECIMAL,
    tax::DECIMAL,
    net::DECIMAL,
    count::INT,
    ROUND((total / NULLIF(grand_total, 0) * 100)::NUMERIC, 2)
  FROM income_totals
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NET WORTH TREND FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_net_worth_trend(
  p_user_id UUID,
  p_months_back INT DEFAULT 24
)
RETURNS TABLE (
  snapshot_date DATE,
  total_assets DECIMAL,
  total_debts DECIMAL,
  net_worth DECIMAL,
  monthly_change DECIMAL,
  monthly_change_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nws.snapshot_date,
    nws.total_assets::DECIMAL,
    nws.total_debts::DECIMAL,
    nws.net_worth::DECIMAL,
    (nws.net_worth - LAG(nws.net_worth) OVER (ORDER BY nws.snapshot_date))::DECIMAL,
    CASE
      WHEN LAG(nws.net_worth) OVER (ORDER BY nws.snapshot_date) IS NOT NULL
      THEN ROUND(((nws.net_worth - LAG(nws.net_worth) OVER (ORDER BY nws.snapshot_date)) /
                   NULLIF(LAG(nws.net_worth) OVER (ORDER BY nws.snapshot_date), 0) * 100)::NUMERIC, 2)
      ELSE NULL
    END
  FROM net_worth_snapshots nws
  WHERE nws.user_id = p_user_id
    AND nws.snapshot_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  ORDER BY nws.snapshot_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PORTFOLIO ALLOCATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_portfolio_allocation(p_user_id UUID)
RETURNS TABLE (
  asset_class TEXT,
  holding_count INT,
  total_value DECIMAL,
  allocation_percent NUMERIC,
  gain_loss DECIMAL,
  gain_loss_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH portfolio AS (
    SELECT
      asset_class,
      COUNT(DISTINCT symbol) AS count,
      SUM(current_value) AS value,
      SUM(unrealized_gain_loss) AS gain_loss,
      SUM(SUM(current_value)) OVER () AS total_value
    FROM investment_summary
    WHERE user_id = p_user_id
    GROUP BY asset_class
  )
  SELECT
    asset_class::TEXT,
    count::INT,
    value::DECIMAL,
    ROUND((value / NULLIF(total_value, 0) * 100)::NUMERIC, 2),
    gain_loss::DECIMAL,
    CASE
      WHEN value > 0
      THEN ROUND((gain_loss / NULLIF(value, 0) * 100)::NUMERIC, 2)
      ELSE 0
    END
  FROM portfolio
  ORDER BY value DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAVINGS GOALS PROGRESS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_savings_goals_progress(p_user_id UUID)
RETURNS TABLE (
  goal_id UUID,
  goal_name TEXT,
  category TEXT,
  target_amount DECIMAL,
  current_amount DECIMAL,
  progress_percent NUMERIC,
  target_date DATE,
  days_remaining INT,
  daily_required_savings DECIMAL,
  status TEXT,
  is_active BOOLEAN,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sg.id,
    sg.name,
    sg.category,
    sg.target_amount::DECIMAL,
    COALESCE(sgc.current_amount, 0)::DECIMAL,
    CASE
      WHEN sg.target_amount > 0
      THEN ROUND((COALESCE(sgc.current_amount, 0) / sg.target_amount * 100)::NUMERIC, 2)
      ELSE 100::NUMERIC
    END,
    sg.target_date,
    CASE
      WHEN sg.target_date IS NOT NULL
      THEN (sg.target_date - CURRENT_DATE)
      ELSE NULL
    END,
    CASE
      WHEN sg.target_date IS NOT NULL
        AND (sg.target_date - CURRENT_DATE) > 0
        AND sg.target_amount > 0
      THEN ((sg.target_amount - COALESCE(sgc.current_amount, 0)) /
            (sg.target_date - CURRENT_DATE)::DECIMAL)
      ELSE NULL
    END,
    CASE
      WHEN NOT sg.is_active THEN 'Completed'
      WHEN sg.target_date IS NOT NULL AND (sg.target_date - CURRENT_DATE) < 0 THEN 'Overdue'
      WHEN sg.target_date IS NOT NULL THEN 'In Progress'
      ELSE 'No Target'
    END,
    sg.is_active,
    sg.color
  FROM savings_goals sg
  LEFT JOIN (
    SELECT goal_id, SUM(amount) AS current_amount
    FROM savings_goal_contributions
    GROUP BY goal_id
  ) sgc ON sg.id = sgc.goal_id
  WHERE sg.user_id = p_user_id
    AND sg.deleted_at IS NULL
  ORDER BY CASE
    WHEN sg.is_active THEN 0
    ELSE 1
  END, sg.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MONTHLY BUDGET COMPARISON FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_budget_comparison(
  p_user_id UUID,
  p_year INT DEFAULT NULL,
  p_month INT DEFAULT NULL
)
RETURNS TABLE (
  category_name TEXT,
  category_id UUID,
  budget_limit DECIMAL,
  actual_spent DECIMAL,
  percent_of_budget NUMERIC,
  remaining_budget DECIMAL,
  status TEXT,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH month_data AS (
    SELECT
      COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT) AS target_year,
      COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INT) AS target_month
  ),
  current_month_expenses AS (
    SELECT
      ec.id,
      ec.name,
      ec.budget_limit,
      ec.color,
      SUM(e.amount) AS total_spent,
      COUNT(*) AS transaction_count
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.id,
         month_data
    WHERE e.user_id = p_user_id
      AND e.deleted_at IS NULL
      AND ec.deleted_at IS NULL
      AND EXTRACT(YEAR FROM e.date) = month_data.target_year
      AND EXTRACT(MONTH FROM e.date) = month_data.target_month
    GROUP BY ec.id, ec.name, ec.budget_limit, ec.color
  )
  SELECT
    name::TEXT,
    id::UUID,
    budget_limit::DECIMAL,
    total_spent::DECIMAL,
    CASE
      WHEN budget_limit IS NOT NULL
      THEN ROUND((total_spent / budget_limit * 100)::NUMERIC, 2)
      ELSE NULL
    END,
    CASE
      WHEN budget_limit IS NOT NULL
      THEN (budget_limit - total_spent)::DECIMAL
      ELSE NULL
    END,
    CASE
      WHEN budget_limit IS NULL THEN 'No Budget'
      WHEN total_spent <= (budget_limit * 0.8) THEN 'On Track'
      WHEN total_spent <= budget_limit THEN 'Warning'
      ELSE 'Over Budget'
    END,
    color
  FROM current_month_expenses
  ORDER BY total_spent DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FINANCIAL METRICS SUMMARY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_financial_metrics(p_user_id UUID)
RETURNS TABLE (
  metric_name TEXT,
  metric_value DECIMAL,
  metric_unit TEXT,
  trend_direction TEXT,
  last_updated TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  WITH current_metrics AS (
    SELECT
      'Net Worth' AS name,
      COALESCE(fhm.net_worth, 0) AS value,
      'USD' AS unit
    FROM financial_health_metrics fhm
    WHERE fhm.user_id = p_user_id

    UNION ALL

    SELECT
      'Monthly Income' AS name,
      COALESCE(fhm.monthly_income, 0) AS value,
      'USD' AS unit
    FROM financial_health_metrics fhm
    WHERE fhm.user_id = p_user_id

    UNION ALL

    SELECT
      'Monthly Expenses' AS name,
      COALESCE(fhm.monthly_expenses, 0) AS value,
      'USD' AS unit
    FROM financial_health_metrics fhm
    WHERE fhm.user_id = p_user_id

    UNION ALL

    SELECT
      'Savings Rate' AS name,
      COALESCE(fhm.savings_rate_percent, 0) AS value,
      '%' AS unit
    FROM financial_health_metrics fhm
    WHERE fhm.user_id = p_user_id

    UNION ALL

    SELECT
      'Emergency Fund' AS name,
      COALESCE(fhm.emergency_fund_months, 0) AS value,
      'months' AS unit
    FROM financial_health_metrics fhm
    WHERE fhm.user_id = p_user_id

    UNION ALL

    SELECT
      'Investment Value' AS name,
      COALESCE(SUM(shares * current_price), 0) AS value,
      'USD' AS unit
    FROM investment_holdings
    WHERE user_id = p_user_id AND deleted_at IS NULL
  )
  SELECT
    name::TEXT,
    value::DECIMAL,
    unit::TEXT,
    NULL::TEXT,
    NOW()
  FROM current_metrics;
END;
$$ LANGUAGE plpgsql;
