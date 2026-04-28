import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { mockChats } from "@/data/mock-chats";
import { mockClasses } from "@/data/mock-classes";
import { mockParents } from "@/data/mock-parents";
import { mockReports } from "@/data/mock-reports";
import { mockDirectors, mockTeachers } from "@/data/mock-users";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { ReactElement } from "react";

export default function CeoDashboardPage(): ReactElement {
  const adminDirectors = mockDirectors.filter((director) => director.hasAdminAccess);

  return (
    <AppShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Owner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          CEO dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Full control overview for RogerThat.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white"
          href={ROUTES.ceoUsers}
        >
          Manage users
        </Link>
      </section>

      <section className="mt-8 grid gap-4">
        <DashboardCard label="Total Directors" value={mockDirectors.length} />
        <DashboardCard
          label="Directors with Admin Access"
          value={adminDirectors.length}
        />
        <DashboardCard label="Teachers" value={mockTeachers.length} />
        <DashboardCard label="Parents" value={mockParents.length} />
        <DashboardCard label="Classes" value={mockClasses.length} />
        <DashboardCard label="Reports Today" value={mockReports.length} />
        <DashboardCard label="Supervised Chats" value={mockChats.length} />
      </section>
    </AppShell>
  );
}
