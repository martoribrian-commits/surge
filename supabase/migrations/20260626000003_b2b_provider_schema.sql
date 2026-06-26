-- Phase 3: B2B provider infrastructure

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  org_name text not null,
  tier text not null default 'standard',
  created_at timestamptz not null default now(),
  active boolean not null default true
);

-- Replace simplified clinical_tokens with full provisioning schema
drop policy if exists "anon_read_active_tokens" on public.clinical_tokens;
drop table if exists public.clinical_tokens cascade;

create table public.clinical_tokens (
  token text primary key,
  provider_id uuid not null references public.providers(id) on delete cascade,
  patient_alias text,
  issued_at timestamptz not null default now(),
  activated_at timestamptz,
  expires_at timestamptz not null,
  uses_remaining integer not null default 1 check (uses_remaining >= 0)
);

create index if not exists clinical_tokens_provider_id_idx
  on public.clinical_tokens (provider_id);

create index if not exists clinical_tokens_expires_at_idx
  on public.clinical_tokens (expires_at);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  token_used text references public.clinical_tokens(token) on delete set null,
  duration integer not null check (duration >= 0),
  completion_state text not null check (completion_state in ('complete', 'interrupted')),
  synced_at timestamptz not null default now()
);

create index if not exists sessions_token_used_idx
  on public.sessions (token_used);

-- Companion vector store (renamed from Heron → Egret)
alter table if exists public.heron_vector_snapshots
  rename to egret_vector_snapshots;

create table if not exists public.egret_vector_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists egret_vector_snapshots_session_id_idx
  on public.egret_vector_snapshots (session_id);

-- RLS
alter table public.providers enable row level security;
alter table public.clinical_tokens enable row level security;
alter table public.sessions enable row level security;
alter table public.egret_vector_snapshots enable row level security;

create policy "providers_select_own"
  on public.providers for select to authenticated
  using (auth_user_id = auth.uid());

create policy "tokens_select_own"
  on public.clinical_tokens for select to authenticated
  using (
    provider_id in (
      select id from public.providers where auth_user_id = auth.uid()
    )
  );

create policy "tokens_insert_own"
  on public.clinical_tokens for insert to authenticated
  with check (
    provider_id in (
      select id from public.providers where auth_user_id = auth.uid()
    )
  );

create policy "sessions_select_own"
  on public.sessions for select to authenticated
  using (
    token_used in (
      select ct.token
      from public.clinical_tokens ct
      join public.providers p on p.id = ct.provider_id
      where p.auth_user_id = auth.uid()
    )
  );

revoke all on public.egret_vector_snapshots from anon, authenticated;
