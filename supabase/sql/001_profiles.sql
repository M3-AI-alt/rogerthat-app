create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text check (role in ('CEO', 'DIRECTOR', 'TEACHER', 'PARENT')),
  has_admin_access boolean default false,
  -- This status is for class access / assignment planning, not app login access.
  approval_status text check (
    approval_status in ('PENDING', 'APPROVED', 'REJECTED')
  ) default 'PENDING',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create schema if not exists private;

create or replace function private.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    approval_status,
    has_admin_access
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'PARENT',
    'PENDING',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function private.handle_new_user_profile();

alter table public.profiles enable row level security;

revoke update on public.profiles from authenticated;
grant select, insert on public.profiles to authenticated;
grant update (full_name, phone, updated_at) on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own pending parent profile" on public.profiles;
drop policy if exists "Users can insert their own parent profile pending class assignment" on public.profiles;
create policy "Users can insert their own parent profile pending class assignment"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and role = 'PARENT'
  and approval_status = 'PENDING'
  and has_admin_access = false
);

drop policy if exists "Users can update their own limited profile fields" on public.profiles;
create policy "Users can update their own limited profile fields"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
