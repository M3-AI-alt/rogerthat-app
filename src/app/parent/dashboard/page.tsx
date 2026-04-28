"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import {
  getParentClassAssignments,
  type ParentClassAssignment,
} from "@/lib/classes";
import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

export default function ParentDashboardPage(): ReactElement {
  const [assignments, setAssignments] = useState<ParentClassAssignment[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadAssignments() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      setAssignments(await getParentClassAssignments());
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
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Parent
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Parent dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Mobile-first view for your assigned classes.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <DashboardCard label="Assigned classes" value={assignments.length}>
          {isLoading ? (
            <p>Loading assigned classes...</p>
          ) : errorMessage ? (
            <p className="text-red-700">{errorMessage}</p>
          ) : assignments.length === 0 ? (
            <p>Your account is active. Waiting for CEO to assign your class.</p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id}>
                {assignment.class_id ? (
                  <Link
                    className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                    href={`/classes/${assignment.class_id}`}
                  >
                    {assignment.class_groups?.name ?? "Assigned class"}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-950">
                    {assignment.class_groups?.name ?? "Assigned class"}
                  </p>
                )}
                <p>{assignment.class_groups?.code ?? "No class code"}</p>
                {assignment.child_name ? (
                  <p>Child: {assignment.child_name}</p>
                ) : null}
              </div>
            ))
          )}
        </DashboardCard>
        <DashboardCard label="Reports">
          Reports will appear here after the reports system is added.
        </DashboardCard>
        <DashboardCard label="Supervised chats">
          Chats will appear here after the chat system is added. CEO will be
          present in every future class group and supervised private chat.
        </DashboardCard>
      </section>
    </AppShell>
  );
}
