"use client";

import { AppShell } from "@/components/layout/AppShell";
import { getClassGroup, type ClassGroup } from "@/lib/classes";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import {
  createClassReport,
  getReportsForClass,
  type ClassReport,
} from "@/lib/reports";
import { useParams } from "next/navigation";
import {
  type FormEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTeacherName(report: ClassReport): string {
  return (
    report.profiles?.full_name ||
    report.profiles?.email ||
    "Teacher"
  );
}

export default function ClassReportsPage(): ReactElement {
  const params = useParams<{ id: string }>();
  const classId = params.id;
  const [classGroup, setClassGroup] = useState<ClassGroup | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const canCreateReport = profile?.role === "TEACHER";

  const loadClassRoom = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [classData, profileData, reportData] = await Promise.all([
        getClassGroup(classId),
        getCurrentUserProfile(),
        getReportsForClass(classId),
      ]);

      setClassGroup(classData);
      setProfile(profileData);
      setReports(reportData);
    } catch {
      setErrorMessage(
        "Could not load this class room. Make sure you have access to this class."
      );
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  async function handleCreateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSending(true);

    try {
      await createClassReport(classId, content);
      setContent("");
      setSuccessMessage("Report sent.");
      setReports(await getReportsForClass(classId));
    } catch {
      setErrorMessage(
        "Could not send report. Only teacher accounts can create class reports."
      );
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadClassRoom();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadClassRoom]);

  return (
    <AppShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Class reporting room
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          {classGroup?.name ?? "Class"}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {classGroup?.code ?? "Loading class code..."}
        </p>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      {canCreateReport ? (
        <form
          className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleCreateReport}
        >
          <p className="text-base font-semibold text-slate-950">
            Send daily report
          </p>
          <textarea
            className="min-h-32 rounded-lg border border-slate-300 p-4 text-base leading-7 text-slate-950"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write today's class report..."
            required
            value={content}
          />
          <button
            className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSending}
            type="submit"
          >
            {isSending ? "Sending..." : "Send report"}
          </button>
        </form>
      ) : null}

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Daily reports</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Reports for this class
        </h2>
        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-600">
              No reports have been sent yet.
            </p>
          ) : (
            reports.map((report) => (
              <article
                className="rounded-lg border border-slate-200 p-4"
                key={report.id}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-950">
                    {getTeacherName(report)}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {formatDate(report.created_at)}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {report.content || "No report content."}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
