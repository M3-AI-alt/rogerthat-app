create table if not exists public.teacher_class_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.class_groups(id) on delete cascade,
  status text check (status in ('ACTIVE', 'REMOVED')) default 'ACTIVE',
  created_at timestamp with time zone default now(),
  unique(teacher_id, class_id)
);

alter table public.teacher_class_assignments enable row level security;

grant select, insert, update, delete on public.teacher_class_assignments to authenticated;

drop policy if exists "Approved CEOs can manage teacher class assignments" on public.teacher_class_assignments;
create policy "Approved CEOs can manage teacher class assignments"
on public.teacher_class_assignments
for all
to authenticated
using (private.current_user_is_approved_ceo())
with check (private.current_user_is_approved_ceo());

drop policy if exists "Teachers can read their own class assignments" on public.teacher_class_assignments;
create policy "Teachers can read their own class assignments"
on public.teacher_class_assignments
for select
to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Assigned teachers can read assigned class groups" on public.class_groups;
create policy "Assigned teachers can read assigned class groups"
on public.class_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.teacher_class_assignments tca
    where tca.class_id = class_groups.id
      and tca.teacher_id = (select auth.uid())
      and tca.status = 'ACTIVE'
  )
);

with ranked_class_chats as (
  select
    id,
    row_number() over (
      partition by class_id
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.chats
  where chat_type = 'CLASS_GROUP_CHAT'
    and class_id is not null
)
delete from public.chats
where id in (
  select id
  from ranked_class_chats
  where duplicate_rank > 1
);

create unique index if not exists unique_class_group_chat_per_class
on public.chats(class_id)
where chat_type = 'CLASS_GROUP_CHAT'
  and class_id is not null;
