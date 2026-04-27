import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import type { ReactElement } from "react";

const roleDetails = [
  {
    label: "CEO / Owner",
    description:
      "The single owner account with full control across RogerThat.",
  },
  {
    label: "Director",
    description:
      "Supervises reports and chats. There can be many Directors.",
  },
  {
    label: "Director with Admin access",
    description:
      "A Director upgraded by the CEO to admin-level access. Only the CEO can grant or remove this access.",
  },
  {
    label: "Teacher",
    description:
      "Creates reports for parents and participates in supervised communication.",
  },
  {
    label: "Parent",
    description:
      "Uses the mobile-only experience to read reports and supervised chats.",
  },
] as const;

export default function RolesPage(): ReactElement {
  return (
    <AppShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Access planning
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          RogerThat roles
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Simple explanation of future account roles and permissions.
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
