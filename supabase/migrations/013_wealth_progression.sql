-- ============================================================================
-- 013_wealth_progression.sql
-- Wealth Progression: monthly snapshot upsert function + milestones table
-- ============================================================================

-- ── wealth_milestones ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wealth_milestones (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type           TEXT NOT NULL,
  achieved_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  net_worth_at_achievement DECIMAL(15, 2),
  celebrated               BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, milestone_type)
);

-- RLS
ALTER TABLE wealth_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own milestones"
  ON wealth_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own milestones"
  ON wealth_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own milestones"
  ON wealth_milestones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── upsert_net_worth_snapshot ──────────────────────────────────────────────────
-- SECURITY DEFINER so the INSERT ... ON CONFLICT DO UPDATE runs as the function
-- owner (postgres), bypassing the same RLS catch-22 as delete_investment_holding.
-- Ownership is verified explicitly via auth.uid().

CREATE OR REPLACE FUNCTION upsert_net_worth_snapshot(
  p_user_id     UUID,
  p_snapshot_date DATE,
  p_total_assets  DECIMAL(15,2),
  p_total_debts   DECIMAL(15,2),
  p_net_worth     DECIMAL(15,2),
  p_liquid_assets DECIMAL(15,2),
  p_investments   DECIMAL(15,2),
  p_real_estate   DECIMAL(15,2),
  p_other_assets  DECIMAL(15,2)
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
    updated_at
  ) VALUES (
    p_user_id, p_snapshot_date,
    p_total_assets, p_total_debts, p_net_worth,
    p_liquid_assets, p_investments, p_real_estate, p_other_assets,
    NOW()
  )
  ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
    total_assets  = EXCLUDED.total_assets,
    total_debts   = EXCLUDED.total_debts,
    net_worth     = EXCLUDED.net_worth,
    liquid_assets = EXCLUDED.liquid_assets,
    investments   = EXCLUDED.investments,
    real_estate   = EXCLUDED.real_estate,
    other_assets  = EXCLUDED.other_assets,
    updated_at    = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_net_worth_snapshot(UUID, DATE, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
