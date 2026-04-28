"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyChats, type Chat } from "@/lib/chats";
import { getTeacherClassAssignments } from "@/lib/classes";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import { getReportsByTeacher, type ClassReport } from "@/lib/reports";
import Link from "next/link";
import { type ReactElement, useEffect, useMemo, useState } from "react";

type ClassSummary = {
  id: string;
  name: string;
  code: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getClassLabel(classGroup: ClassSummary): string {
  return `${classGroup.code} - ${classGroup.name}`;
}

function getReportPreview(report: ClassReport): string {
  const content = report.content?.trim();

  if (!content) {
    return "Report sent without text.";
  }

  return content.length > 130 ? `${content.slice(0, 130)}...` : content;
}

function getChatTypeCount(chats: Chat[], chatType: Chat["chat_type"]): number {
  return chats.filter((chat) => chat.chat_type === chatType).length;
}

export default function TeacherDashboardPage(): ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const latestReportClass = useMemo(() => {
    const reportClassId = reports.find((report) => report.class_id)?.class_id;

    if (!reportClassId) {
      return classes[0] ?? null;
    }

    return classes.find((classItem) => classItem.id === reportClassId) ?? null;
  }, [classes, reports]);
  const latestClassRoom = useMemo(() => {
    if (!latestReportClass) {
      return null;
    }

    return (
      chats.find(
        (chat) =>
          chat.chat_type === "CLASS_GROUP_CHAT" &&
          chat.class_id === latestReportClass.id
      ) ?? null
    );
  }, [chats, latestReportClass]);

  async function loadTeacherWorkspace() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const profileData = await getCurrentUserProfile();

      if (!profileData) {
        throw new Error("Missing profile.");
      }

      const [chatData, reportData, assignmentData] = await Promise.all([
        getMyChats(),
        getReportsByTeacher(profileData.id),
        getTeacherClassAssignments(),
      ]);
      const classData = assignmentData
        .map((assignment) => assignment.class_groups)
        .filter((classGroup): classGroup is ClassSummary =>
          Boolean(classGroup)
        );

      setProfile(profileData);
      setChats(chatData);
      setReports(reportData);
      setClasses(classData);
    } catch {
      setErrorMessage("Could not load your teacher workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTeacherWorkspace();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Teacher
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Teacher dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Your class rooms, reports, and private chats.
        </p>
        {profile ? (
          <p className="mt-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
            {profile.full_name || profile.email || "Teacher account"}
          </p>
        ) : null}
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="My Class Rooms" value={classes.length}>
          Classes assigned by the school.
        </DashboardCard>
        <DashboardCard label="Send Report" value={reports.length}>
          Reports sent in your class rooms.
        </DashboardCard>
        <DashboardCard
          label="Private Chats"
          value={getChatTypeCount(chats, "SUPERVISED_PRIVATE_CHAT")}
        >
          One-to-one chats with parents.
        </DashboardCard>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
          href="/chats"
        >
          Rooms & Chats
        </Link>
        {latestClassRoom ? (
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-700 px-5 text-base font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href={`/chats/${latestClassRoom.id}`}
          >
            Send Report
          </Link>
        ) : (
          <span className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-center text-base font-semibold text-slate-500">
            Send Report
          </span>
        )}
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
          href="/teacher/dashboard"
        >
          Refresh Dashboard
        </Link>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <DashboardCard label="My Class Rooms" value={classes.length}>
          {isLoading ? (
            <p>Loading class rooms...</p>
          ) : classes.length === 0 ? (
            <EmptyState
              description="The school will add you to a class room when it is ready."
              title="You are not assigned to any class room yet."
            />
          ) : (
            <div className="grid gap-3">
              {classes.map((classItem) => {
                const classChat = chats.find(
                  (chat) =>
                    chat.chat_type === "CLASS_GROUP_CHAT" &&
                    chat.class_id === classItem.id
                );

                return (
                  <article
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    key={classItem.id}
                  >
                    <p className="text-base font-semibold text-slate-950">
                      {getClassLabel(classItem)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Open the room to send messages and reports.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {classChat ? (
                        <Link
                          className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
                          href={`/chats/${classChat.id}`}
                        >
                          Open Room
                        </Link>
                      ) : (
                        <span className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500">
                          Room not created yet
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </DashboardCard>

        <DashboardCard label="Private Chats">
          {isLoading ? (
            <p>Loading chats...</p>
          ) : chats.filter((chat) => chat.chat_type === "SUPERVISED_PRIVATE_CHAT")
              .length === 0 ? (
            <EmptyState
              actionHref="/chats"
              actionLabel="Open chats"
              description="Private chats with parents will appear here."
              title="No private chats yet"
            />
          ) : (
            <div className="grid gap-3">
              {chats
                .filter((chat) => chat.chat_type === "SUPERVISED_PRIVATE_CHAT")
                .map((chat) => (
                  <Link
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-950"
                    href={`/chats/${chat.id}`}
                    key={chat.id}
                  >
                    {chat.title || "Private Chat"}
                  </Link>
                ))}
            </div>
          )}
        </DashboardCard>
      </section>

      <section className="mt-4">
        <DashboardCard label="Recent reports" value={reports.length}>
          {isLoading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <EmptyState
              description="Reports you send from class rooms will appear here."
              title="No reports yet"
            />
          ) : (
            <div className="grid gap-3">
              {reports.slice(0, 5).map((report) => {
                const classItem = classes.find(
                  (item) => item.id === report.class_id
                );

                return (
                  <article
                    className="rounded-lg border border-slate-200 p-4"
                    key={report.id}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-950">
                        {classItem ? getClassLabel(classItem) : "Class report"}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {getReportPreview(report)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </DashboardCard>
      </section>
    </AppShell>
  );
}
