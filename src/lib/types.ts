export type UserRole = "CEO" | "DIRECTOR" | "TEACHER" | "PARENT";

export type AuthProvider = "EMAIL" | "GOOGLE" | "PHONE";

export type ReportType = "CLASS" | "INDIVIDUAL";

export type ParentClassAssignmentStatus = "ACTIVE" | "REMOVED";

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  hasAdminAccess: boolean;
  authProvider: AuthProvider;
};

export type Parent = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type Class = {
  id: string;
  name: string;
  teacherId?: string;
};

export type ClassGroup = {
  id: string;
  name: string;
  code: string;
  createdByCeoId: string;
};

export type ParentClassAssignment = {
  id: string;
  parentId: string;
  classId: string;
  childName?: string;
  status: ParentClassAssignmentStatus;
};

export type DailyReport = {
  id: string;
  classId: string;
  teacherId: string;
  parentId?: string;
  type: ReportType;
  content: string;
  createdAt: string;
};

export type SupervisedChat = {
  id: string;
  teacherId: string;
  parentId: string;
  directorIds: string[];
  ceoId: string;
  createdAt: string;
};
