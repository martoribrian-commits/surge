-- Track which sequence variant completed — enables Crane context without client enrichment.

alter table public.surge_telemetry
  add column if not exists variant_id text;

create index if not exists surge_telemetry_variant_id_idx
  on public.surge_telemetry (variant_id)
  where variant_id is not null;
