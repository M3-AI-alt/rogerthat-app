import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { mockChats } from "@/data/mock-chats";
import { mockReports } from "@/data/mock-reports";
import type { ReactElement } from "react";

const parentId = "parent-1";

export default function ParentDashboardPage(): ReactElement {
  const latestReports = mockReports.filter((report) => report.parentId === parentId);
  const messages = mockChats.filter((chat) => chat.parentId === parentId);

  return (
    <AppShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Parent
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Parent dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Mobile-first view for reports and supervised messages.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <DashboardCard label="Class assignment status">
          Your account is active. Waiting for CEO to assign your class.
        </DashboardCard>
        <DashboardCard label="Latest reports" value={latestReports.length}>
          {latestReports.map((report) => (
            <p key={report.id}>{report.content}</p>
          ))}
        </DashboardCard>
        <DashboardCard label="Class announcements">
          Oxford Phonics A practiced reading routines today.
        </DashboardCard>
        <DashboardCard label="Messages (supervised chats)" value={messages.length} />
        <DashboardCard label="Teacher feedback">
          Reading confidence is improving. Keep practicing short sounds at home.
        </DashboardCard>
      </section>
    </AppShell>
  );
}
