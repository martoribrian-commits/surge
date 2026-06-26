-- Clinical tokens for anonymous B2B patient access.

create table if not exists public.clinical_tokens (
  token text primary key,
  active boolean not null default true,
  organization_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists clinical_tokens_active_idx
  on public.clinical_tokens (active);

alter table public.clinical_tokens enable row level security;

-- Anon can read active tokens for client-side validation fallback.
create policy "anon_read_active_tokens"
  on public.clinical_tokens
  for select
  to anon
  using (active = true);

revoke insert, update, delete on public.clinical_tokens from anon, authenticated;
