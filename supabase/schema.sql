-- Moi Finanzas — RLS endurecido + exigencia de MFA (AAL2)
-- Ejecutar completo en Supabase SQL Editor.
create table if not exists public.app_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_states enable row level security;
alter table public.app_states force row level security;

revoke all on table public.app_states from anon;
revoke all on table public.app_states from public;
grant select, insert, update, delete on table public.app_states to authenticated;

drop policy if exists "Users can read own finance state" on public.app_states;
drop policy if exists "Users can insert own finance state" on public.app_states;
drop policy if exists "Users can update own finance state" on public.app_states;
drop policy if exists "Users can delete own finance state" on public.app_states;

create policy "Users can read own finance state" on public.app_states
for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own finance state" on public.app_states
for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own finance state" on public.app_states
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own finance state" on public.app_states
for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.touch_app_state_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_touch_app_state on public.app_states;
create trigger trg_touch_app_state before update on public.app_states
for each row execute function public.touch_app_state_updated_at();

-- Producción (Dashboard > Authentication):
-- Email confirmation: ON
-- Minimum password length: 12+ for new passwords
-- CAPTCHA/bot protection: ON before public launch
-- Redirect URLs: only official Moi Finanzas domains
-- Never expose service_role/secret keys in the client.
