import { ROUTES, type AppRoute } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";

export type ProfileRole = "CEO" | "DIRECTOR" | "TEACHER" | "PARENT";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: ProfileRole | null;
  has_admin_access: boolean;
  approval_status: ApprovalStatus | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, has_admin_access, approval_status, created_at, updated_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function getDashboardRoute(profile: UserProfile): AppRoute | null {
  if (profile.approval_status !== "APPROVED") {
    return null;
  }

  if (!profile.role) {
    return null;
  }

  const routesByRole: Record<ProfileRole, AppRoute> = {
    CEO: ROUTES.ceoDashboard,
    DIRECTOR: ROUTES.directorDashboard,
    TEACHER: ROUTES.teacherDashboard,
    PARENT: ROUTES.parentDashboard,
  };

  return routesByRole[profile.role];
}
