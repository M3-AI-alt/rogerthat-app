"use client";

import { getCurrentUserProfile, getDashboardRoute } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { usePathname, useRouter } from "next/navigation";
import { type ReactElement, type ReactNode, useEffect, useState } from "react";

type RouteGuardProps = {
  children: ReactNode;
};

type ProtectedRole = "CEO" | "DIRECTOR" | "TEACHER" | "PARENT";

const protectedRoutes: Array<{ prefix: string; role: ProtectedRole }> = [
  { prefix: "/ceo", role: "CEO" },
  { prefix: "/director", role: "DIRECTOR" },
  { prefix: "/teacher", role: "TEACHER" },
  { prefix: "/parent", role: "PARENT" },
];

function getRequiredRole(pathname: string): ProtectedRole | null {
  return (
    protectedRoutes.find((route) => pathname.startsWith(route.prefix))?.role ??
    null
  );
}

export function RouteGuard({ children }: RouteGuardProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      await Promise.resolve();

      if (isMounted) {
        setIsChecking(true);
        setIsAllowed(false);
      }

      const requiredRole = getRequiredRole(pathname);

      if (!requiredRole) {
        if (isMounted) {
          setIsAllowed(true);
          setIsChecking(false);
        }
        return;
      }

      try {
        const profile = await getCurrentUserProfile();

        if (!profile) {
          router.replace(ROUTES.login);
          return;
        }

        const dashboardRoute = getDashboardRoute(profile);
        const hasRoleAccess = profile.role === requiredRole && Boolean(dashboardRoute);

        if (!hasRoleAccess) {
          router.replace(dashboardRoute ?? ROUTES.login);
          return;
        }

        if (isMounted) {
          setIsAllowed(true);
        }
      } catch {
        router.replace(ROUTES.login);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    void checkAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Checking access...
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Redirecting to login...
      </div>
    );
  }

  return <>{children}</>;
}
