"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getClassGroup, type ClassGroup } from "@/lib/classes";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import {
  getReportAttachments,
  isSupportedReportAttachment,
  reportAttachmentAccept,
  uploadReportAttachment,
  type ReportAttachment,
} from "@/lib/report-attachments";
import {
  createClassReport,
  getReportsForClass,
  type ClassReport,
} from "@/lib/reports";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  type FormEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";

const reportTemplates = [
  {
    label: "Daily Performance Report",
    value:
      "Class:\nDate:\nToday's lesson:\nStudent progress:\nHomework:\nTeacher note:",
  },
  {
    label: "Homework Report",
    value:
      "Class:\nDate:\nHomework assigned:\nDue date:\nInstructions:\nTeacher note:",
  },
  {
    label: "Behavior Report",
    value:
      "Class:\nDate:\nClass behavior:\nParticipation:\nStrengths:\nTeacher note:",
  },
  {
    label: "Speaking Progress Report",
    value:
      "Class:\nDate:\nSpeaking focus:\nPronunciation:\nConfidence:\nPractice at home:\nTeacher note:",
  },
  {
    label: "General Teacher Feedback",
    value:
      "Class:\nDate:\nWhat went well:\nNeeds practice:\nNext step:\nTeacher note:",
  },
] as const;

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

function formatFileSize(fileSize: number | null): string {
  if (!fileSize) {
    return "File";
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.ceil(fileSize / 1024)} KB`;
  }

  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
}

function getFileTypeLabel(attachment: ReportAttachment): string {
  const extension = attachment.file_name.split(".").pop()?.toUpperCase();
  return extension || attachment.file_type || "Attachment";
}

export default function ClassReportsPage(): ReactElement {
  const params = useParams<{ id: string }>();
  const classId = params.id;
  const [classGroup, setClassGroup] = useState<ClassGroup | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [reportAttachments, setReportAttachments] = useState<
    Record<string, ReportAttachment[]>
  >({});
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newReportCount, setNewReportCount] = useState(0);
  const [showNewReportHint, setShowNewReportHint] = useState(false);

  const canCreateReport = profile?.role === "TEACHER";

  const loadReportsWithAttachments = useCallback(async () => {
    const reportData = await getReportsForClass(classId);
    const attachmentEntries = await Promise.all(
      reportData.map(async (report) => [
        report.id,
        await getReportAttachments(report.id),
      ])
    );

    setReports(reportData);
    setReportAttachments(Object.fromEntries(attachmentEntries));
  }, [classId]);

  const loadClassRoom = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [classData, profileData] = await Promise.all([
        getClassGroup(classId),
        getCurrentUserProfile(),
      ]);

      setClassGroup(classData);
      setProfile(profileData);
      await loadReportsWithAttachments();
    } catch {
      setErrorMessage(
        "Could not load this class room. Make sure you have access to this class."
      );
    } finally {
      setIsLoading(false);
    }
  }, [classId, loadReportsWithAttachments]);

  async function handleCreateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSending(true);

    try {
      if (!content.trim() && !selectedFile) {
        setErrorMessage("Add report text or choose a file before sending.");
        return;
      }

      if (selectedFile && !isSupportedReportAttachment(selectedFile)) {
        setErrorMessage(
          "This file type is not supported. Choose PDF, Excel, image, PowerPoint, or Word."
        );
        return;
      }

      const report = await createClassReport(classId, content);

      if (selectedFile) {
        await uploadReportAttachment(selectedFile, report.id);
      }

      setContent("");
      setSelectedFile(null);
      setSuccessMessage(
        selectedFile ? "Report and attachment sent." : "Report sent."
      );
      await loadReportsWithAttachments();
    } catch {
      setErrorMessage(
        "Could not send report. Check your teacher access and try again."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleFileChange(file: File | undefined) {
    setErrorMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isSupportedReportAttachment(file)) {
      setSelectedFile(null);
      setErrorMessage(
        "This file type is not supported. Choose PDF, Excel, image, PowerPoint, or Word."
      );
      return;
    }

    setSelectedFile(file);
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadClassRoom();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadClassRoom]);

  useEffect(() => {
    const channel = supabase
      .channel(`class_reports:${classId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `class_id=eq.${classId}`,
          schema: "public",
          table: "class_reports",
        },
        () => {
          setNewReportCount((currentCount) => currentCount + 1);
          setShowNewReportHint(true);
          void loadReportsWithAttachments().catch(() => {
            setErrorMessage("A new report arrived, but it could not be loaded.");
          });

          window.setTimeout(() => {
            setShowNewReportHint(false);
          }, 2500);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [classId, loadReportsWithAttachments]);

  return (
    <AppShell>
      <PageNav />
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((template) => (
              <button
                className="min-h-11 rounded-lg border border-blue-100 bg-blue-50 px-3 text-left text-sm font-semibold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                key={template.label}
                onClick={() => setContent(template.value)}
                type="button"
              >
                {template.label}
              </button>
            ))}
          </div>
          <textarea
            className="min-h-32 rounded-lg border border-slate-300 p-4 text-base leading-7 text-slate-950"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write today's class report or choose a template..."
            value={content}
          />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Attach file optional
            <input
              accept={reportAttachmentAccept}
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
              type="file"
            />
          </label>
          {selectedFile ? (
            <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
              Selected file: {selectedFile.name}
            </p>
          ) : null}
          <button
            className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSending}
            type="submit"
          >
            {isSending ? "Sending report..." : "Send report"}
          </button>
        </form>
      ) : null}

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-500">Daily reports</p>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            {newReportCount} new
          </span>
        </div>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Reports for this class
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Reports update live while this page is open.
        </p>
        {showNewReportHint ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            New report received.
          </p>
        ) : null}
        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading reports...</p>
          ) : reports.length === 0 ? (
            <EmptyState
              description="Reports will appear here as soon as a teacher sends the first class update."
              title="No reports yet"
            />
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
                {(reportAttachments[report.id] ?? []).length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {(reportAttachments[report.id] ?? []).map((attachment) => (
                      <a
                        className="flex min-h-12 flex-col rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm transition hover:-translate-y-0.5 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:flex-row sm:items-center sm:justify-between"
                        href={attachment.download_url ?? "#"}
                        key={attachment.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span className="font-semibold text-blue-900">
                          {attachment.file_name}
                        </span>
                        <span className="mt-1 text-xs font-semibold text-blue-700 sm:mt-0">
                          {getFileTypeLabel(attachment)} ·{" "}
                          {formatFileSize(attachment.file_size)}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
