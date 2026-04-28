create schema if not exists private;

create or replace function private.current_user_role()
returns text
language sql
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.current_user_is_approved_staff()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('CEO', 'DIRECTOR', 'TEACHER')
      and approval_status = 'APPROVED'
  );
$$;

create table if not exists public.class_reports (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.class_groups(id),
  teacher_id uuid references public.profiles(id),
  content text,
  created_at timestamp default now()
);

alter table public.class_reports enable row level security;

grant select, insert on public.class_reports to authenticated;

drop policy if exists "Approved staff can read class groups" on public.class_groups;
create policy "Approved staff can read class groups"
on public.class_groups
for select
to authenticated
using (private.current_user_is_approved_staff());

drop policy if exists "Teachers can insert class reports" on public.class_reports;
create policy "Teachers can insert class reports"
on public.class_reports
for insert
to authenticated
with check (
  teacher_id = (select auth.uid())
  and private.current_user_role() = 'TEACHER'
);

drop policy if exists "Parents can read assigned class reports" on public.class_reports;
create policy "Parents can read assigned class reports"
on public.class_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_class_assignments pca
    where pca.class_id = class_reports.class_id
      and pca.parent_id = (select auth.uid())
      and pca.status = 'ACTIVE'
  )
);

drop policy if exists "Approved CEO directors and teachers can read class reports" on public.class_reports;
create policy "Approved CEO directors and teachers can read class reports"
on public.class_reports
for select
to authenticated
using (private.current_user_is_approved_staff());
