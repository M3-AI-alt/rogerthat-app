export const ROUTES = {
  ceoDashboard: "/ceo/dashboard",
  ceoClasses: "/ceo/classes",
  ceoChats: "/ceo/chats",
  ceoAssignParents: "/ceo/assign-parents",
  ceoUsers: "/ceo/users",
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
  roles: "/roles",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
