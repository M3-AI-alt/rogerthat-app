"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockChats } from "@/data/mock-chats";
import { mockParents } from "@/data/mock-parents";
import { mockReports } from "@/data/mock-reports";
import { mockDirectors, mockTeachers } from "@/data/mock-users";
import { getClassGroups, type ClassGroup } from "@/lib/classes";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

export default function CeoDashboardPage(): ReactElement {
  const adminDirectors = mockDirectors.filter(
    (director) => director.hasAdminAccess
  );
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  async function loadClasses() {
    setIsLoadingClasses(true);

    try {
      setClasses(await getClassGroups());
    } catch {
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadClasses();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav />
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white"
            href={ROUTES.ceoUsers}
          >
            Manage users
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoClasses}
          >
            Manage Classes
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoAssignParents}
          >
            Assign Parents
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoChats}
          >
            Manage Chats
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-5 text-base font-semibold text-blue-800"
            href="/demo-guide"
          >
            Demo Guide
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        {!isLoadingClasses && classes.length === 0 ? (
          <EmptyState
            actionHref={ROUTES.ceoClasses}
            actionLabel="Create your first class"
            description="Classes unlock parent assignments, class reports, and supervised conversations."
            title="Create your first class"
          />
        ) : null}
        <DashboardCard label="Total Directors" value={mockDirectors.length} />
        <DashboardCard
          label="Directors with Admin Access"
          value={adminDirectors.length}
        />
        <DashboardCard label="Teachers" value={mockTeachers.length} />
        <DashboardCard label="Parents" value={mockParents.length} />
        <DashboardCard label="Classes" value={classes.length} />
        <DashboardCard label="Reports Today" value={mockReports.length} />
        <DashboardCard label="Supervised Chats" value={mockChats.length} />
        <DashboardCard label="Open class reporting rooms">
          {isLoadingClasses ? (
            <p>Loading classes...</p>
          ) : classes.length === 0 ? (
            <EmptyState
              actionHref={ROUTES.ceoClasses}
              actionLabel="Manage classes"
              description="Create a class such as BOH-A1 to start the demo flow."
              title="No classes yet"
            />
          ) : (
            classes.map((classGroup) => (
              <p key={classGroup.id}>
                <Link
                  className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                  href={`/classes/${classGroup.id}`}
                >
                  {classGroup.code} - {classGroup.name}
                </Link>
              </p>
            ))
          )}
        </DashboardCard>
      </section>
    </AppShell>
  );
}
