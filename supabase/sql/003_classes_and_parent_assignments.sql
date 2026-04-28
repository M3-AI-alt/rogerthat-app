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

create table if not exists public.class_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.parent_class_assignments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.class_groups(id) on delete cascade,
  child_name text,
  status text check (status in ('ACTIVE', 'REMOVED')) default 'ACTIVE',
  created_at timestamp with time zone default now(),
  unique(parent_id, class_id, child_name)
);

alter table public.class_groups enable row level security;
alter table public.parent_class_assignments enable row level security;

grant select, insert, update, delete on public.class_groups to authenticated;
grant select, insert, update, delete on public.parent_class_assignments to authenticated;

drop policy if exists "Approved CEOs can manage class groups" on public.class_groups;
create policy "Approved CEOs can manage class groups"
on public.class_groups
for all
to authenticated
using (private.current_user_is_approved_ceo())
with check (private.current_user_is_approved_ceo());

drop policy if exists "Parents can read assigned class groups" on public.class_groups;
create policy "Parents can read assigned class groups"
on public.class_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_class_assignments pca
    where pca.class_id = class_groups.id
      and pca.parent_id = (select auth.uid())
      and pca.status = 'ACTIVE'
  )
);

drop policy if exists "Approved CEOs can manage parent class assignments" on public.parent_class_assignments;
create policy "Approved CEOs can manage parent class assignments"
on public.parent_class_assignments
for all
to authenticated
using (private.current_user_is_approved_ceo())
with check (private.current_user_is_approved_ceo());

drop policy if exists "Parents can read their own parent class assignments" on public.parent_class_assignments;
create policy "Parents can read their own parent class assignments"
on public.parent_class_assignments
for select
to authenticated
using (parent_id = (select auth.uid()));
