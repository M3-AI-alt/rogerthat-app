-- Phase 11: keep private chat visibility tied to explicit chat membership.
-- CEO access is already handled by "Approved CEOs can manage all chats".
-- Non-CEO users should only read chats through "Chat members can read their chats".

drop policy if exists "Assigned private chat creators can read private chats" on public.chats;

create or replace function private.is_allowed_message_attachment_name(file_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(coalesce(file_name, ''), '^.*\.', '')) in (
    'csv',
    'doc',
    'docx',
    'jpeg',
    'jpg',
    'pdf',
    'png',
    'ppt',
    'pptx',
    'webp',
    'xls',
    'xlsx'
  );
$$;

do $$
begin
  alter table public.message_attachments
    add constraint message_attachments_file_url_matches_message
    check (file_url like (message_id::text || '/%'))
    not valid;
exception
  when duplicate_object then null;
end $$;

drop policy if exists "Chat members can add attachments to their messages" on public.message_attachments;
create policy "Chat members can add attachments to their messages"
on public.message_attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and file_url like (message_id::text || '/%')
  and private.is_allowed_message_attachment_name(file_name)
  and private.current_user_can_upload_to_message(message_id)
);

drop policy if exists "Chat members can upload message files" on storage.objects;
create policy "Chat members can upload message files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'message-attachments'
  and owner = (select auth.uid())
  and private.is_allowed_message_attachment_name(name)
  and private.current_user_can_upload_to_message((split_part(name, '/', 1))::uuid)
);
