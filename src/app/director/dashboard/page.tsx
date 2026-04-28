import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockChats } from "@/data/mock-chats";
import { mockClasses } from "@/data/mock-classes";
import { mockReports } from "@/data/mock-reports";
import { mockTeachers } from "@/data/mock-users";
import Link from "next/link";
import type { ReactElement } from "react";

export default function DirectorDashboardPage(): ReactElement {
  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Director
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Director dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Supervision overview for reports, chats, classes, and teachers.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white"
          href="/chats"
        >
          My Chats
        </Link>
        {mockClasses.length === 0 && mockChats.length === 0 ? (
          <EmptyState
            description="No supervision tasks yet."
            title="No supervision tasks yet"
          />
        ) : null}
        <DashboardCard label="Classes supervised" value={mockClasses.length}>
          {mockClasses.length === 0 ? (
            <EmptyState
              description="Supervised classes will appear after CEO setup."
              title="No classes yet"
            />
          ) : null}
        </DashboardCard>
        <DashboardCard label="Reports to review" value={mockReports.length} />
        <DashboardCard label="Active chats" value={mockChats.length}>
          {mockChats.length === 0 ? (
            <EmptyState
              actionHref="/chats"
              actionLabel="Open chats"
              description="Supervised conversations will appear here."
              title="No conversations yet"
            />
          ) : null}
        </DashboardCard>
        <DashboardCard label="Teachers monitored" value={mockTeachers.length} />
      </section>
    </AppShell>
  );
}
