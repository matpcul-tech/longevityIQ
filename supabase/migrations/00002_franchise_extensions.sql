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
