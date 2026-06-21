-- Stores in-app budget alert notifications per user.
-- read_at IS NULL means unread; set to now() to mark as read.
-- dedupe_key mirrors the AsyncStorage key used for push deduplication,
-- so upsert is idempotent even if the threshold fires multiple times.

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL,      -- 'budget_warning' | 'budget_over'
  title       text        NOT NULL,
  body        text        NOT NULL,
  data        jsonb,                     -- { budgetId, ratio, spent, limit, month, year }
  dedupe_key  text,                       -- dedup key scoped per user (see constraint below)
  read_at     timestamptz,               -- NULL = unread
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Per-user dedup: same key can exist for different users, but not twice for the same user
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_dedupe_unique UNIQUE (user_id, dedupe_key);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING  ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
-- No DELETE grant intentionally — notifications are permanent records.
-- Future: prune rows older than 1 year via a scheduled job or migration.
