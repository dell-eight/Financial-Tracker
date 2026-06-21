-- Add explicit captured_at column to record the actual measurement date,
-- separate from snapshot_date (month key = first of month).
ALTER TABLE public.net_worth_snapshots
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill existing rows: use created_at as the best available proxy for
-- when the measurement was originally taken.
UPDATE public.net_worth_snapshots
   SET captured_at = created_at
 WHERE captured_at = NOW(); -- only rows that got the DEFAULT (i.e., not yet set)

-- Replace upsert_net_worth_snapshot with an immutable version:
-- ON CONFLICT DO NOTHING ensures historical snapshots are append-only.
-- Once a monthly snapshot exists it is never overwritten by a later dashboard load.
CREATE OR REPLACE FUNCTION upsert_net_worth_snapshot(
  p_user_id       UUID,
  p_snapshot_date DATE,
  p_total_assets  DECIMAL(15,2),
  p_total_debts   DECIMAL(15,2),
  p_net_worth     DECIMAL(15,2),
  p_liquid_assets DECIMAL(15,2),
  p_investments   DECIMAL(15,2),
  p_real_estate   DECIMAL(15,2),
  p_other_assets  DECIMAL(15,2),
  p_captured_at   TIMESTAMPTZ DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL OR v_caller <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO net_worth_snapshots (
    user_id, snapshot_date,
    total_assets, total_debts, net_worth,
    liquid_assets, investments, real_estate, other_assets,
    captured_at, updated_at
  ) VALUES (
    p_user_id, p_snapshot_date,
    p_total_assets, p_total_debts, p_net_worth,
    p_liquid_assets, p_investments, p_real_estate, p_other_assets,
    COALESCE(p_captured_at, NOW()), NOW()
  )
  ON CONFLICT (user_id, snapshot_date) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_net_worth_snapshot(
  UUID, DATE, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, TIMESTAMPTZ
) TO authenticated;
