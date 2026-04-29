create or replace function private.current_user_can_create_private_chat(
  target_class_id uuid,
  target_teacher_id uuid,
  target_parent_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
    private.current_user_is_approved_ceo()
    or (
      (select auth.uid()) = target_teacher_id
      and exists (
        select 1
        from public.teacher_class_assignments teacher_assignment
        where teacher_assignment.class_id = target_class_id
          and teacher_assignment.teacher_id = target_teacher_id
          and teacher_assignment.status = 'ACTIVE'
      )
      and exists (
        select 1
        from public.parent_class_assignments parent_assignment
        where parent_assignment.class_id = target_class_id
          and parent_assignment.parent_id = target_parent_id
          and parent_assignment.status = 'ACTIVE'
      )
    )
    or (
      (select auth.uid()) = target_parent_id
      and exists (
        select 1
        from public.parent_class_assignments parent_assignment
        where parent_assignment.class_id = target_class_id
          and parent_assignment.parent_id = target_parent_id
          and parent_assignment.status = 'ACTIVE'
      )
      and exists (
        select 1
        from public.teacher_class_assignments teacher_assignment
        where teacher_assignment.class_id = target_class_id
          and teacher_assignment.teacher_id = target_teacher_id
          and teacher_assignment.status = 'ACTIVE'
      )
    );
$$;

create or replace function private.profile_is_approved_leadership(
  target_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = target_profile_id
      and profile.role in ('CEO', 'DIRECTOR')
      and profile.approval_status = 'APPROVED'
  );
$$;

drop policy if exists "Assigned teachers and parents can create private chats" on public.chats;
create policy "Assigned teachers and parents can create private chats"
on public.chats
for insert
to authenticated
with check (
  chat_type = 'SUPERVISED_PRIVATE_CHAT'
  and class_id is not null
  and teacher_id is not null
  and parent_id is not null
  and private.current_user_can_create_private_chat(class_id, teacher_id, parent_id)
);

drop policy if exists "Assigned private chat creators can read private chats" on public.chats;
create policy "Assigned private chat creators can read private chats"
on public.chats
for select
to authenticated
using (
  chat_type = 'SUPERVISED_PRIVATE_CHAT'
  and class_id is not null
  and teacher_id is not null
  and parent_id is not null
  and private.current_user_can_create_private_chat(class_id, teacher_id, parent_id)
);

drop policy if exists "Assigned private chat creators can add members" on public.chat_members;
create policy "Assigned private chat creators can add members"
on public.chat_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.chats chat
    where chat.id = chat_members.chat_id
      and chat.chat_type = 'SUPERVISED_PRIVATE_CHAT'
      and private.current_user_can_create_private_chat(
        chat.class_id,
        chat.teacher_id,
        chat.parent_id
      )
      and (
        chat_members.profile_id = chat.teacher_id
        or chat_members.profile_id = chat.parent_id
        or private.profile_is_approved_leadership(chat_members.profile_id)
      )
  )
);

drop policy if exists "Assigned teachers can read parent assignment profiles" on public.profiles;
create policy "Assigned teachers can read parent assignment profiles"
on public.profiles
for select
to authenticated
using (
  role = 'PARENT'
  and exists (
    select 1
    from public.teacher_class_assignments teacher_assignment
    join public.parent_class_assignments parent_assignment
      on parent_assignment.class_id = teacher_assignment.class_id
    where teacher_assignment.teacher_id = (select auth.uid())
      and teacher_assignment.status = 'ACTIVE'
      and parent_assignment.status = 'ACTIVE'
      and parent_assignment.parent_id = profiles.id
  )
);

drop policy if exists "Assigned parents can read teacher assignment profiles" on public.profiles;
create policy "Assigned parents can read teacher assignment profiles"
on public.profiles
for select
to authenticated
using (
  role = 'TEACHER'
  and exists (
    select 1
    from public.parent_class_assignments parent_assignment
    join public.teacher_class_assignments teacher_assignment
      on teacher_assignment.class_id = parent_assignment.class_id
    where parent_assignment.parent_id = (select auth.uid())
      and parent_assignment.status = 'ACTIVE'
      and teacher_assignment.status = 'ACTIVE'
      and teacher_assignment.teacher_id = profiles.id
  )
);

with ranked_private_chats as (
  select
    id,
    row_number() over (
      partition by class_id, teacher_id, parent_id
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.chats
  where chat_type = 'SUPERVISED_PRIVATE_CHAT'
    and class_id is not null
    and teacher_id is not null
    and parent_id is not null
)
delete from public.chats
where id in (
  select id
  from ranked_private_chats
  where duplicate_rank > 1
);

create unique index if not exists unique_private_chat_per_class_teacher_parent
on public.chats(class_id, teacher_id, parent_id)
where chat_type = 'SUPERVISED_PRIVATE_CHAT'
  and class_id is not null
  and teacher_id is not null
  and parent_id is not null;
