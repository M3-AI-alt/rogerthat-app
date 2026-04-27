"use client";

import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

export function LogoutButton(): ReactElement | null {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!pathname.includes("/dashboard")) {
    return null;
  }

  async function handleLogout() {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <button
      className="ml-auto min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:text-slate-500"
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
