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
    <article className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {value !== undefined ? (
        <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      ) : null}
      {children ? (
        <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
      ) : null}
    </article>
  );
}
