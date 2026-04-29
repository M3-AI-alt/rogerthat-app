-- School-controlled messaging permissions.
-- Rooms default to parent read-only. Private chat sending requires membership
-- and a permitted role relationship.

alter table public.chats
add column if not exists parent_can_reply boolean not null default false;

create or replace function private.current_user_is_approved_director()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'DIRECTOR'
      and approval_status = 'APPROVED'
  );
$$;

create or replace function private.teacher_parent_are_assigned(
  target_teacher_id uuid,
  target_parent_id uuid,
  target_class_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teacher_class_assignments teacher_assignment
    join public.parent_class_assignments parent_assignment
      on parent_assignment.class_id = teacher_assignment.class_id
    where teacher_assignment.teacher_id = target_teacher_id
      and parent_assignment.parent_id = target_parent_id
      and teacher_assignment.status = 'ACTIVE'
      and parent_assignment.status = 'ACTIVE'
      and (
        target_class_id is null
        or teacher_assignment.class_id = target_class_id
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
    select id, chat_type, class_id, parent_id, teacher_id, parent_can_reply
    from public.chats
    where id = target_chat_id
  )
  select exists (
    select 1
    from current_profile profile
    cross join target_chat chat
    where private.current_user_is_chat_member(chat.id)
      and (
        (profile.role = 'CEO' and profile.approval_status = 'APPROVED')
        or (profile.role = 'DIRECTOR' and profile.approval_status = 'APPROVED')
        or (
          chat.chat_type = 'CLASS_GROUP_CHAT'
          and profile.role = 'TEACHER'
          and profile.approval_status = 'APPROVED'
        )
        or (
          chat.chat_type = 'CLASS_GROUP_CHAT'
          and profile.role = 'PARENT'
          and chat.parent_can_reply = true
        )
        or (
          chat.chat_type = 'SUPERVISED_PRIVATE_CHAT'
          and profile.role = 'TEACHER'
          and profile.approval_status = 'APPROVED'
          and chat.teacher_id = profile.id
          and private.teacher_parent_are_assigned(
            profile.id,
            chat.parent_id,
            chat.class_id
          )
        )
        or (
          chat.chat_type = 'SUPERVISED_PRIVATE_CHAT'
          and profile.role = 'PARENT'
          and chat.parent_id = profile.id
          and private.teacher_parent_are_assigned(
            chat.teacher_id,
            profile.id,
            chat.class_id
          )
        )
      )
  );
$$;

drop policy if exists "Approved CEOs can manage all messages" on public.messages;
drop policy if exists "Approved CEOs can read all messages" on public.messages;
create policy "Approved CEOs can read all messages"
on public.messages
for select
to authenticated
using (private.current_user_is_approved_ceo());

drop policy if exists "Chat members can insert messages in their chats" on public.messages;
drop policy if exists "School controlled chat members can insert messages" on public.messages;
create policy "School controlled chat members can insert messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and private.current_user_can_send_message_to_chat(chat_id)
);

create or replace function private.current_user_can_upload_to_message(target_message_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.messages message
    where message.id = target_message_id
      and message.sender_id = (select auth.uid())
      and private.current_user_can_send_message_to_chat(message.chat_id)
  );
$$;

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
    or private.current_user_is_approved_director()
    or (
      (select auth.uid()) = target_teacher_id
      and private.teacher_parent_are_assigned(
        target_teacher_id,
        target_parent_id,
        target_class_id
      )
    )
    or (
      (select auth.uid()) = target_parent_id
      and private.teacher_parent_are_assigned(
        target_teacher_id,
        target_parent_id,
        target_class_id
      )
    );
$$;
