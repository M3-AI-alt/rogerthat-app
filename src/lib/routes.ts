export const ROUTES = {
  ceoDashboard: "/ceo/dashboard",
  directorDashboard: "/director/dashboard",
  teacherDashboard: "/teacher/dashboard",
  parentDashboard: "/parent/dashboard",
  classes: "/classes",
  parents: "/parents",
  teachers: "/teachers",
  directors: "/directors",
  reports: "/reports",
  chats: "/chats",
  settings: "/settings",
  login: "/login",
  signup: "/signup",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
