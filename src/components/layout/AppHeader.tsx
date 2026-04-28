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
          className="group flex items-center gap-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          href="/"
        >
          <Image
            alt="Ben Oxford Hub logo"
            className="h-10 w-10 rounded-full object-contain shadow-sm transition duration-200 group-hover:scale-105"
            height={40}
            src="/ben-oxford-logo.png"
            width={40}
          />
          <span>
            <span className="block text-xl font-bold leading-5 tracking-normal text-[#071b45]">
              RogerThat
            </span>
            <span className="block text-xs font-medium tracking-wide text-[#35517f]">
              by Ben Oxford Hub
            </span>
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
