import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockChats } from "@/data/mock-chats";
import { mockClasses } from "@/data/mock-classes";
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
          Overview for class rooms, private chats, messages, and teachers.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white"
          href="/chats"
        >
          Rooms & Chats
        </Link>
        {mockClasses.length === 0 && mockChats.length === 0 ? (
          <EmptyState
            description="No supervision tasks yet."
            title="No supervision tasks yet"
          />
        ) : null}
        <DashboardCard label="Class Rooms" value={mockClasses.length}>
          {mockClasses.length === 0 ? (
            <EmptyState
              description="Class rooms will appear after CEO setup."
              title="No class rooms yet"
            />
          ) : null}
        </DashboardCard>
        <DashboardCard label="Rooms & Chats" value={mockChats.length}>
          {mockChats.length === 0 ? (
            <EmptyState
              actionHref="/chats"
              actionLabel="Open chats"
              description="Class rooms and private chats will appear here."
              title="No rooms or chats yet"
            />
          ) : null}
        </DashboardCard>
        <DashboardCard label="Teachers monitored" value={mockTeachers.length} />
      </section>
    </AppShell>
  );
}
