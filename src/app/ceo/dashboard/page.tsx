"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyChats, type Chat } from "@/lib/chats";
import {
  getClassGroups,
  getParentClassAssignments,
  getTeacherClassAssignments,
  type ClassGroup,
  type ParentClassAssignment,
  type TeacherClassAssignment,
} from "@/lib/classes";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

type SetupChecklistItemProps = {
  description: string;
  href: string;
  isDone: boolean;
  title: string;
};

function SetupChecklistItem({
  description,
  href,
  isDone,
  title,
}: SetupChecklistItemProps): ReactElement {
  return (
    <Link
      className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
      href={href}
    >
      <span>
        <span className="block font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm text-slate-600">{description}</span>
      </span>
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
          isDone
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {isDone ? "Done" : "Next"}
      </span>
    </Link>
  );
}

export default function CeoDashboardPage(): ReactElement {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<
    TeacherClassAssignment[]
  >([]);
  const [parentAssignments, setParentAssignments] = useState<
    ParentClassAssignment[]
  >([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [directorCount, setDirectorCount] = useState(0);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  async function loadClasses() {
    setIsLoadingClasses(true);

    try {
      const [
        classData,
        teacherAssignmentData,
        parentAssignmentData,
        chatData,
        profileResult,
        reportResult,
      ] = await Promise.all([
        getClassGroups(),
        getTeacherClassAssignments(),
        getParentClassAssignments(),
        getMyChats(),
        supabase
          .from("profiles")
          .select("role")
          .in("role", ["DIRECTOR", "TEACHER", "PARENT"]),
        supabase.from("class_reports").select("id", { count: "exact" }),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      if (reportResult.error) {
        throw reportResult.error;
      }

      const profiles = profileResult.data ?? [];
      setClasses(classData);
      setTeacherAssignments(teacherAssignmentData);
      setParentAssignments(parentAssignmentData);
      setChats(chatData);
      setReportCount(reportResult.count ?? 0);
      setDirectorCount(
        profiles.filter((profile) => profile.role === "DIRECTOR").length
      );
      setTeacherCount(
        profiles.filter((profile) => profile.role === "TEACHER").length
      );
      setParentCount(
        profiles.filter((profile) => profile.role === "PARENT").length
      );
    } catch {
      setClasses([]);
      setTeacherAssignments([]);
      setParentAssignments([]);
      setChats([]);
      setReportCount(0);
    } finally {
      setIsLoadingClasses(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadClasses();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Owner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          CEO dashboard
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Start with one class, connect a teacher and parent, open the class
          chat, then send the first daily report.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-semibold text-white"
            href={ROUTES.ceoUsers}
          >
            Manage Users
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoClasses}
          >
            Manage Classes
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoAssignTeachers}
          >
            Assign Teachers
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoAssignParents}
          >
            Assign Parents
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-950"
            href={ROUTES.ceoChats}
          >
            Manage Chats
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-5 text-base font-semibold text-blue-800"
            href="/demo-guide"
          >
            Demo Guide
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-500">Setup checklist</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Core demo flow
          </h2>
          <div className="mt-5 grid gap-3">
            <SetupChecklistItem
              description="Create the class reporting room."
              href={ROUTES.ceoClasses}
              isDone={classes.length > 0}
              title="Create a class"
            />
            <SetupChecklistItem
              description="Connect a teacher to the class."
              href={ROUTES.ceoAssignTeachers}
              isDone={teacherAssignments.length > 0}
              title="Assign teacher to class"
            />
            <SetupChecklistItem
              description="Connect a parent to the same class."
              href={ROUTES.ceoAssignParents}
              isDone={parentAssignments.length > 0}
              title="Assign parent to class"
            />
            <SetupChecklistItem
              description="Open one supervised group chat for the class."
              href={ROUTES.ceoChats}
              isDone={chats.some((chat) => chat.chat_type === "CLASS_GROUP_CHAT")}
              title="Create/open class group chat"
            />
            <SetupChecklistItem
              description="Teacher opens the class and sends the first update."
              href={classes[0] ? `/classes/${classes[0].id}` : ROUTES.ceoClasses}
              isDone={reportCount > 0}
              title="Send first report"
            />
          </div>
        </div>

        {!isLoadingClasses && classes.length === 0 ? (
          <EmptyState
            actionHref={ROUTES.ceoClasses}
            actionLabel="Create your first class"
            description="Classes unlock parent assignments, class reports, and supervised conversations."
            title="Create your first class"
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DashboardCard label="Directors" value={directorCount} />
          <DashboardCard label="Teachers" value={teacherCount} />
          <DashboardCard label="Parents" value={parentCount} />
          <DashboardCard label="Classes" value={classes.length} />
          <DashboardCard label="Supervised Chats" value={chats.length} />
        </div>
        <DashboardCard label="Reports" value={reportCount}>
          Daily report count across class reporting rooms.
        </DashboardCard>
        <DashboardCard label="Open class reporting rooms">
          {isLoadingClasses ? (
            <p>Loading classes...</p>
          ) : classes.length === 0 ? (
            <EmptyState
              actionHref={ROUTES.ceoClasses}
              actionLabel="Manage classes"
              description="Create a class such as BOH-A1 to start the demo flow."
              title="No classes yet"
            />
          ) : (
            classes.map((classGroup) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                key={classGroup.id}
              >
                <Link
                  className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                  href={`/classes/${classGroup.id}`}
                >
                  {classGroup.code} - {classGroup.name}
                </Link>
                <Link
                  className="inline-flex min-h-10 items-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800"
                  href={ROUTES.ceoChats}
                >
                  Open class chat
                </Link>
              </div>
            ))
          )}
        </DashboardCard>
      </section>
    </AppShell>
  );
}
