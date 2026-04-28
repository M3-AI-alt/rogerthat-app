create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_url text not null,
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

alter table public.message_attachments enable row level security;

grant select, insert on public.message_attachments to authenticated;

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

create or replace function private.current_user_can_read_message_attachment(target_message_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.messages message
    where message.id = target_message_id
      and (
        private.current_user_is_approved_ceo()
        or private.current_user_is_chat_member(message.chat_id)
      )
  );
$$;

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
      and private.current_user_is_chat_member(message.chat_id)
  );
$$;

drop policy if exists "Chat members can read message attachments" on public.message_attachments;
create policy "Chat members can read message attachments"
on public.message_attachments
for select
to authenticated
using (private.current_user_can_read_message_attachment(message_id));

drop policy if exists "Chat members can add attachments to their messages" on public.message_attachments;
create policy "Chat members can add attachments to their messages"
on public.message_attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and private.current_user_can_upload_to_message(message_id)
);

drop policy if exists "Chat members can download message files" on storage.objects;
create policy "Chat members can download message files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'message-attachments'
  and private.current_user_can_read_message_attachment((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Chat members can upload message files" on storage.objects;
create policy "Chat members can upload message files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'message-attachments'
  and owner = (select auth.uid())
  and private.current_user_can_upload_to_message((split_part(name, '/', 1))::uuid)
);
