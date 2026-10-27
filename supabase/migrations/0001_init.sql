-- FlowSaaS — 0001_init.sql
-- Core schema: enums, tables, indexes, updated_at triggers, and Row Level
-- Security policies for every table (Section 5). RLS is enabled on every
-- table without exception; service-role access (webhooks, admin scripts)
-- bypasses RLS by design and must never be used from client code.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type workflow_status as enum ('draft', 'published', 'archived');
create type sub_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type run_status as enum ('queued', 'running', 'succeeded', 'failed', 'timeout', 'rate_limited');
create type lead_type as enum ('dfy_quote', 'enterprise', 'contact');

-- ---------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  company text,
  stripe_customer_id text unique,
  license_key text unique not null,              -- FSK-XXXX-XXXX-XXXX-XXXX
  tier text not null default 'free' check (tier in ('free', 'vip', 'enterprise')),
  credits_included int not null default 50,
  credits_used int not null default 0,
  credits_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-provision a profile row (with a generated license key) whenever a
-- new auth.users row is created (Section 8.1).
create or replace function generate_license_key()
returns text as $$
declare
  chars text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; -- Crockford base32 alphabet
  segment text;
  result text := 'FSK';
  i int;
  j int;
begin
  for i in 1..4 loop
    segment := '';
    for j in 1..4 loop
      segment := segment || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    result := result || '-' || segment;
  end loop;
  return result;
end;
$$ language plpgsql;

create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, license_key)
  values (new.id, new.email, generate_license_key());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------------------------------------------------------------------
-- CATALOG
-- ---------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

create table integrations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_svg text,
  description text,
  docs_url text,
  popularity int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_integrations_updated_at before update on integrations
  for each row execute function set_updated_at();

create table workflows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  summary text not null,                         -- 150-160 char meta-ready
  description_md text not null,
  status workflow_status not null default 'draft',
  price_cents int not null,
  currency text not null default 'usd',
  stripe_price_id text,
  vip_included boolean not null default true,
  roi_hours_per_week numeric(4, 1) not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  setup_minutes int not null,
  node_count int not null,
  n8n_min_version text not null,
  requirements jsonb not null,                   -- [{label, detail, required}]
  video_url text,
  video_thumbnail_url text,
  video_duration_seconds int,
  sandbox_supported boolean not null default false,
  current_version text not null,
  published_at timestamptz,
  popularity_score int not null default 0,
  rating_avg numeric(2, 1),
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('english', title || ' ' || coalesce(subtitle, '') || ' ' || summary)
  ) stored
);
create index workflows_search_idx on workflows using gin (search);
create index workflows_status_idx on workflows (status) where status = 'published';
create trigger trg_workflows_updated_at before update on workflows
  for each row execute function set_updated_at();

create table workflow_categories (
  workflow_id uuid references workflows on delete cascade,
  category_id uuid references categories on delete cascade,
  primary key (workflow_id, category_id)
);

create table workflow_integrations (
  workflow_id uuid references workflows on delete cascade,
  integration_id uuid references integrations on delete cascade,
  role text not null check (role in ('trigger', 'action', 'both')),
  primary key (workflow_id, integration_id)
);

create table workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows on delete cascade,
  version text not null,
  storage_path text not null,                    -- private bucket 'workflow-json'
  sha256 text not null,
  changelog_md text,
  n8n_min_version text,
  created_at timestamptz not null default now(),
  unique (workflow_id, version)
);

create table workflow_nodes_doc (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows on delete cascade,
  node_name text not null,
  node_type text not null,
  purpose text,
  credentials_needed text,
  config_notes_md text,
  sort int not null default 0
);

create table workflow_howto_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows on delete cascade,
  step int not null,
  name text not null,
  text text not null,
  video_start_seconds int
);

-- ---------------------------------------------------------------------
-- COMMERCE
-- ---------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete set null,
  workflow_id uuid references workflows on delete set null,
  stripe_session_id text unique,
  stripe_payment_intent text,
  amount_cents int not null,
  currency text not null,
  status text not null check (status in ('paid', 'refunded', 'disputed')),
  license_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  stripe_subscription_id text unique,
  price_id text,
  interval text check (interval in ('month', 'year')),
  status sub_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create table entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  workflow_id uuid references workflows on delete cascade, -- null = all-access
  source text not null check (source in ('purchase', 'vip', 'dfy', 'admin')),
  source_ref uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, workflow_id, source)
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete set null,
  workflow_id uuid references workflows on delete set null,
  version text,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SOCIAL PROOF (integrity-critical — Section 16)
