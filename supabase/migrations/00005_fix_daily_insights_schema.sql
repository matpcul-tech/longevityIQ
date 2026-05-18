-- Repair drift on public.daily_insights when an older table shape exists.
-- Safe to re-run: every step is guarded.

create extension if not exists "pgcrypto";

create table if not exists public.daily_insights (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.consumer_profiles(id) on delete cascade,
  insight_text text not null,
  generated_at timestamptz not null default now()
);

alter table public.daily_insights
  add column if not exists consumer_id uuid;

alter table public.daily_insights
  add column if not exists insight_text text;

alter table public.daily_insights
  add column if not exists generated_at timestamptz not null default now();

-- Backfill consumer_id from the legacy user_id column by joining
-- consumer_profiles. Only runs if user_id exists on the table.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_insights'
      and column_name = 'user_id'
  ) then
    update public.daily_insights di
       set consumer_id = cp.id
      from public.consumer_profiles cp
     where di.consumer_id is null
       and di.user_id = cp.user_id;
  end if;
end $$;

-- Drop orphaned rows whose user_id has no matching consumer_profile, so the
-- NOT NULL + FK constraints below can apply cleanly.
delete from public.daily_insights where consumer_id is null;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_insights'
      and column_name = 'consumer_id'
      and is_nullable = 'NO'
  ) then
    alter table public.daily_insights
      alter column consumer_id set not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'daily_insights'
      and constraint_type = 'FOREIGN KEY'
      and constraint_name = 'daily_insights_consumer_id_fkey'
  ) then
    alter table public.daily_insights
      add constraint daily_insights_consumer_id_fkey
      foreign key (consumer_id) references public.consumer_profiles(id) on delete cascade;
  end if;
end $$;

create index if not exists daily_insights_consumer_idx
  on public.daily_insights (consumer_id, generated_at desc);

alter table public.daily_insights enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'daily_insights'
      and policyname = 'consumer can read own insights'
  ) then
    create policy "consumer can read own insights"
      on public.daily_insights for select
      using (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'daily_insights'
      and policyname = 'consumer can insert own insights'
  ) then
    create policy "consumer can insert own insights"
      on public.daily_insights for insert
      with check (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      );
  end if;
end $$;

-- Force PostgREST to reload its schema cache so the new columns are visible.
notify pgrst, 'reload schema';
