-- Add account_id to expenses and income_records so transactions can be linked
-- to a specific asset_account. Uses IF NOT EXISTS so this is safe to re-run.
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES asset_accounts(id) ON DELETE SET NULL;

ALTER TABLE income_records
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES asset_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_account_id       ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_income_records_account_id ON income_records(account_id);
