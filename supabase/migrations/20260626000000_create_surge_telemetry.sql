-- Anonymous Surge session telemetry ingested by process-surge-telemetry Edge Function.
-- No PII — session_id is a client-generated UUID only.

create table if not exists public.surge_telemetry (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  duration_in_seconds integer not null check (duration_in_seconds >= 0),
  completed_full_cycle boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists surge_telemetry_created_at_idx
  on public.surge_telemetry (created_at desc);

alter table public.surge_telemetry enable row level security;

-- Inserts are service-role only (Edge Function). No direct anon/authenticated access.
revoke all on public.surge_telemetry from anon, authenticated;
