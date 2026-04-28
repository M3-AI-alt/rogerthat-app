import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { mockChats } from "@/data/mock-chats";
import { mockClasses } from "@/data/mock-classes";
import { mockReports } from "@/data/mock-reports";
import Link from "next/link";
import type { ReactElement } from "react";

const teacherId = "user-teacher-1";

export default function TeacherDashboardPage(): ReactElement {
  const myClasses = mockClasses.filter((classItem) => classItem.teacherId === teacherId);
  const myReports = mockReports.filter((report) => report.teacherId === teacherId);
  const myChats = mockChats.filter((chat) => chat.teacherId === teacherId);

  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Teacher
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Teacher dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          A simple mobile workspace for daily parent reporting.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <DashboardCard label="My classes" value={myClasses.length}>
          {myClasses.map((classItem) => (
            <p key={classItem.id}>{classItem.name}</p>
          ))}
        </DashboardCard>

        <div className="grid gap-3">
          <Link
            className="inline-flex min-h-14 items-center justify-center rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white"
            href="/chats"
          >
            My Chats
          </Link>
          <button className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white">
            Create class report
          </button>
          <button className="min-h-14 rounded-lg border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-950">
            Create individual report
          </button>
        </div>

        <DashboardCard label="My reports" value={myReports.length} />
        <DashboardCard label="My chats" value={myChats.length} />
      </section>
    </AppShell>
  );
}
