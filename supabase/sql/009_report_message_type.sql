alter table public.messages
add column if not exists message_type text not null default 'CHAT'
check (message_type in ('CHAT', 'REPORT'));

update public.messages
set
  message_type = 'REPORT',
  content = regexp_replace(content, '^\[REPORT\]\n', '')
where content like '[REPORT]%' and message_type = 'CHAT';
