-- Moi Finanzas 1.4.1 — acceso por usuario + persistencia vía RPC segura
-- Ejecutar TODO este archivo en Supabase SQL Editor.

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

-- Server-side save. The caller NEVER supplies user_id.
-- auth.uid() is taken from the validated Supabase session.
create or replace function public.save_my_app_state(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.app_states(user_id,payload,updated_at)
  values(v_uid,coalesce(p_payload,'{}'::jsonb),now())
  on conflict(user_id)
  do update set payload=excluded.payload, updated_at=now();
end;
$$;

-- Server-side read bound to the authenticated user.
create or replace function public.get_my_app_state()
returns table(payload jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select a.payload,a.updated_at
  from public.app_states a
  where a.user_id=v_uid
  limit 1;
end;
$$;

revoke all on function public.save_my_app_state(jsonb) from public;
revoke all on function public.get_my_app_state() from public;
grant execute on function public.save_my_app_state(jsonb) to authenticated;
grant execute on function public.get_my_app_state() to authenticated;

-- Seguridad:
-- La publishable key puede estar en el cliente.
-- Nunca exponer service_role/secret keys.
-- Cada RPC deriva el usuario desde auth.uid(), no desde datos enviados por el cliente.
