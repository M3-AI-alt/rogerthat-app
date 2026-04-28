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
      "Use Manage users, Manage Classes, Assign Parents, and Manage Chats.",
    ],
  },
  {
    title: "2. Create a class",
    steps: [
      "Go to Manage Classes.",
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
    title: "4. View reports",
    steps: [
      "Open the class reporting room from the CEO dashboard.",
      "Log in as a teacher to send a report.",
      "Log in as the assigned parent to confirm the report is visible.",
    ],
  },
  {
    title: "5. Open supervised chats",
    steps: [
      "Go to Manage Chats as CEO.",
      "Create a class group chat for a class.",
      "Create a supervised private chat with one teacher, one parent, CEO, and at least one Director.",
      "Open My Chats as each user and confirm they only see chats where they are members.",
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
          assignment, class reports, and supervised chats.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center rounded-lg bg-blue-700 px-5 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href="/ceo/classes"
          >
            Create a class
          </Link>
          <Link
            className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href="/ceo/chats"
          >
            Manage chats
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
