export const ROUTES = {
  ceoDashboard: "/ceo/dashboard",
  ceoClasses: "/ceo/classes",
  ceoChats: "/ceo/chats",
  ceoAssignTeachers: "/ceo/assign-teachers",
  ceoAssignParents: "/ceo/assign-parents",
  ceoUsers: "/ceo/users",
  directorDashboard: "/director/dashboard",
  teacherDashboard: "/teacher/dashboard",
  parentDashboard: "/parent/dashboard",
  classes: "/classes",
  parents: "/parents",
  teachers: "/teachers",
  directors: "/directors",
  chats: "/chats",
  settings: "/settings",
  login: "/login",
  signup: "/signup",
  roles: "/roles",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
