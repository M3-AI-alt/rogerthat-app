"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyChats, type Chat } from "@/lib/chats";
import {
  getParentClassAssignments,
  type ParentClassAssignment,
} from "@/lib/classes";
import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

export default function ParentDashboardPage(): ReactElement {
  const [assignments, setAssignments] = useState<ParentClassAssignment[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadAssignments() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [assignmentData, chatData] = await Promise.all([
        getParentClassAssignments(),
        getMyChats(),
      ]);
      setAssignments(assignmentData);
      setChats(chatData);
    } catch {
      setErrorMessage("Could not load your assigned classes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadAssignments();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Parent
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Parent dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Your class rooms, private chats, and latest reports.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white"
          href="/chats"
        >
          My Rooms & Chats
        </Link>
        <DashboardCard label="My Class Rooms" value={assignments.length}>
          {isLoading ? (
            <p>Loading assigned classes...</p>
          ) : errorMessage ? (
            <p className="text-red-700">{errorMessage}</p>
          ) : assignments.length === 0 ? (
            <EmptyState
              description="Your account is active. Waiting for school to add you to a class room."
              title="No class rooms yet"
            />
          ) : (
            <div className="grid gap-3">
              {assignments.map((assignment) => {
                const classChat = chats.find(
                  (chat) =>
                    chat.chat_type === "CLASS_GROUP_CHAT" &&
                    chat.class_id === assignment.class_id
                );

                return (
                  <article
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    key={assignment.id}
                  >
                    <p className="font-semibold text-slate-950">
                      {assignment.class_groups?.name ?? "Assigned class"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {assignment.class_groups?.code ?? "No class code"}
                    </p>
                    {assignment.child_name ? (
                      <p className="mt-1 text-sm text-slate-600">
                        Child: {assignment.child_name}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assignment.class_id ? (
                        <Link
                          className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
                          href={`/classes/${assignment.class_id}`}
                        >
                          Open reports
                        </Link>
                      ) : null}
                      {classChat ? (
                        <Link
                          className="inline-flex min-h-10 items-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800"
                          href={`/chats/${classChat.id}`}
                        >
                          Open room
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
        <DashboardCard label="Latest Reports">
          <EmptyState
            actionHref={
              assignments.find((assignment) => assignment.class_id)?.class_id
                ? `/classes/${
                    assignments.find((assignment) => assignment.class_id)
                      ?.class_id
                  }`
                : undefined
            }
            actionLabel={
              assignments.some((assignment) => assignment.class_id)
                ? "Open reports"
                : undefined
            }
            description="Reports will appear after your class room is active and a teacher sends a report."
            title="No reports yet"
          />
        </DashboardCard>
        <DashboardCard label="My Private Chats">
          {chats.filter((chat) => chat.chat_type === "SUPERVISED_PRIVATE_CHAT")
            .length === 0 ? (
            <EmptyState
              actionHref={assignments.length > 0 ? "/chats" : undefined}
              actionLabel={assignments.length > 0 ? "Open chats" : undefined}
              description={
                assignments.length > 0
                  ? "Private chats with teachers will appear here."
                  : "Your account is active. Waiting for school to add you to a class room."
              }
              title="No private chats yet"
            />
          ) : (
            <div className="grid gap-2">
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
    </AppShell>
  );
}
