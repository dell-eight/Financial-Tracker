-- Fix RLS SELECT policies on income_records and expenses to allow soft-delete.
--
-- PostgREST uses RETURNING after every UPDATE to verify the result. When the
-- old SELECT policy included `deleted_at IS NULL`, setting deleted_at caused
-- the updated row to become invisible, making PostgREST treat it as an RLS
-- violation (403 "new row violates row-level security policy").
--
-- The app already filters deleted_at IS NULL at the query level (every service
-- call appends ?deleted_at=is.null), so removing it from RLS is safe.

DROP POLICY "Users can read own active expenses" ON public.expenses;
CREATE POLICY "Users can read own expenses" ON public.expenses
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id);

DROP POLICY "Users can read own active income records" ON public.income_records;
CREATE POLICY "Users can read own income records" ON public.income_records
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id);
