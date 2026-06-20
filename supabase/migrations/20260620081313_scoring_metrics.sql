-- Adds 90-day scoring inputs to get_dashboard_summary RPC:
--   savings_rate_3m  — 90-day rolling savings rate % (more stable than 30-day for health scoring)
--   income_90d       — raw 90-day income total; TypeScript annualizes as × 4 for debt ratio
--
-- Both use the same time window so savings rate and debt ratio share a consistent baseline.

-- DROP required because adding columns changes the return type (CREATE OR REPLACE disallows this)
DROP FUNCTION IF EXISTS get_dashboard_summary(UUID);
CREATE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
  net_worth             DECIMAL,
  monthly_income        DECIMAL,
  monthly_expenses      DECIMAL,
  monthly_savings       DECIMAL,
  savings_rate_percent  NUMERIC,
  emergency_fund_months NUMERIC,
  total_assets          DECIMAL,
  total_debts           DECIMAL,
  investment_value      DECIMAL,
  number_of_goals       INT,
  goals_completed       INT,
  savings_rate_3m       NUMERIC,
  income_90d            NUMERIC
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
    COALESCE((SELECT COUNT(*) FROM savings_goals WHERE user_id = p_user_id AND is_active = FALSE AND deleted_at IS NULL), 0)::INT,

    -- 90-day rolling savings rate
    CASE
      WHEN COALESCE(
        (SELECT SUM(amount) FROM income_records WHERE user_id = p_user_id AND date >= CURRENT_DATE - 90 AND deleted_at IS NULL),
        0
      ) > 0
      THEN (
        COALESCE((SELECT SUM(amount) FROM income_records  WHERE user_id = p_user_id AND date >= CURRENT_DATE - 90 AND deleted_at IS NULL), 0)
        -
        COALESCE((SELECT SUM(amount) FROM expenses         WHERE user_id = p_user_id AND date >= CURRENT_DATE - 90 AND deleted_at IS NULL), 0)
      ) /
      COALESCE((SELECT SUM(amount) FROM income_records WHERE user_id = p_user_id AND date >= CURRENT_DATE - 90 AND deleted_at IS NULL), 1) * 100
      ELSE 0
    END,

    -- Raw 90-day income total (annualize as * 4 in TypeScript)
    COALESCE(
      (SELECT SUM(amount) FROM income_records WHERE user_id = p_user_id AND date >= CURRENT_DATE - 90 AND deleted_at IS NULL),
      0
    )::NUMERIC

  FROM financial_health_metrics fhm
  WHERE fhm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
