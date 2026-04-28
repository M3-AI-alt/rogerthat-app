import type { ReactElement, ReactNode } from "react";
import { RouteGuard } from "../auth/RouteGuard";
import { AppHeader } from "./AppHeader";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <RouteGuard>{children}</RouteGuard>
      </main>
    </div>
  );
}
