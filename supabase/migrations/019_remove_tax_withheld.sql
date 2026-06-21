-- Remove tax_withheld from income_records and fix all dependent views.
-- This app is purely manual-entry; users enter their take-home income directly.
-- Tax withheld was never surfaced in the UI and was silently corrupting
-- historical net_cash_flow (deducting tax from history but not from live txns).

-- 1. Drop the column with CASCADE — removes all dependent views/matviews automatically
ALTER TABLE income_records DROP COLUMN IF EXISTS tax_withheld CASCADE;

-- 2. Recreate monthly_income_summary (no total_tax / net_income)
CREATE OR REPLACE VIEW monthly_income_summary AS
SELECT
  ir.user_id,
  DATE_TRUNC('month', ir.date)::DATE AS month,
  ics.id     AS source_id,
  ics.name   AS source_name,
  ics.type,
  ics.color,
  COUNT(*)       AS transaction_count,
  SUM(ir.amount) AS total_amount,
  AVG(ir.amount) AS avg_amount
FROM income_records ir
JOIN income_sources ics ON ir.source_id = ics.id
WHERE ir.deleted_at IS NULL AND ics.deleted_at IS NULL
GROUP BY ir.user_id, DATE_TRUNC('month', ir.date), ics.id, ics.name, ics.type, ics.color;

-- 3. Recreate monthly_cash_flow — net_cash_flow = gross_income − expenses (no tax)
CREATE OR REPLACE VIEW monthly_cash_flow AS
SELECT
  COALESCE(e.user_id, i.user_id)   AS user_id,
  COALESCE(e.month,   i.month)     AS month,
  COALESCE(SUM(i.total_amount), 0) AS total_income,
  COALESCE(SUM(e.total_amount), 0) AS total_expenses,
  COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(e.total_amount), 0) AS net_cash_flow
FROM monthly_income_summary i
FULL OUTER JOIN (
  SELECT user_id, month, SUM(total_amount) AS total_amount
  FROM monthly_expense_summary
  GROUP BY user_id, month
) e ON i.user_id = e.user_id AND i.month = e.month
GROUP BY COALESCE(e.user_id, i.user_id), COALESCE(e.month, i.month);

-- 4. Recreate income_trends (no total_tax / net_income)
CREATE OR REPLACE VIEW income_trends AS
SELECT
  ir.user_id,
  ics.id         AS source_id,
  ics.name       AS source_name,
  DATE_TRUNC('month', ir.date)::DATE AS month,
  EXTRACT(YEAR  FROM ir.date)::INT   AS year,
  EXTRACT(MONTH FROM ir.date)::INT   AS month_num,
  SUM(ir.amount)     AS total_amount,
  COUNT(*)           AS transaction_count
FROM income_records ir
JOIN income_sources ics ON ir.source_id = ics.id
WHERE ir.deleted_at IS NULL AND ics.deleted_at IS NULL
GROUP BY ir.user_id, ics.id, ics.name,
         DATE_TRUNC('month', ir.date),
         EXTRACT(YEAR FROM ir.date),
         EXTRACT(MONTH FROM ir.date);

-- 5. Recreate mv_annual_summary — annual_net_savings = income − expenses (no tax)
CREATE MATERIALIZED VIEW mv_annual_summary AS
SELECT
  u.id AS user_id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INT AS year,
  COALESCE(SUM(CASE WHEN ir.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN ir.amount ELSE 0 END), 0) AS annual_income,
  COALESCE(SUM(CASE WHEN e.date::DATE  >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN e.amount  ELSE 0 END), 0) AS annual_expenses,
  COALESCE(SUM(CASE WHEN ir.date::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN ir.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN e.date::DATE  >= DATE_TRUNC('year', CURRENT_DATE)::DATE THEN e.amount  ELSE 0 END), 0) AS annual_net_savings,
  CURRENT_DATE AS calculated_date
FROM users u
LEFT JOIN income_records ir ON u.id = ir.user_id AND ir.deleted_at IS NULL
LEFT JOIN expenses e        ON u.id = e.user_id  AND e.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id;

CREATE INDEX        idx_mv_annual_summary_user_id   ON mv_annual_summary(user_id);
CREATE UNIQUE INDEX uidx_mv_annual_summary_user_id  ON mv_annual_summary(user_id);

-- 6. Recreate mv_income_analysis — remove monthly_tax column
CREATE MATERIALIZED VIEW mv_income_analysis AS
WITH monthly_income AS (
  SELECT
    ir.user_id,
    ics.id         AS source_id,
    ics.name       AS source_name,
    ics.type,
    DATE_TRUNC('month', ir.date)::DATE AS month,
    SUM(ir.amount) AS monthly_income,
    COUNT(*)       AS transaction_count
  FROM income_records ir
  JOIN income_sources ics ON ir.source_id = ics.id
  WHERE ir.deleted_at IS NULL AND ics.deleted_at IS NULL
  GROUP BY ir.user_id, ics.id, ics.name, ics.type, DATE_TRUNC('month', ir.date)
)
SELECT
  user_id,
  source_id,
  source_name,
  type,
  month,
  monthly_income,
  transaction_count,
  AVG(monthly_income) OVER (PARTITION BY user_id, source_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS avg_12_month,
  MAX(monthly_income) OVER (PARTITION BY user_id, source_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS max_12_month,
  MIN(monthly_income) OVER (PARTITION BY user_id, source_id ORDER BY month ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS min_12_month
FROM monthly_income
WHERE month >= CURRENT_DATE - INTERVAL '10 years'
ORDER BY user_id, month DESC;

CREATE INDEX        idx_mv_income_analysis_user_month   ON mv_income_analysis(user_id, month DESC);
CREATE UNIQUE INDEX uidx_mv_income_analysis_user_month  ON mv_income_analysis(user_id, source_id, month);

-- 7. Update get_income_breakdown function — remove total_tax and net_income return columns
DROP FUNCTION IF EXISTS get_income_breakdown(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_income_breakdown(p_user_id uuid, p_months_back integer DEFAULT 12)
RETURNS TABLE(source_name text, source_id uuid, income_type text, color text, total_income numeric, transaction_count integer, percent_of_total numeric)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH income_totals AS (
    SELECT
      ics.name,
      ics.id,
      ics.type,
      ics.color,
      SUM(ir.amount)       AS total,
      COUNT(*)::INT        AS count,
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
    total::NUMERIC,
    count::INT,
    ROUND((total / NULLIF(grand_total, 0) * 100)::NUMERIC, 2)
  FROM income_totals
  ORDER BY total DESC;
END;
$function$;
