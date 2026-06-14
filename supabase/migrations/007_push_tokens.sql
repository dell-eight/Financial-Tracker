-- Push tokens: one row per user, upserted on every app startup.
-- Used by the budget-alerts Edge Function to send Expo push notifications.

create table if not exists push_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  token      text        not null,
  platform   text        not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_user_id_unique unique (user_id)
);

alter table push_tokens enable row level security;

create policy "Users manage their own push token"
  on push_tokens for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Automatically update updated_at on upsert
create or replace function touch_push_token_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger push_tokens_updated_at
  before update on push_tokens
  for each row execute procedure touch_push_token_updated_at();

-- ── Server-side scheduled alerts ─────────────────────────────────────────────
-- Enable pg_cron (must be done by a superuser in Supabase dashboard → Extensions).
-- After enabling, schedule the Edge Function to run daily at 8:00 AM UTC:
--
--   select cron.schedule(
--     'budget-alerts-daily',
--     '0 8 * * *',
--     $$
--       select net.http_post(
--         url    := '<your-project-ref>.functions.supabase.co/budget-alerts',
--         headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
--       );
--     $$
--   );
--
-- Replace <your-project-ref> and <service-role-key> with actual values.
