-- Longevity spa upgrades: 46-marker clinical panel with validated PhenoAge,
-- and wearables persistence (Terra-compatible).

-- ----- Biomarker panels -----

create table if not exists public.biomarker_panels (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.consumer_profiles(id) on delete cascade,
  panel_name text not null default 'LongevityIQ Forty-Six',
  drawn_at date not null default current_date,
  lab text,
  ordered_by_partner_id uuid references public.clinical_partners(id) on delete set null,
  phenoage numeric(6,2),
  notes text,
  status text not null default 'final' check (status in ('draft','final','superseded')),
  created_at timestamptz not null default now()
);

create index if not exists biomarker_panels_consumer_idx
  on public.biomarker_panels (consumer_id, drawn_at desc);

create table if not exists public.biomarker_results (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.biomarker_panels(id) on delete cascade,
  marker_slug text not null,
  marker_name text not null,
  category text not null,
  value numeric(12,4),
  unit text,
  ref_low numeric(12,4),
  ref_high numeric(12,4),
  optimal_low numeric(12,4),
  optimal_high numeric(12,4),
  status text,
  notes text,
  unique (panel_id, marker_slug)
);

create index if not exists biomarker_results_panel_idx
  on public.biomarker_results (panel_id);

alter table public.consumer_profiles
  add column if not exists phenoage numeric(6,2),
  add column if not exists phenoage_updated_at timestamptz;

-- ----- Wearables -----

create table if not exists public.wearable_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  terra_user_id text,
  status text not null default 'connected' check (status in ('connected','disconnected','error')),
  last_synced_at timestamptz,
  connected_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.wearable_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  source text,
  resting_hr numeric(5,1),
  avg_hr numeric(5,1),
  hrv_rmssd numeric(6,1),
  spo2 numeric(4,1),
  steps integer,
  sleep_hours numeric(4,2),
  recovery_score integer,
  vo2_max numeric(5,1),
  active_calories integer,
  raw jsonb,
  unique (user_id, date)
);

create index if not exists wearable_daily_metrics_user_idx
  on public.wearable_daily_metrics (user_id, date desc);

-- ----- Protocol outcomes (closes the training feedback loop) -----

create table if not exists public.protocol_outcomes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  consumer_id uuid not null references public.consumer_profiles(id) on delete cascade,
  outcome_score integer check (outcome_score between 0 and 10),
  felt_better boolean,
  side_effects text,
  notes text,
  recorded_at timestamptz not null default now()
);

create index if not exists protocol_outcomes_consumer_idx
  on public.protocol_outcomes (consumer_id, recorded_at desc);

-- ----- Training events (Sovereign training bus local audit) -----

create table if not exists public.training_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid unique not null,
  event_type text not null,
  source_app text not null,
  subject_hash text not null,
  digest text not null,
  payload jsonb not null,
  forwarded boolean not null default false,
  forwarded_at timestamptz,
  forward_error text,
  created_at timestamptz not null default now()
);

create index if not exists training_events_subject_idx
  on public.training_events (subject_hash, created_at desc);
create index if not exists training_events_unforwarded_idx
  on public.training_events (forwarded, created_at)
  where forwarded = false;

alter table public.protocol_outcomes enable row level security;
alter table public.training_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'consumer can read own outcomes') then
    create policy "consumer can read own outcomes"
      on public.protocol_outcomes for select
      using (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can write own outcomes') then
    create policy "consumer can write own outcomes"
      on public.protocol_outcomes for all
      using (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      )
      with check (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      );
  end if;
end $$;

-- training_events is service-role only; no public RLS policies.
-- Inserts and reads must come from the server with the service key.

-- ----- Row level security -----

alter table public.biomarker_panels enable row level security;
alter table public.biomarker_results enable row level security;
alter table public.wearable_connections enable row level security;
alter table public.wearable_daily_metrics enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'consumer can read own panels') then
    create policy "consumer can read own panels"
      on public.biomarker_panels for select
      using (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can write own panels') then
    create policy "consumer can write own panels"
      on public.biomarker_panels for all
      using (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      )
      with check (
        consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can read own results') then
    create policy "consumer can read own results"
      on public.biomarker_results for select
      using (
        panel_id in (
          select bp.id from public.biomarker_panels bp
          join public.consumer_profiles cp on cp.id = bp.consumer_id
          where cp.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can write own results') then
    create policy "consumer can write own results"
      on public.biomarker_results for all
      using (
        panel_id in (
          select bp.id from public.biomarker_panels bp
          join public.consumer_profiles cp on cp.id = bp.consumer_id
          where cp.user_id = auth.uid()
        )
      )
      with check (
        panel_id in (
          select bp.id from public.biomarker_panels bp
          join public.consumer_profiles cp on cp.id = bp.consumer_id
          where cp.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'partner can read assigned panels') then
    create policy "partner can read assigned panels"
      on public.biomarker_panels for select
      using (
        ordered_by_partner_id in (select id from public.clinical_partners where partner_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'partner can read assigned results') then
    create policy "partner can read assigned results"
      on public.biomarker_results for select
      using (
        panel_id in (
          select id from public.biomarker_panels
          where ordered_by_partner_id in (select id from public.clinical_partners where partner_id = auth.uid())
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can read own connections') then
    create policy "consumer can read own connections"
      on public.wearable_connections for select
      using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can write own connections') then
    create policy "consumer can write own connections"
      on public.wearable_connections for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can read own metrics') then
    create policy "consumer can read own metrics"
      on public.wearable_daily_metrics for select
      using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'consumer can write own metrics') then
    create policy "consumer can write own metrics"
      on public.wearable_daily_metrics for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
