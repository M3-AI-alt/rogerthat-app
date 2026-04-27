import type { AuthProvider, UserRole } from "./types";

export const APP_NAME = "RogerThat";

export const APP_PURPOSE = "Daily parent reporting system for Ben Oxford Hub.";

export const APP_TAGLINE = "Daily Parent Reporting System";

export const APP_DESCRIPTION =
  "Supervised communication between teachers and parents";

export const USER_ROLES: UserRole[] = ["CEO", "DIRECTOR", "TEACHER", "PARENT"];

export const AUTH_PROVIDERS: AuthProvider[] = ["EMAIL", "GOOGLE", "PHONE"];

export const ROLE_SUMMARIES: Record<UserRole, string> = {
  CEO: "One owner account with full access across the app.",
  DIRECTOR: "Supervises reports and chats. The CEO can grant admin access.",
  TEACHER: "Creates class and individual reports for assigned classes.",
  PARENT: "Views their own reports and supervised conversations.",
};
