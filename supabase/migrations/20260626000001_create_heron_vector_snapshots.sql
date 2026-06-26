-- Optional vector snapshot store for Heron context assembly.
-- Embeddings can be populated by a future pipeline; metadata supports text summaries.

create table if not exists public.heron_vector_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists heron_vector_snapshots_session_id_idx
  on public.heron_vector_snapshots (session_id);

alter table public.heron_vector_snapshots enable row level security;
revoke all on public.heron_vector_snapshots from anon, authenticated;
