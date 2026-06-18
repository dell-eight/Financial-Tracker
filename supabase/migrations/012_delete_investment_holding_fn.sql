-- Creates a SECURITY DEFINER function so the soft-delete UPDATE runs as
-- the function owner (postgres), bypassing the RLS catch-22 where setting
-- deleted_at makes the row fail the SELECT policy's WITH CHECK on the new row.
-- Ownership is still verified explicitly via auth.uid() inside the function.

CREATE OR REPLACE FUNCTION delete_investment_holding(p_holding_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM investment_holdings
    WHERE id = p_holding_id AND user_id = v_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Holding not found';
  END IF;

  -- Hard-delete all associated trade records
  DELETE FROM investment_transactions
  WHERE holding_id = p_holding_id AND user_id = v_user_id;

  -- Soft-delete the holding
  UPDATE investment_holdings
  SET deleted_at = NOW()
  WHERE id = p_holding_id AND user_id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_investment_holding(UUID) TO authenticated;
