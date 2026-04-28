import Link from "next/link";
import type { ReactElement } from "react";

type PageNavProps = {
  dashboardHref?: string;
  dashboardLabel?: string;
};

export function PageNav({
  dashboardHref,
  dashboardLabel = "Dashboard",
}: PageNavProps): ReactElement {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      <Link
        className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
        href="/"
      >
        Home
      </Link>
      {dashboardHref ? (
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
          href={dashboardHref}
        >
          {dashboardLabel}
        </Link>
      ) : null}
    </nav>
  );
}
