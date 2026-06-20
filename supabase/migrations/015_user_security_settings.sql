-- Per-user security settings stored in Supabase so they follow the account,
-- not the device. PIN hashes remain in SecureStore (never in the DB).

CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_enabled  boolean     NOT NULL DEFAULT false,
  pin_enabled        boolean     NOT NULL DEFAULT false,
  auto_lock_minutes  integer     NOT NULL DEFAULT 0,  -- 0 = never, 1 / 5 / 15
  screenshot_privacy boolean     NOT NULL DEFAULT false,
  two_factor_enabled boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own security settings"
  ON public.user_security_settings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own security settings"
  ON public.user_security_settings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own security settings"
  ON public.user_security_settings FOR UPDATE
  TO authenticated
  USING  ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT, INSERT, UPDATE ON public.user_security_settings TO authenticated;
