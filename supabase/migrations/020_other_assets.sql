CREATE TABLE IF NOT EXISTS other_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'other',
  CONSTRAINT other_assets_category_check CHECK (
    category IN ('real_estate','vehicle','fixed_deposit','business','p2p','collectibles','other')
  ),
  value          NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  purchase_value NUMERIC(15,2) CHECK (purchase_value IS NULL OR purchase_value >= 0),
  purchase_date  DATE CHECK (purchase_date IS NULL OR purchase_date <= CURRENT_DATE),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

ALTER TABLE other_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own other_assets" ON other_assets
  FOR ALL USING (auth.uid() = user_id);

-- Partial index for fast active-row queries
CREATE INDEX idx_other_assets_user_active
  ON other_assets(user_id)
  WHERE deleted_at IS NULL;

-- Auto-update updated_at (reuses helper defined in 001_init.sql)
CREATE TRIGGER update_other_assets_updated_at
  BEFORE UPDATE ON other_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Soft-delete RPC (same SECURITY DEFINER pattern as delete_investment_holding)
CREATE OR REPLACE FUNCTION delete_other_asset(p_asset_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE other_assets
  SET deleted_at = now()
  WHERE id = p_asset_id AND user_id = auth.uid();
END;
$$;
