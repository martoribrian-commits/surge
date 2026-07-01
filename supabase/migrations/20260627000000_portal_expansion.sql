-- Portal expansion: link client sessions, org roles, clinician invites.

alter table public.sessions
  add column if not exists client_session_id uuid;

create index if not exists sessions_client_session_id_idx
  on public.sessions (client_session_id);

alter table public.providers
  add column if not exists role text not null default 'admin'
  check (role in ('admin', 'member'));

-- Existing solo / founding clinicians remain org admins.
update public.providers set role = 'admin' where role is null or role = 'admin';

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid not null references public.providers(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists org_invites_org_id_idx on public.org_invites (org_id);
create index if not exists org_invites_email_idx on public.org_invites (lower(email));

create unique index if not exists org_invites_pending_org_email_idx
  on public.org_invites (org_id, lower(email))
  where status = 'pending';

revoke all on public.org_invites from anon, authenticated;
