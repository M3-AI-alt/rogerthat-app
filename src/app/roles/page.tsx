import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import type { ReactElement } from "react";

const roleDetails = [
  {
    label: "CEO / Owner",
    description:
      "The single owner account. The CEO creates classes, approves parents, assigns teachers, assigns parents to classes, and supervises every class group and private chat.",
  },
  {
    label: "Director",
    description:
      "Supervises reports and chats but cannot take or export the full parent database.",
  },
  {
    label: "Director with Admin access",
    description:
      "A Director upgraded by the CEO to admin-level access. Only the CEO can grant or remove this access.",
  },
  {
    label: "Teacher",
    description:
      "Reports to parents and can only see parents inside assigned classes.",
  },
  {
    label: "Parent",
    description:
      "Uses the mobile-only experience to read reports and supervised chats for assigned classes only.",
  },
  {
    label: "Class group chat",
    description:
      "Public chat for the whole class parents, teacher, director, and CEO. The CEO must be present.",
  },
  {
    label: "Private teacher-parent chat",
    description:
      "Private supervised chat with one teacher, one parent, director, and CEO. The CEO must be present.",
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
          CEO-controlled planning for classes, parent approvals, assignments,
          and supervised communication.
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
