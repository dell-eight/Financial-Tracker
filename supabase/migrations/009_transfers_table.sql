-- Migration 009: Create transfers table for neutral money movement between accounts
--
-- Transfers are not income or expense — they are neutral. Using a dedicated
-- table keeps them out of all existing aggregation queries (get_dashboard_summary,
-- monthly_cash_flow, getBudgets, getWeeklyHistory) without any changes to those.

CREATE TABLE transfers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES asset_accounts(id),
  to_account_id   uuid NOT NULL REFERENCES asset_accounts(id),
  amount          numeric(15, 2) NOT NULL,
  date            date NOT NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transfers" ON transfers
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clean up transfer records created by the old implementation (which incorrectly
-- inserted them as expense + income records).
DELETE FROM expenses
  WHERE category_id IN (
    SELECT id FROM expense_categories WHERE name = 'Transfer'
  );

DELETE FROM income_records
  WHERE source_id IN (
    SELECT id FROM income_sources WHERE type = 'transfer'
  );

DELETE FROM expense_categories WHERE name = 'Transfer';
DELETE FROM income_sources     WHERE type = 'transfer';
