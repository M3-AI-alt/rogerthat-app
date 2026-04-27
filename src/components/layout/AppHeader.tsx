import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import type { ReactElement } from "react";

export function AppHeader(): ReactElement {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link className="text-lg font-semibold text-slate-950" href="/">
          {APP_NAME}
        </Link>
        <span className="text-sm font-medium text-slate-500">
          Ben Oxford Hub
        </span>
      </div>
    </header>
  );
}
