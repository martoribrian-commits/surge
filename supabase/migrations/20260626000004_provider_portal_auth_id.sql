-- Provider portal architecture: providers.id = auth.users.id
-- No public RLS policies. All data access via Netlify Functions + service role.

alter table public.clinical_tokens
  alter column expires_at drop not null;

drop policy if exists "providers_select_own" on public.providers;
drop policy if exists "tokens_select_own" on public.clinical_tokens;
drop policy if exists "tokens_insert_own" on public.clinical_tokens;
drop policy if exists "sessions_select_own" on public.sessions;

revoke all on public.providers from anon, authenticated;
revoke all on public.clinical_tokens from anon, authenticated;
revoke all on public.sessions from anon, authenticated;

alter table public.providers drop column if exists auth_user_id;

alter table public.providers drop constraint if exists providers_id_fkey;
alter table public.providers
  add constraint providers_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;
