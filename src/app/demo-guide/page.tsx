import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import Link from "next/link";
import type { ReactElement } from "react";

const guideSections = [
  {
    title: "1. Test as CEO",
    steps: [
      "Log in with the CEO email and password.",
      "Open the CEO dashboard.",
      "Use Rooms, Users, Assign Parents, Assign Teachers, and Private Chats.",
    ],
  },
  {
    title: "2. Create a class room",
    steps: [
      "Go to Rooms.",
      "Create a class with a clear name and code, for example BOH-A1.",
      "Return to the CEO dashboard and confirm the class appears.",
    ],
  },
  {
    title: "3. Assign parent to class",
    steps: [
      "Go to Assign Parents.",
      "Select a parent profile and the class.",
      "Add a child name if useful, then assign the parent.",
    ],
  },
  {
    title: "4. Send a report message",
    steps: [
      "Open the class room.",
      "Log in as a teacher to send a report message.",
      "Log in as the assigned parent to confirm the report is visible.",
    ],
  },
  {
    title: "5. Open rooms and private chats",
    steps: [
      "Go to Private Chats as CEO.",
      "Create/open a class room for a class.",
      "Create a private chat with one teacher and one parent.",
      "Open Rooms & Chats as each user and confirm they only see rooms where they are members.",
    ],
  },
] as const;

export default function DemoGuidePage(): ReactElement {
  return (
    <AppShell>
      <PageNav dashboardHref="/ceo/dashboard" />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Launch demo
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          RogerThat Demo Guide
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Use this checklist to walk through the core demo: CEO setup, parent
          assignment, class rooms, report messages, and private chats.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center rounded-lg bg-blue-700 px-5 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href="/ceo/classes"
          >
            Create a class room
          </Link>
          <Link
            className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href="/ceo/chats"
          >
            Private Chats
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        {guideSections.map((section) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            key={section.title}
          >
            <h2 className="text-xl font-semibold text-slate-950">
              {section.title}
            </h2>
            <ol className="mt-4 grid gap-2">
              {section.steps.map((step) => (
                <li className="text-sm leading-6 text-slate-600" key={step}>
                  {step}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
