import { AppShell } from "@/components/layout/AppShell";
import { RoleCard } from "@/components/ui/RoleCard";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  ROLE_SUMMARIES,
} from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import type { ReactElement } from "react";

const roleCards = [
  {
    role: "CEO",
    title: "CEO / Owner",
    description: ROLE_SUMMARIES.CEO,
    href: ROUTES.ceoDashboard,
  },
  {
    role: "DIRECTOR",
    title: "Director",
    description: ROLE_SUMMARIES.DIRECTOR,
    href: ROUTES.directorDashboard,
  },
  {
    role: "TEACHER",
    title: "Teacher",
    description: ROLE_SUMMARIES.TEACHER,
    href: ROUTES.teacherDashboard,
  },
  {
    role: "PARENT",
    title: "Parent",
    description: ROLE_SUMMARIES.PARENT,
    href: ROUTES.parentDashboard,
  },
] as const;

export default function Home(): ReactElement {
  return (
    <AppShell>
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {APP_TAGLINE}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          {APP_DESCRIPTION}
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roleCards.map((roleCard) => (
          <RoleCard
            key={roleCard.role}
            role={roleCard.role}
            title={roleCard.title}
            description={roleCard.description}
            href={roleCard.href}
          />
        ))}
      </section>

      <section className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-base font-semibold text-emerald-950">
          Step 3 mobile dashboards are ready
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Choose a role above to open a mock-data dashboard designed for mobile
          screens first.
        </p>
      </section>
    </AppShell>
  );
}
