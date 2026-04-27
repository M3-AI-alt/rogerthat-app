import type { UserRole } from "@/lib/types";
import type { ReactElement } from "react";

type RoleCardProps = {
  role: UserRole;
  title: string;
  description: string;
};

export function RoleCard({
  role,
  title,
  description,
}: RoleCardProps): ReactElement {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {role}
      </p>
      <h2 className="mt-3 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