-- ---------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows on delete cascade,
  user_id uuid references profiles on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  verified_purchase boolean not null default false, -- true only if an entitlement exists
  is_seed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_reviews_updated_at before update on reviews
  for each row execute function set_updated_at();

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  company text,
  quote text not null,
  avatar_url text,
  metric_label text,
  metric_value text,
  verified boolean not null default false,
  is_seed boolean not null default false,
  source_url text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (author_name, company)
);

create table case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  client_name text not null,
  industry text,
  challenge text,
  solution text,
  results jsonb,
  quote text,
  verified boolean not null default false,
  is_seed boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_case_studies_updated_at before update on case_studies
  for each row execute function set_updated_at();

create table faqs (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('home', 'workflow', 'pair', 'services', 'pricing')),
  scope_ref uuid,
  question text not null,
  answer_md text not null,
  answer_plain text not null,
  sort int not null default 0,
  unique (scope, question)
);

-- ---------------------------------------------------------------------
-- n8n / EXECUTION
-- ---------------------------------------------------------------------
create table n8n_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  label text not null,
  base_url text not null,
  api_key_ciphertext text not null,
  api_key_iv text not null,
  api_key_tag text not null,
  last_verified_at timestamptz,
  n8n_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_n8n_instances_updated_at before update on n8n_instances
  for each row execute function set_updated_at();

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  prefix text not null,
  key_hash text not null,                        -- sha256 only, shown once
  scopes text[] not null default '{run}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  workflow_id uuid references workflows on delete set null,
  credits_per_run int not null default 1,
  input_schema jsonb not null,
  output_schema jsonb not null,
  n8n_webhook_path text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_tools_updated_at before update on tools
  for each row execute function set_updated_at();

create table tool_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  tool_id uuid references tools on delete set null,
  status run_status not null,
  input jsonb,
  output jsonb,
  error text,
  credits_charged int not null default 0,
  duration_ms int,
  source text not null check (source in ('dashboard', 'api')),
  created_at timestamptz not null default now()
);

create table sandbox_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references workflows on delete set null,
  user_id uuid references profiles on delete set null,
  anon_fingerprint text,
  ip_hash text,
  input_text text,
  status run_status not null,
  steps jsonb,
  output jsonb,
  duration_ms int,
  created_at timestamptz not null default now()
);

create table usage_daily (
  user_id uuid not null references profiles on delete cascade,
  day date not null,
  executions int not null default 0,
  credits int not null default 0,
  failures int not null default 0,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  type lead_type not null,
  name text not null,
  email text not null,
  company text,
  phone text,
  budget_range text,
  workflows_of_interest text[],
  message text,
  utm jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table booking_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 1,
  booked int not null default 0
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references booking_slots on delete set null,
  lead_id uuid references leads on delete set null,
  timezone text not null,
  meeting_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- pSEO
-- ---------------------------------------------------------------------
create table integration_pairs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                     -- 'facebook-messenger-to-google-sheets'
  source_integration uuid references integrations,
  target_integration uuid references integrations,
  headline text,
  intro_md text,
  use_cases jsonb,
  field_mapping jsonb,
  faq jsonb,
  meta_description text,
  quality_score int not null default 0,
  indexable boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_integration_pairs_updated_at before update on integration_pairs
  for each row execute function set_updated_at();

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Stripe webhook idempotency (Section 8.2)
create table stripe_events (
  id text primary key, -- Stripe event.id
  type text not null,
  processed_at timestamptz not null default now()
);

-- =======================================================================
-- ROW LEVEL SECURITY
-- =======================================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table integrations enable row level security;
alter table workflows enable row level security;
alter table workflow_categories enable row level security;
alter table workflow_integrations enable row level security;
alter table workflow_versions enable row level security;
alter table workflow_nodes_doc enable row level security;
alter table workflow_howto_steps enable row level security;
alter table orders enable row level security;
alter table subscriptions enable row level security;
alter table entitlements enable row level security;
alter table downloads enable row level security;
alter table reviews enable row level security;
alter table testimonials enable row level security;
alter table case_studies enable row level security;
alter table faqs enable row level security;
alter table n8n_instances enable row level security;
alter table api_keys enable row level security;
alter table tools enable row level security;
alter table tool_runs enable row level security;
alter table sandbox_runs enable row level security;
alter table usage_daily enable row level security;
alter table leads enable row level security;
alter table booking_slots enable row level security;
alter table bookings enable row level security;
alter table integration_pairs enable row level security;
alter table audit_log enable row level security;
alter table stripe_events enable row level security;

-- profiles: user can select/update their own row, but never tier,
-- license_key, or credit columns (those change only via service role).
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and tier = (select tier from profiles p where p.id = auth.uid())
    and license_key = (select license_key from profiles p where p.id = auth.uid())
    and credits_included = (select credits_included from profiles p where p.id = auth.uid())
    and credits_used = (select credits_used from profiles p where p.id = auth.uid())
  );

