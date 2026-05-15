-- Demo seed data for LongevityIQ OS
-- Run after migrations. Replace ids with real auth.users.id values once accounts exist.

insert into public.franchise_locations (id, location_name, address, city, state, org_code, active_services, monthly_fee)
values
  ('00000000-0000-0000-0000-000000000101', 'LongevityIQ Manhattan', '300 Park Ave', 'New York', 'NY', 'LIQ-NYC-01',
   '["cryotherapy","red-light","hbot","contrast-therapy","vo2-baseline"]'::jsonb, 4500),
  ('00000000-0000-0000-0000-000000000102', 'LongevityIQ Ada Flagship', '120 Main St', 'Ada', 'OK', 'LIQ-ADA-01',
   '["cryotherapy","red-light","iv-nad","iv-myers","peptide-consult"]'::jsonb, 2500)
on conflict (id) do nothing;

update public.franchise_locations
  set hours = '{
    "monday":"06:00 to 21:00",
    "tuesday":"06:00 to 21:00",
    "wednesday":"06:00 to 21:00",
    "thursday":"06:00 to 21:00",
    "friday":"06:00 to 21:00",
    "saturday":"08:00 to 18:00",
    "sunday":"08:00 to 16:00"
  }'::jsonb,
  contact_email = 'concierge@longevityiq.com',
  contact_phone = '212-555-0123'
  where org_code = 'LIQ-NYC-01';

update public.franchise_locations
  set hours = '{
    "monday":"07:00 to 19:00",
    "tuesday":"07:00 to 19:00",
    "wednesday":"07:00 to 19:00",
    "thursday":"07:00 to 19:00",
    "friday":"07:00 to 19:00",
    "saturday":"09:00 to 15:00",
    "sunday":"closed"
  }'::jsonb,
  contact_email = 'ada@longevityiq.com',
  contact_phone = '580-555-0142'
  where org_code = 'LIQ-ADA-01';

insert into public.franchise_revenue (location_id, month, service, sessions, gross_revenue, platform_fee, net_revenue)
values
  ('00000000-0000-0000-0000-000000000101', date_trunc('month', current_date), 'cryotherapy', 168, 13440, 2016, 11424),
  ('00000000-0000-0000-0000-000000000101', date_trunc('month', current_date), 'red-light',   142,  9230, 1384,  7846),
  ('00000000-0000-0000-0000-000000000101', date_trunc('month', current_date), 'hbot',         48,  7200, 1080,  6120),
  ('00000000-0000-0000-0000-000000000102', date_trunc('month', current_date), 'iv-nad',       22, 12100, 1815, 10285),
  ('00000000-0000-0000-0000-000000000102', date_trunc('month', current_date), 'peptide-consult', 18, 4500, 675, 3825)
on conflict do nothing;
