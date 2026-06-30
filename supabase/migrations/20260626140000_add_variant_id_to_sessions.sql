-- Link clinical sessions to sequence variant for provider analytics.

alter table public.sessions
  add column if not exists variant_id text;

create index if not exists sessions_variant_id_idx
  on public.sessions (variant_id)
  where variant_id is not null;
