import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

export function AppHeader(): ReactElement {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
        <Link className="flex items-center gap-3" href="/">
          <Image
            alt="Ben Oxford Hub logo"
            className="h-12 w-12 rounded-full object-contain"
            height={48}
            src="/ben-oxford-logo.png"
            width={48}
          />
          <span>
            <span className="block text-2xl font-bold leading-6 text-[#071b45]">
              RogerThat
            </span>
            <span className="block text-sm font-medium text-[#14285c]">
              by Ben Oxford Hub
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
