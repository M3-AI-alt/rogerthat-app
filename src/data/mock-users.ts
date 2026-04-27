import type { User } from "@/lib/types";

export const mockUsers: User[] = [
  {
    id: "user-ceo-1",
    name: "Ben Oxford Hub Owner",
    email: "owner@benoxfordhub.com",
    role: "CEO",
    hasAdminAccess: true,
    authProvider: "EMAIL",
  },
  {
    id: "user-director-1",
    name: "Maya Director",
    email: "maya@benoxfordhub.com",
    role: "DIRECTOR",
    hasAdminAccess: true,
    authProvider: "GOOGLE",
  },
  {
    id: "user-director-2",
    name: "Omar Director",
    email: "omar@benoxfordhub.com",
    role: "DIRECTOR",
    hasAdminAccess: false,
    authProvider: "EMAIL",
  },
  {
    id: "user-teacher-1",
    name: "Aisha Teacher",
    email: "aisha@benoxfordhub.com",
    role: "TEACHER",
    hasAdminAccess: false,
    authProvider: "GOOGLE",
  },
  {
    id: "user-teacher-2",
    name: "Daniel Teacher",
    phone: "+84900000001",
    role: "TEACHER",
    hasAdminAccess: false,
    authProvider: "PHONE",
  },
  {
    id: "user-parent-1",
    name: "Layla Parent",
    phone: "+84900000002",
    role: "PARENT",
    hasAdminAccess: false,
    authProvider: "PHONE",
  },
  {
    id: "user-parent-2",
    name: "Noah Parent",
    email: "noah@example.com",
    role: "PARENT",
    hasAdminAccess: false,
    authProvider: "EMAIL",
  },
];

export const mockCeo = mockUsers.find((user) => user.role === "CEO");

export const mockDirectors = mockUsers.filter(
  (user) => user.role === "DIRECTOR",
);

export const mockTeachers = mockUsers.filter((user) => user.role === "TEACHER");

export const mockParentUsers = mockUsers.filter(
  (user) => user.role === "PARENT",
);
