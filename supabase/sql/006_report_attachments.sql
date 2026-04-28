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

create or replace function private.current_user_can_read_report(target_report_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_reports report
    join public.profiles profile on profile.id = (select auth.uid())
    where report.id = target_report_id
      and (
        (
          profile.role in ('CEO', 'DIRECTOR')
          and profile.approval_status = 'APPROVED'
        )
        or report.teacher_id = (select auth.uid())
        or exists (
          select 1
          from public.parent_class_assignments assignment
          where assignment.class_id = report.class_id
            and assignment.parent_id = (select auth.uid())
            and assignment.status = 'ACTIVE'
        )
      )
  );
$$;

create or replace function private.current_teacher_can_upload_to_report(target_report_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_reports report
    join public.profiles profile on profile.id = (select auth.uid())
    where report.id = target_report_id
      and report.teacher_id = (select auth.uid())
      and profile.role = 'TEACHER'
      and profile.approval_status = 'APPROVED'
  );
$$;

create table if not exists public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.class_reports(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_url text not null,
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

alter table public.report_attachments enable row level security;

grant select, insert on public.report_attachments to authenticated;

insert into storage.buckets (id, name, public)
values ('report-attachments', 'report-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Users can read allowed report attachments" on public.report_attachments;
create policy "Users can read allowed report attachments"
on public.report_attachments
for select
to authenticated
using (private.current_user_can_read_report(report_id));

drop policy if exists "Teachers can add attachments to their reports" on public.report_attachments;
create policy "Teachers can add attachments to their reports"
on public.report_attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and private.current_teacher_can_upload_to_report(report_id)
);

drop policy if exists "Users can download allowed report files" on storage.objects;
create policy "Users can download allowed report files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'report-attachments'
  and private.current_user_can_read_report((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Teachers can upload report files" on storage.objects;
create policy "Teachers can upload report files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-attachments'
  and owner = (select auth.uid())
  and private.current_teacher_can_upload_to_report((split_part(name, '/', 1))::uuid)
);
