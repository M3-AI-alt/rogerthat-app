import { LogoutButton } from "@/components/auth/LogoutButton";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

export function AppHeader(): ReactElement {
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
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
