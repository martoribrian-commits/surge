-- Run AFTER creating the Auth user in Supabase Dashboard.
-- Authentication → Users → Add user
-- UID: 6a6436fa-05f5-4567-ae0c-9d60d294691b

insert into public.providers (id, name, org_name, tier, active)
values (
  '6a6436fa-05f5-4567-ae0c-9d60d294691b',
  'Clinical Partner',
  'Martori Studio',
  'standard',
  true
)
on conflict (id) do update set
  org_name = excluded.org_name,
  name = excluded.name,
  active = excluded.active;
