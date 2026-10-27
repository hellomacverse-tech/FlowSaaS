-- FlowSaaS — 0003_runtime.sql (Phase 5: n8n runtime)
-- Atomic Micro-SaaS credit accounting + monthly reset, and a key id on
-- stored n8n API keys so ENCRYPTION_KEY can be rotated (Section 15.1).

alter table n8n_instances add column if not exists key_id int not null default 1;

create index if not exists tool_runs_user_created_idx on tool_runs (user_id, created_at desc);
create index if not exists sandbox_runs_created_idx on sandbox_runs (created_at);
create index if not exists api_keys_hash_idx on api_keys (key_hash) where revoked_at is null;

-- ---------------------------------------------------------------------
-- credit_status: returns the caller's credits after applying the monthly
-- reset if it's due. Called before running a tool (the cheap 402 pre-check).
-- ---------------------------------------------------------------------
create or replace function credit_status(p_user uuid)
returns table (tier text, credits_included int, credits_used int, remaining int, resets_at timestamptz)
as $$
declare
  v_tier text; v_included int; v_used int; v_reset timestamptz;
begin
  select p.tier, p.credits_included, p.credits_used, p.credits_reset_at
    into v_tier, v_included, v_used, v_reset
    from profiles p where p.id = p_user for update;

  if not found then
    return;
  end if;

  if v_reset <= now() then
    v_used := 0;
    v_reset := date_trunc('month', now()) + interval '1 month';
    update profiles set credits_used = 0, credits_reset_at = v_reset where id = p_user;
  end if;

  return query select v_tier, v_included, v_used, greatest(v_included - v_used, 0), v_reset;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------
-- record_tool_run: ONE transaction that (a) locks the profile row, (b)
-- charges credits only for a succeeded run and only if they still fit,
-- (c) inserts the tool_runs row, (d) upserts the usage_daily rollup
-- (Section 7.5). Failed / timed-out runs are recorded with 0 credits and
-- bump `failures`. The row lock makes two concurrent runs unable to both
-- spend the last credit. `insufficient` = true means nothing was written:
-- another request spent the credits between the pre-check and now.
-- ---------------------------------------------------------------------
create or replace function record_tool_run(
  p_user uuid, p_tool uuid, p_status run_status, p_input jsonb, p_output jsonb,
  p_error text, p_credits int, p_duration_ms int, p_source text
)
returns table (run_id uuid, charged int, credits_remaining int, insufficient boolean)
as $$
declare
  v_included int; v_used int; v_reset timestamptz; v_charge int := 0; v_run uuid;
begin
  select p.credits_included, p.credits_used, p.credits_reset_at
    into v_included, v_used, v_reset
    from profiles p where p.id = p_user for update;

  if v_reset <= now() then
    v_used := 0;
    v_reset := date_trunc('month', now()) + interval '1 month';
    update profiles set credits_used = 0, credits_reset_at = v_reset where id = p_user;
  end if;

  if p_status = 'succeeded' and p_credits > 0 then
    if v_used + p_credits > v_included then
      return query select null::uuid, 0, greatest(v_included - v_used, 0), true;
      return;
    end if;
    v_charge := p_credits;
    v_used := v_used + v_charge;
    update profiles set credits_used = v_used where id = p_user;
  end if;

  insert into tool_runs (user_id, tool_id, status, input, output, error, credits_charged, duration_ms, source)
  values (p_user, p_tool, p_status, p_input, p_output, p_error, v_charge, p_duration_ms, p_source)
  returning id into v_run;

  insert into usage_daily (user_id, day, executions, credits, failures)
  values (p_user, current_date, 1, v_charge, case when p_status = 'succeeded' then 0 else 1 end)
  on conflict (user_id, day) do update
    set executions = usage_daily.executions + 1,
        credits    = usage_daily.credits + v_charge,
        failures   = usage_daily.failures + case when p_status = 'succeeded' then 0 else 1 end;

  return query select v_run, v_charge, greatest(v_included - v_used, 0), false;
end;
$$ language plpgsql security definer set search_path = public;

-- Service-role only: called from route handlers, never directly by clients.
revoke execute on function credit_status(uuid) from public, anon, authenticated;
revoke execute on function record_tool_run(uuid, uuid, run_status, jsonb, jsonb, text, int, int, text)
  from public, anon, authenticated;

-- Purge sandbox inputs after 30 days (Section 15.2). Schedule with pg_cron:
--   select cron.schedule('purge-sandbox', '17 3 * * *', $$select purge_old_sandbox_runs()$$);
create or replace function purge_old_sandbox_runs() returns int as $$
declare v_count int;
begin
  delete from sandbox_runs where created_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql security definer set search_path = public;
revoke execute on function purge_old_sandbox_runs() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Missing RLS on api_keys (0001 only granted select-own): the create and
-- revoke routes run as the signed-in user via the anon+session client, not
-- the service role, so INSERT/UPDATE need their own policies. Revoke is a
-- soft-delete (sets revoked_at) rather than a real delete, so no delete
-- policy is added.
-- ---------------------------------------------------------------------
create policy "api_keys_insert_own" on api_keys
  for insert with check (auth.uid() = user_id);
create policy "api_keys_revoke_own" on api_keys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
