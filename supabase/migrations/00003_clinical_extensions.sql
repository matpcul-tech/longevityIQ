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
