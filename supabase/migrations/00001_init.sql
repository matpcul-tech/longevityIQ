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
