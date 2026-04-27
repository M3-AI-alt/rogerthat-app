import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { mockChats } from "@/data/mock-chats";
import { mockClasses } from "@/data/mock-classes";
import { mockReports } from "@/data/mock-reports";
import { mockTeachers } from "@/data/mock-users";
import type { ReactElement } from "react";

export default function DirectorDashboardPage(): ReactElement {
  return (
    <AppShell>
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
        <DashboardCard label="Classes supervised" value={mockClasses.length} />
        <DashboardCard label="Reports to review" value={mockReports.length} />
        <DashboardCard label="Active chats" value={mockChats.length} />
        <DashboardCard label="Teachers monitored" value={mockTeachers.length} />
      </section>
    </AppShell>
  );
}
