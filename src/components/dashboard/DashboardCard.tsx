import type { ReactElement, ReactNode } from "react";

type DashboardCardProps = {
  label: string;
  value?: string | number;
  children?: ReactNode;
};

export function DashboardCard({
  label,
  value,
  children,
}: DashboardCardProps): ReactElement {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {value !== undefined ? (
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      ) : null}
      {children ? (
        <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
      ) : null}
    </article>
  );
}
