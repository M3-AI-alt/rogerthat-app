# RogerThat Launch Checklist

## Supabase Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use the Supabase project Settings area to copy the project URL and publishable anon key.

## Vercel Environment Variables

Add these in Vercel Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add them for Production, Preview, and Development if each environment should connect to Supabase.

## SQL Files To Run

Run these in Supabase SQL Editor in order:

1. `supabase/sql/001_profiles.sql`
2. `supabase/sql/002_ceo_profile_policies.sql`
3. `supabase/sql/003_classes_and_parent_assignments.sql`
4. `supabase/sql/004_class_reports.sql`
5. `supabase/sql/005_supervised_chats.sql`
6. `supabase/sql/006_report_attachments.sql`
7. `supabase/sql/006_realtime_updates.sql`

## Supabase Storage Checklist

- Confirm the `report-attachments` bucket exists.
- Keep the bucket private.
- Confirm teachers can upload report files after running `006_report_attachments.sql`.
- Confirm parents can open files only from assigned classes.

## Test Login Checklist

- CEO can log in and reach `/ceo/dashboard`.
- Parent can log in and reach `/parent/dashboard`.
- Teacher can log in and reach `/teacher/dashboard`.
- Director can log in and reach `/director/dashboard`.
- Wrong email/password shows a friendly error.
- Logged-out users are redirected to `/login` from protected dashboards.

## CEO Setup Checklist

- Create one class, for example `BOH-A1`.
- Confirm the class appears on the CEO dashboard.
- Assign one parent to the class.
- Create one class group chat.
- Create one supervised private chat with one teacher, one parent, CEO, and at least one Director.

## Parent Signup Checklist

- Parent access request page says `Parent Access Request`.
- Parent can create an email/password account.
- Parent with no assigned class sees: `Your account is active. Waiting for class assignment.`
- Parent with an assigned class can open that class.
- Parent cannot see unassigned classes.

## Security Checklist

- CEO can access CEO pages.
- Parent cannot access CEO pages.
- Teacher cannot access CEO pages.
- Director cannot access CEO-only pages.
- Parent only sees assigned classes.
- Chat members only see chats where they are members.
- CEO sees all chats.
- RLS is enabled on profiles, class groups, parent assignments, class reports, report attachments, chats, chat members, and messages.

## Demo Checklist

- Open `/demo-guide`.
- Follow the CEO setup flow.
- Create class `BOH-A1`.
- Assign one parent to `BOH-A1`.
- Send one class report as teacher.
- Confirm parent can read the report.
- Create one supervised class group chat.
- Create one supervised private chat.
- Confirm the chat header clearly shows CEO and Director supervision.
