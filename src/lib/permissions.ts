import type { User } from "./types";

export type AccessLevel =
  | "FULL_ACCESS"
  | "ADMIN_ACCESS"
  | "SUPERVISION_ACCESS"
  | "ASSIGNED_ACCESS"
  | "OWN_ACCESS";

export function getAccessLevel(user: User): AccessLevel {
  if (user.role === "CEO") {
    return "FULL_ACCESS";
  }

  if (user.role === "DIRECTOR" && user.hasAdminAccess) {
    return "ADMIN_ACCESS";
  }

  if (user.role === "DIRECTOR") {
    return "SUPERVISION_ACCESS";
  }

  if (user.role === "TEACHER") {
    return "ASSIGNED_ACCESS";
  }

  return "OWN_ACCESS";
}

export function canManageAdminAccess(user: User): boolean {
  return user.role === "CEO";
}

export function canHaveAdminAccess(user: User): boolean {
  return user.role === "CEO" || user.role === "DIRECTOR";
}

export function hasAdminLevelAccess(user: User): boolean {
  return user.role === "CEO" || (user.role === "DIRECTOR" && user.hasAdminAccess);
}

export function hasSupervisionAccess(user: User): boolean {
  return user.role === "CEO" || user.role === "DIRECTOR";
}
