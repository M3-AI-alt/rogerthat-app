export type UserRole = "CEO" | "DIRECTOR" | "TEACHER" | "PARENT";

export type AuthProvider = "EMAIL" | "GOOGLE" | "PHONE";

export type ReportType = "CLASS" | "INDIVIDUAL";

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
