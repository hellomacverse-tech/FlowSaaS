-- pSEO fields the page anatomy (spec 11.3) needs but Section 5 omitted
alter table integration_pairs
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists best_for text,
  add column if not exists steps jsonb not null default '[]',
  add column if not exists limits_md text,
  add column if not exists screenshot_url text,
  add column if not exists video_url text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references profiles(id),
  add column if not exists unique_word_count int not null default 0,
  add column if not exists templated_ratio numeric(4,3) not null default 1,
  add column if not exists redirect_to text;

-- Integrity gate at the database level: nothing becomes indexable on a bad score,
-- an unreviewed page, or a reverse-direction redirect.
alter table integration_pairs drop constraint if exists pairs_indexable_gate;
alter table integration_pairs add constraint pairs_indexable_gate check (
  not indexable or (
    quality_score >= 70
    and reviewed_at is not null
    and published_at is not null
    and redirect_to is null
    and unique_word_count >= 350
    and templated_ratio <= 0.400
  )
);
alter table integration_pairs drop constraint if exists pairs_no_self_pair;
alter table integration_pairs add constraint pairs_no_self_pair check (source_integration <> target_integration);

-- Public read: published pages render even when noindex (reachable via the hub)
drop policy if exists pairs_public_read on integration_pairs;
create policy pairs_public_read on integration_pairs for select using (published_at is not null);

-- Case studies: every number must carry a source (spec 9.1.7)
alter table case_studies
  add column if not exists published_at timestamptz,
  add column if not exists image_url text;

create or replace function results_all_sourced(r jsonb) returns boolean
language sql immutable as $$
  select coalesce(
    jsonb_typeof(r) = 'array' and jsonb_array_length(r) > 0
    and bool_and(length(coalesce(e->>'source','')) > 0 and length(coalesce(e->>'value','')) > 0),
    false)
  from jsonb_array_elements(case when jsonb_typeof(r)='array' then r else '[]'::jsonb end) e
$$;

alter table case_studies drop constraint if exists case_published_requires_proof;
alter table case_studies add constraint case_published_requires_proof check (
  not published or (verified and not is_seed and published_at is not null and results_all_sourced(results))
);

drop policy if exists case_studies_public_read on case_studies;
create policy case_studies_public_read on case_studies for select
  using (published and verified and not is_seed);

create index if not exists idx_pairs_indexable on integration_pairs (indexable, updated_at desc);
create index if not exists idx_pairs_src on integration_pairs (source_integration);
create index if not exists idx_pairs_tgt on integration_pairs (target_integration);
