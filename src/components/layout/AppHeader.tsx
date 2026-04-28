"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUserProfile, getDashboardRoute } from "@/lib/profile";
import Image from "next/image";
import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

export function AppHeader(): ReactElement {
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardRoute() {
      try {
        const profile = await getCurrentUserProfile();
        const route = profile ? getDashboardRoute(profile) : null;

        if (isMounted) {
          setDashboardHref(route);
        }
      } catch {
        if (isMounted) {
          setDashboardHref(null);
        }
      }
    }

    void loadDashboardRoute();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          className="group inline-flex flex-col items-start gap-1 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          href="/"
        >
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#071b45] px-3 py-2 text-white shadow-md shadow-blue-950/10 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-[1.01]">
            <Image
              alt="Ben Oxford Hub logo"
              className="h-7 w-7 object-contain"
              height={28}
              src="/ben-oxford-logo.png"
              width={28}
            />
            <span className="block text-xl font-bold leading-5 tracking-normal">
              RogerThat
            </span>
          </span>
          <span className="pl-1 text-xs font-semibold tracking-wide text-[#35517f]">
            by Ben Oxford Hub
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:inline-flex"
            href="/"
          >
            Home
          </Link>
          {dashboardHref ? (
            <Link
              className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:inline-flex"
              href={dashboardHref}
            >
              Dashboard
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
