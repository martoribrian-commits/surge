-- Multi-clinician organizations: aggregate portal data across org members.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null default 'standard',
  created_at timestamptz not null default now()
);

alter table public.providers
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

create index if not exists providers_org_id_idx on public.providers (org_id);

-- Backfill: one organization per existing provider (solo practice default).
do $$
declare
  r record;
  new_org_id uuid;
begin
  for r in select id, org_name, tier from public.providers where org_id is null loop
    insert into public.organizations (name, tier)
    values (r.org_name, r.tier)
    returning id into new_org_id;

    update public.providers set org_id = new_org_id where id = r.id;
  end loop;
end $$;

revoke all on public.organizations from anon, authenticated;
