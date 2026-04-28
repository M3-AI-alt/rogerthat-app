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

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.class_groups(id),
  chat_type text check (chat_type in ('CLASS_GROUP_CHAT', 'SUPERVISED_PRIVATE_CHAT')),
  title text,
  created_by uuid references public.profiles(id),
  parent_id uuid references public.profiles(id),
  teacher_id uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  member_role text,
  created_at timestamp with time zone default now(),
  unique(chat_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  content text not null,
  created_at timestamp with time zone default now()
);

create or replace function private.current_user_is_chat_member(target_chat_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chat_members
    where chat_id = target_chat_id
      and profile_id = (select auth.uid())
  );
$$;

alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;

grant select, insert, update, delete on public.chats to authenticated;
grant select, insert, update, delete on public.chat_members to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

drop policy if exists "Approved CEOs can manage all chats" on public.chats;
create policy "Approved CEOs can manage all chats"
on public.chats
for all
to authenticated
using (private.current_user_is_approved_ceo())
with check (private.current_user_is_approved_ceo());

drop policy if exists "Chat members can read their chats" on public.chats;
create policy "Chat members can read their chats"
on public.chats
for select
to authenticated
using (private.current_user_is_chat_member(id));

drop policy if exists "Approved CEOs can manage all chat members" on public.chat_members;
create policy "Approved CEOs can manage all chat members"
on public.chat_members
for all
to authenticated
using (private.current_user_is_approved_ceo())
with check (private.current_user_is_approved_ceo());

drop policy if exists "Chat members can read members in their chats" on public.chat_members;
create policy "Chat members can read members in their chats"
on public.chat_members
for select
to authenticated
using (private.current_user_is_chat_member(chat_id));

drop policy if exists "Approved CEOs can manage all messages" on public.messages;
create policy "Approved CEOs can manage all messages"
on public.messages
for all
to authenticated
using (private.current_user_is_approved_ceo())
with check (private.current_user_is_approved_ceo());

drop policy if exists "Chat members can read messages in their chats" on public.messages;
create policy "Chat members can read messages in their chats"
on public.messages
for select
to authenticated
using (private.current_user_is_chat_member(chat_id));

drop policy if exists "Chat members can insert messages in their chats" on public.messages;
create policy "Chat members can insert messages in their chats"
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and private.current_user_is_chat_member(chat_id)
);
