-- Phase 13: school-controlled direct private chats.
-- Allows the app to open WhatsApp-style private chats from participant names
-- while keeping role and assignment rules enforced in the database.

create or replace function private.profiles_can_private_message(
  actor_profile_id uuid,
  target_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with actor as (
    select id, role, approval_status
    from public.profiles
    where id = actor_profile_id
  ),
  target as (
    select id, role, approval_status
    from public.profiles
    where id = target_profile_id
  )
  select exists (
    select 1
    from actor
    cross join target
    where actor.id <> target.id
      and actor.approval_status = 'APPROVED'
      and (
        actor.role in ('CEO', 'DIRECTOR')
        or target.role in ('CEO', 'DIRECTOR')
        or (
          actor.role = 'TEACHER'
          and target.role = 'TEACHER'
        )
        or (
          actor.role = 'TEACHER'
          and target.role = 'PARENT'
          and exists (
            select 1
            from public.teacher_class_assignments teacher_assignment
            join public.parent_class_assignments parent_assignment
              on parent_assignment.class_id = teacher_assignment.class_id
            where teacher_assignment.teacher_id = actor.id
              and parent_assignment.parent_id = target.id
              and teacher_assignment.status = 'ACTIVE'
              and parent_assignment.status = 'ACTIVE'
          )
        )
        or (
          actor.role = 'PARENT'
          and target.role = 'TEACHER'
          and exists (
            select 1
            from public.parent_class_assignments parent_assignment
            join public.teacher_class_assignments teacher_assignment
              on teacher_assignment.class_id = parent_assignment.class_id
            where parent_assignment.parent_id = actor.id
              and teacher_assignment.teacher_id = target.id
              and parent_assignment.status = 'ACTIVE'
              and teacher_assignment.status = 'ACTIVE'
          )
        )
      )
  );
$$;

create or replace function private.current_user_can_send_message_to_chat(
  target_chat_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with current_profile as (
    select id, role, approval_status
    from public.profiles
    where id = (select auth.uid())
  ),
  target_chat as (
    select id, chat_type, parent_can_reply
    from public.chats
    where id = target_chat_id
  )
  select exists (
    select 1
    from current_profile profile
    cross join target_chat chat
    where private.current_user_is_chat_member(chat.id)
      and (
        (
          chat.chat_type = 'CLASS_GROUP_CHAT'
          and (
            (profile.role in ('CEO', 'DIRECTOR', 'TEACHER')
              and profile.approval_status = 'APPROVED')
            or (profile.role = 'PARENT' and chat.parent_can_reply = true)
          )
        )
        or (
          chat.chat_type = 'SUPERVISED_PRIVATE_CHAT'
          and profile.approval_status = 'APPROVED'
          and not exists (
            select 1
            from public.chat_members other_member
            where other_member.chat_id = chat.id
              and other_member.profile_id is not null
              and other_member.profile_id <> profile.id
              and not private.profiles_can_private_message(
                profile.id,
                other_member.profile_id
              )
          )
        )
      )
  );
$$;

create or replace function private.current_user_can_create_private_chat_member(
  target_chat_id uuid,
  target_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chats chat
    where chat.id = target_chat_id
      and chat.chat_type = 'SUPERVISED_PRIVATE_CHAT'
      and chat.created_by = (select auth.uid())
      and (
        target_profile_id = (select auth.uid())
        or private.profiles_can_private_message((select auth.uid()), target_profile_id)
        or private.profile_is_approved_leadership(target_profile_id)
      )
  );
$$;

drop policy if exists "Assigned teachers and parents can create private chats" on public.chats;
drop policy if exists "School members can create allowed private chats" on public.chats;
create policy "School members can create allowed private chats"
on public.chats
for insert
to authenticated
with check (
  chat_type = 'SUPERVISED_PRIVATE_CHAT'
  and created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles profile
    where profile.id = (select auth.uid())
      and profile.approval_status = 'APPROVED'
      and profile.role in ('CEO', 'DIRECTOR', 'TEACHER', 'PARENT')
  )
);

drop policy if exists "Assigned private chat creators can add members" on public.chat_members;
drop policy if exists "School members can add allowed private chat members" on public.chat_members;
create policy "School members can add allowed private chat members"
on public.chat_members
for insert
to authenticated
with check (
  private.current_user_can_create_private_chat_member(chat_id, profile_id)
);
