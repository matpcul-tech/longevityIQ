-- LongevityIQ OS combined setup.
-- One-shot script that creates every table the app needs. Idempotent: every
-- create uses `if not exists`, every policy is wrapped in a guard, so it is
-- safe to re-run.
--
-- How to use:
--   1. Open https://supabase.com/dashboard, pick your project
--   2. Click SQL Editor (left sidebar)
--   3. Click New Query
--   4. Paste this entire file
--   5. Click Run
--
-- After it finishes, run this verification query to confirm everything landed:
--   select tablename from pg_tables where schemaname = 'public' order by tablename;
--
-- You should see at least: biomarker_panels, biomarker_results, bookings,
-- clinical_orders, clinical_partners, consumer_profiles, daily_insights,
-- franchise_clients, franchise_locations, franchise_revenue, portal_roles,
-- protocol_outcomes, training_events, wearable_connections,
-- wearable_daily_metrics.

-- LongevityIQ OS base schema
-- All tables use Supabase auth user ids where appropriate.

create extension if not exists "pgcrypto";

-- ---------- Consumer ----------

create table if not exists public.consumer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  chronological_age integer,
  tier text not null default 'free' check (tier in ('free','essential','optimizer','sovereign')),
  bio_age integer,
  assessment_scores jsonb default '{}'::jsonb,
  tribal_verified boolean default false,
  enrollment_number text,
  fqhc_org_code text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.consumer_profiles(id) on delete cascade,
  service text not null,
  scheduled_for timestamptz not null,
  location text,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_insights (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.consumer_profiles(id) on delete cascade,
  insight_text text not null,
  generated_at timestamptz not null default now()
);

create index if not exists daily_insights_consumer_idx
  on public.daily_insights (consumer_id, generated_at desc);

-- ---------- Franchise ----------

create table if not exists public.franchise_locations (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references auth.users(id) on delete set null,
  location_name text not null,
  address text,
  city text,
  state text,
  org_code text unique,
  active_services jsonb default '[]'::jsonb,
  monthly_fee numeric(10,2) default 2500,
  created_at timestamptz not null default now()
);

create table if not exists public.franchise_clients (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.franchise_locations(id) on delete cascade,
  consumer_id uuid references public.consumer_profiles(id) on delete set null,
  joined_date date not null default current_date,
  total_sessions integer not null default 0,
  last_visit date
);

create table if not exists public.franchise_revenue (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.franchise_locations(id) on delete cascade,
  month date not null,
  service text not null,
  sessions integer not null default 0,
  gross_revenue numeric(10,2) not null default 0,
  platform_fee numeric(10,2) not null default 0,
  net_revenue numeric(10,2) not null default 0
);

-- ---------- Clinical ----------

create table if not exists public.clinical_partners (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  license_type text,
  license_number_masked text,
  state text,
  active_protocols jsonb default '[]'::jsonb,
  revenue_share_pct integer not null default 35 check (revenue_share_pct between 0 and 100),
  location_id uuid references public.franchise_locations(id) on delete set null,
  malpractice_expiry date,
  dea_masked text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_orders (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.clinical_partners(id) on delete cascade,
  patient_id_masked text not null,
  protocol text not null,
  status text not null default 'pending' check (status in ('pending','approved','declined','completed')),
  ordered_at timestamptz not null default now(),
  completed_at timestamptz,
  revenue numeric(10,2) not null default 0,
  partner_share numeric(10,2) not null default 0,
  clinical_notes text
);

-- ---------- Auth role table ----------

create table if not exists public.portal_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('consumer','franchise_operator','clinical_partner','admin')),
  created_at timestamptz not null default now()
);

-- ---------- Row-level security ----------

alter table public.consumer_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.daily_insights enable row level security;
alter table public.franchise_locations enable row level security;
alter table public.franchise_clients enable row level security;
alter table public.franchise_revenue enable row level security;
alter table public.clinical_partners enable row level security;
alter table public.clinical_orders enable row level security;
alter table public.portal_roles enable row level security;

create policy "consumer can read own profile"
  on public.consumer_profiles for select
  using (auth.uid() = user_id);

create policy "consumer can update own profile"
  on public.consumer_profiles for update
  using (auth.uid() = user_id);

create policy "consumer can insert own profile"
  on public.consumer_profiles for insert
  with check (auth.uid() = user_id);

create policy "consumer can manage own bookings"
  on public.bookings for all
  using (
    consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
  )
  with check (
    consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
  );

create policy "consumer can read own insights"
  on public.daily_insights for select
  using (
    consumer_id in (select id from public.consumer_profiles where user_id = auth.uid())
  );

create policy "operator can manage own location"
  on public.franchise_locations for all
  using (operator_id = auth.uid())
  with check (operator_id = auth.uid());

create policy "operator can read own clients"
  on public.franchise_clients for select
  using (
    location_id in (select id from public.franchise_locations where operator_id = auth.uid())
  );

create policy "operator can read own revenue"
  on public.franchise_revenue for select
  using (
    location_id in (select id from public.franchise_locations where operator_id = auth.uid())
  );

create policy "partner can read own profile"
  on public.clinical_partners for select
  using (partner_id = auth.uid());

create policy "partner can read own orders"
  on public.clinical_orders for select
  using (
    partner_id in (select id from public.clinical_partners where partner_id = auth.uid())
  );

create policy "portal roles readable by owner"
  on public.portal_roles for select
  using (user_id = auth.uid());
-- Franchise portal extensions: link bookings to locations, add operator metadata,
-- and grant operators read/write access to bookings within their location.

alter table public.bookings
  add column if not exists location_id uuid references public.franchise_locations(id) on delete set null;

create index if not exists bookings_location_idx on public.bookings (location_id);

alter table public.franchise_locations
  add column if not exists hours jsonb default '{}'::jsonb,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists pricing_overrides jsonb default '{}'::jsonb,
  add column if not exists is_demo boolean default false;

-- Operator RLS on bookings
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'operator can read bookings at location') then
    create policy "operator can read bookings at location"
      on public.bookings for select
      using (
        location_id in (select id from public.franchise_locations where operator_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'operator can update bookings at location') then
    create policy "operator can update bookings at location"
      on public.bookings for update
      using (
        location_id in (select id from public.franchise_locations where operator_id = auth.uid())
      )
      with check (
        location_id in (select id from public.franchise_locations where operator_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'operator can insert walk-in bookings') then
    create policy "operator can insert walk-in bookings"
      on public.bookings for insert
      with check (
        location_id in (select id from public.franchise_locations where operator_id = auth.uid())
      );
  end if;
end $$;
-- Clinical partner portal: RLS for self-managed partner records and orders.

alter table public.clinical_partners
  add column if not exists is_demo boolean default false;

create index if not exists clinical_orders_partner_idx
  on public.clinical_orders (partner_id, status, ordered_at desc);

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'partner can insert own profile') then
    create policy "partner can insert own profile"
      on public.clinical_partners for insert
      with check (partner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'partner can update own profile') then
    create policy "partner can update own profile"
      on public.clinical_partners for update
      using (partner_id = auth.uid())
      with check (partner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'partner can insert own orders') then
    create policy "partner can insert own orders"
      on public.clinical_orders for insert
      with check (
        partner_id in (select id from public.clinical_partners where partner_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'partner can update own orders') then
    create policy "partner can update own orders"
      on public.clinical_orders for update
      using (
        partner_id in (select id from public.clinical_partners where partner_id = auth.uid())
      )
      with check (
        partner_id in (select id from public.clinical_partners where partner_id = auth.uid())
      );
  end if;
end $$;
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
