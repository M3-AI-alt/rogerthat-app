import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { ReactElement } from "react";

const demoChecklist = [
  {
    href: ROUTES.login,
    title: "CEO login",
    detail: "Sign in as CEO and open the dashboard.",
  },
  {
    href: ROUTES.ceoClasses,
    title: "Create room",
    detail: "Create a class such as BOH-A1, then create/open its room.",
  },
  {
    href: ROUTES.ceoAssignTeachers,
    title: "Add teacher",
    detail: "Assign the teacher to the same class room.",
  },
  {
    href: ROUTES.ceoAssignParents,
    title: "Add parent",
    detail: "Assign the parent to the same class room.",
  },
  {
    href: ROUTES.chats,
    title: "Send message",
    detail: "Open the room and send a normal chat message.",
  },
  {
    href: ROUTES.chats,
    title: "Send report",
    detail: "Turn on Report in the composer and send a report message.",
  },
  {
    href: ROUTES.chats,
    title: "Upload file",
    detail: "Attach an image, PDF, Word, Excel, or PowerPoint file.",
  },
  {
    href: ROUTES.parentDashboard,
    title: "Parent reads it on mobile",
    detail: "Log in as the parent on a phone and confirm the room shows the message, report, and file.",
  },
] as const;

export default function DemoGuidePage(): ReactElement {
  return (
    <AppShell>
      <PageNav dashboardHref={ROUTES.ceoDashboard} />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Final demo
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          RogerThat Demo Checklist
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Use this checklist to test the MVP end to end: CEO setup, room
          membership, chat messages, report messages, file upload, and parent
          mobile reading.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center rounded-lg bg-blue-700 px-5 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href={ROUTES.ceoDashboard}
          >
            Start as CEO
          </Link>
          <Link
            className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href={ROUTES.chats}
          >
            Open Chats
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-3">
        {demoChecklist.map((item, index) => (
          <Link
            className="flex min-h-20 items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
            href={item.href}
            key={item.title}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold text-slate-950">
                {item.title}
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                {item.detail}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
