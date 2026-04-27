import { AppShell } from "@/components/layout/AppShell";
import { RoleCard } from "@/components/ui/RoleCard";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  ROLE_SUMMARIES,
} from "@/lib/constants";
import type { ReactElement } from "react";

const roleCards = [
  {
    role: "CEO",
    title: "CEO / Owner",
    description: ROLE_SUMMARIES.CEO,
  },
  {
    role: "DIRECTOR",
    title: "Director",
    description: ROLE_SUMMARIES.DIRECTOR,
  },
  {
    role: "TEACHER",
    title: "Teacher",
    description: ROLE_SUMMARIES.TEACHER,
  },
  {
    role: "PARENT",
    title: "Parent",
    description: ROLE_SUMMARIES.PARENT,
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
          />
        ))}
      </section>

      <section className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-base font-semibold text-emerald-950">
          Step 2 architecture is ready
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          The project now has clean folders, shared TypeScript types, route
          constants, and permission placeholders for future development.
        </p>
      </section>
    </AppShell>
  );
}
