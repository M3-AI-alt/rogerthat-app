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
      <main className="animate-page-enter mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <RouteGuard>{children}</RouteGuard>
      </main>
    </div>
  );
}
