import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import type { ReactElement } from "react";

const roleDetails = [
  {
    label: "CEO / Owner",
    description:
      "The single owner account. The CEO creates class rooms, approves parents, assigns teachers, assigns parents to classes, and can monitor rooms and private chats.",
  },
  {
    label: "Director",
    description:
      "Can monitor room messages and private chats but cannot take or export the full parent database.",
  },
  {
    label: "Director with Admin access",
    description:
      "A Director upgraded by the CEO to admin-level access. Only the CEO can grant or remove this access.",
  },
  {
    label: "Teacher",
    description:
      "Sends messages and report updates inside assigned class rooms.",
  },
  {
    label: "Parent",
    description:
      "Uses the mobile-first experience to read room messages and report updates for assigned class rooms only.",
  },
  {
    label: "Class Room",
    description:
      "Shared room for a class, its parents, assigned teacher, directors, and CEO.",
  },
  {
    label: "Private Chat",
    description:
      "Private chat with one teacher and one parent, visible to school leadership.",
  },
] as const;

export default function RolesPage(): ReactElement {
  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Access planning
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          RogerThat roles
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          CEO-controlled planning for class rooms, parent approvals,
          assignments, and school communication.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        {roleDetails.map((role) => (
          <DashboardCard key={role.label} label={role.label}>
            {role.description}
          </DashboardCard>
        ))}
      </section>
    </AppShell>
  );
}
