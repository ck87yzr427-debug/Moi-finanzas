-- Moi Finanzas 1.1 — backend híbrido mínimo
-- Ejecutar en Supabase SQL Editor una vez creado el proyecto.

create table if not exists public.app_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_states enable row level security;

drop policy if exists "Users can read own finance state" on public.app_states;
create policy "Users can read own finance state"
on public.app_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own finance state" on public.app_states;
create policy "Users can insert own finance state"
on public.app_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own finance state" on public.app_states;
create policy "Users can update own finance state"
on public.app_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own finance state" on public.app_states;
create policy "Users can delete own finance state"
on public.app_states
for delete
to authenticated
using (auth.uid() = user_id);

-- No policy is granted to anon. A visitor who is not authenticated cannot
-- read, create, modify, or delete financial data.

create or replace function public.touch_app_state_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_app_state on public.app_states;
create trigger trg_touch_app_state
before update on public.app_states
for each row execute function public.touch_app_state_updated_at();

-- Recommended Auth configuration in Supabase Dashboard:
-- 1. Require email confirmation for public sign-ups.
-- 2. Minimum password length >= 8 (prefer >= 12 for production).
-- 3. Enable CAPTCHA / bot protection before public launch.
-- 4. Configure allowed redirect URLs only for the official Moi Finanzas domains.
-- 5. Never expose the service_role key in the PWA.
