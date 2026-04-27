import type { DailyReport } from "@/lib/types";

export const mockReports: DailyReport[] = [
  {
    id: "report-1",
    classId: "class-1",
    teacherId: "user-teacher-1",
    type: "CLASS",
    content: "Class practiced phonics sounds and short reading routines.",
    createdAt: "2026-04-28T08:30:00.000Z",
  },
  {
    id: "report-2",
    classId: "class-2",
    teacherId: "user-teacher-2",
    parentId: "parent-1",
    type: "INDIVIDUAL",
    content: "Strong participation today. Reading confidence is improving.",
    createdAt: "2026-04-28T09:15:00.000Z",
  },
  {
    id: "report-3",
    classId: "class-3",
    teacherId: "user-teacher-1",
    parentId: "parent-2",
    type: "INDIVIDUAL",
    content: "Good speaking effort. Needs more practice with full sentences.",
    createdAt: "2026-04-28T10:00:00.000Z",
  },
];