-- Public read-only catalog tables: published/approved/indexable rows only.
create policy "categories_public_read" on categories for select using (true);
create policy "integrations_public_read" on integrations for select using (true);
create policy "workflows_public_read" on workflows
  for select using (status = 'published');
create policy "workflow_categories_public_read" on workflow_categories
  for select using (
    exists (select 1 from workflows w where w.id = workflow_id and w.status = 'published')
  );
create policy "workflow_integrations_public_read" on workflow_integrations
  for select using (
    exists (select 1 from workflows w where w.id = workflow_id and w.status = 'published')
  );
create policy "workflow_nodes_doc_public_read" on workflow_nodes_doc
  for select using (
    exists (select 1 from workflows w where w.id = workflow_id and w.status = 'published')
  );
create policy "workflow_howto_steps_public_read" on workflow_howto_steps
  for select using (
    exists (select 1 from workflows w where w.id = workflow_id and w.status = 'published')
  );
create policy "faqs_public_read" on faqs for select using (true);
create policy "testimonials_public_read" on testimonials
  for select using (verified = true or is_seed = true);
create policy "case_studies_public_read" on case_studies
  for select using (published = true and (verified = true or is_seed = true));
create policy "integration_pairs_public_read" on integration_pairs
  for select using (indexable = true);

-- workflow_versions: no client access at all — downloads only ever go
-- through the signed-URL server route (Section 8.3).
-- (No select policy is added, so RLS denies all client access by default.)

-- User-scoped tables: select only their own rows; all writes happen via
-- the service role in server code (webhooks, route handlers).
create policy "orders_select_own" on orders for select using (auth.uid() = user_id);
create policy "subscriptions_select_own" on subscriptions for select using (auth.uid() = user_id);
create policy "entitlements_select_own" on entitlements for select using (auth.uid() = user_id);
create policy "downloads_select_own" on downloads for select using (auth.uid() = user_id);
create policy "tool_runs_select_own" on tool_runs for select using (auth.uid() = user_id);
create policy "usage_daily_select_own" on usage_daily for select using (auth.uid() = user_id);
create policy "n8n_instances_select_own" on n8n_instances for select using (auth.uid() = user_id);
create policy "n8n_instances_write_own" on n8n_instances
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "api_keys_select_own" on api_keys for select using (auth.uid() = user_id);

-- reviews: insert only by an entitled user, always forced to 'pending';
-- approved reviews are publicly readable, a user can always see their own.
create policy "reviews_public_read_approved" on reviews
  for select using (status = 'approved' or user_id = auth.uid());
create policy "reviews_insert_entitled" on reviews
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
    and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid()
        and (e.workflow_id = reviews.workflow_id or e.workflow_id is null)
    )
  );

-- tools: publicly readable when active.
create policy "tools_public_read" on tools for select using (active = true);

-- leads / bookings / sandbox_runs: insert only via the server (service
-- role); no client-side select, insert, update, or delete policy is
-- added, so RLS denies all direct client access by default.

-- audit_log / stripe_events: service-role only, no client policies.

-- ---------------------------------------------------------------------
-- Storage buckets (Section 5): workflow-json (private), workflow-media
-- (public), avatars (public). Created here so bucket existence ships with
-- the migration rather than being a manual dashboard step.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('workflow-json', 'workflow-json', false),
  ('workflow-media', 'workflow-media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "workflow_media_public_read" on storage.objects
  for select using (bucket_id = 'workflow-media');
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and owner = auth.uid());
-- workflow-json has no client policies: it is only ever read via a
-- service-role-generated signed URL (Section 8.3).
