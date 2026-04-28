create schema if not exists private;

create or replace function private.current_user_is_approved_ceo()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'CEO'
      and approval_status = 'APPROVED'
  );
$$;

create or replace function private.current_user_profile_role()
returns text
language sql
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.current_user_profile_email()
returns text
language sql
security definer
set search_path = ''
as $$
  select email
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.current_user_profile_approval_status()
returns text
language sql
security definer
set search_path = ''
as $$
  select approval_status
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.current_user_profile_has_admin_access()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select has_admin_access
  from public.profiles
  where id = (select auth.uid());
$$;

alter table public.profiles
drop constraint if exists profiles_admin_access_role_check;

alter table public.profiles
add constraint profiles_admin_access_role_check
check (
  has_admin_access = false
  or role in ('CEO', 'DIRECTOR')
);

grant select, insert on public.profiles to authenticated;
grant update (
  full_name,
  email,
  phone,
  role,
  has_admin_access,
  approval_status,
  updated_at
) on public.profiles to authenticated;

drop policy if exists "Users can update their own limited profile fields" on public.profiles;
create policy "Users can update their own limited profile fields"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and role is not distinct from private.current_user_profile_role()
  and email is not distinct from private.current_user_profile_email()
  and approval_status is not distinct from private.current_user_profile_approval_status()
  and has_admin_access is not distinct from private.current_user_profile_has_admin_access()
);

drop policy if exists "Approved CEOs can read all profiles" on public.profiles;
create policy "Approved CEOs can read all profiles"
on public.profiles
for select
to authenticated
using (private.current_user_is_approved_ceo());

drop policy if exists "Approved CEOs can update profiles" on public.profiles;
create policy "Approved CEOs can update profiles"
on public.profiles
for update
to authenticated
using (private.current_user_is_approved_ceo())
with check (
  private.current_user_is_approved_ceo()
  and (
    has_admin_access = false
    or role in ('CEO', 'DIRECTOR')
  )
);
