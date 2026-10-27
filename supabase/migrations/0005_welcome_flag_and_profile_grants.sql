-- VIP welcome email: send exactly once (fixes the Phase 4 re-fire heuristic)
alter table subscriptions add column if not exists welcome_sent_at timestamptz;

-- Key rotation support for stored n8n API keys
alter table n8n_instances add column if not exists key_id text not null default 'v1';

-- A row-level policy cannot restrict columns. Without this, a signed-in user could
-- UPDATE their own profile and set tier = 'vip' or raise credits_included.
revoke update on profiles from anon, authenticated;
grant update (full_name, avatar_url, company) on profiles to authenticated;

-- Lets the RLS test and the nightly check assert "no public table without RLS"
create or replace function rls_disabled_tables() returns setof text
language sql security definer set search_path = pg_catalog as $$
  select tablename::text from pg_tables where schemaname = 'public' and not rowsecurity
$$;
revoke all on function rls_disabled_tables() from public, anon, authenticated;
grant execute on function rls_disabled_tables() to service_role;
