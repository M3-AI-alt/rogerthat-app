import type { SupervisedChat } from "@/lib/types";

export const mockChats: SupervisedChat[] = [
  {
    id: "chat-1",
    teacherId: "user-teacher-1",
    parentId: "parent-1",
    directorIds: ["user-director-1"],
    ceoId: "user-ceo-1",
    createdAt: "2026-04-28T11:00:00.000Z",
  },
  {
    id: "chat-2",
    teacherId: "user-teacher-2",
    parentId: "parent-2",
    directorIds: ["user-director-1", "user-director-2"],
    ceoId: "user-ceo-1",
    createdAt: "2026-04-28T11:20:00.000Z",
  },
];
