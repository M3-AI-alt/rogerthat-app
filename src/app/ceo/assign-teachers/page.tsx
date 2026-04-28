"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  assignTeacherToClass,
  getClassGroups,
  getTeacherClassAssignments,
  removeTeacherFromClass,
  type ClassGroup,
  type TeacherClassAssignment,
} from "@/lib/classes";
import type { UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

type TeacherProfile = Pick<UserProfile, "id" | "full_name" | "email" | "phone">;

function getTeacherLabel(teacher: TeacherProfile): string {
  return teacher.full_name?.trim() || teacher.email?.trim() || teacher.id;
}

export default function CeoAssignTeachersPage(): ReactElement {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    null
  );

  async function loadAssignmentData() {
    setErrorMessage("");
    setIsLoading(true);

    const teachersQuery = supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "TEACHER")
      .order("created_at", { ascending: false });

    try {
      const [teacherResult, classResult, assignmentResult] = await Promise.all([
        teachersQuery,
        getClassGroups(),
        getTeacherClassAssignments(),
      ]);

      if (teacherResult.error) {
        throw teacherResult.error;
      }

      setTeachers(teacherResult.data ?? []);
      setClasses(classResult);
      setAssignments(assignmentResult);
    } catch {
      setErrorMessage(
        "Could not load teacher assignments. Check your CEO access and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      await assignTeacherToClass({
        classId: selectedClassId,
        teacherId: selectedTeacherId,
      });
      setSuccessMessage("Teacher assigned to class.");
      await loadAssignmentData();
    } catch {
      setErrorMessage(
        "Could not assign teacher to class. Check that a teacher and class are selected."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    setActiveAssignmentId(assignmentId);

    try {
      await removeTeacherFromClass({ assignmentId });
      setSuccessMessage("Teacher removed from class.");
      await loadAssignmentData();
    } catch {
      setErrorMessage("Could not remove this teacher from the class.");
    } finally {
      setActiveAssignmentId(null);
    }
  }

  function getAssignmentTeacherLabel(teacherId: string | null): string {
    const teacher = teachers.find((item) => item.id === teacherId);
    return teacher ? getTeacherLabel(teacher) : "Unknown teacher";
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadAssignmentData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav dashboardHref={ROUTES.ceoDashboard} />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Owner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Assign teachers
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Add teachers to class rooms.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleAssignTeacher}
        >
          <p className="text-base font-semibold text-slate-950">
            New teacher assignment
          </p>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Teacher
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              required
              value={selectedTeacherId}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {getTeacherLabel(teacher)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Class
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setSelectedClassId(event.target.value)}
              required
              value={selectedClassId}
            >
              <option value="">Select class</option>
              {classes.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.code} - {classGroup.name}
                </option>
              ))}
            </select>
          </label>

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {successMessage}
            </p>
          ) : null}

          <button
            className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSaving || isLoading}
            type="submit"
          >
            {isSaving ? "Assigning..." : "Assign teacher to class"}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Current assignments
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Teachers and classes
          </h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading assignments...</p>
            ) : assignments.length === 0 ? (
            <EmptyState
              actionHref={ROUTES.ceoClasses}
              actionLabel="Create or review classes"
                description="Assign a teacher after at least one class room and one teacher profile exist."
                title="No teachers assigned yet"
              />
            ) : (
              assignments.map((assignment) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={assignment.id}
                >
                  <p className="text-base font-semibold text-slate-950">
                    {getAssignmentTeacherLabel(assignment.teacher_id)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {assignment.class_groups?.code ?? "No code"} -{" "}
                    {assignment.class_groups?.name ?? "No class"}
                  </p>
                  <button
                    className="mt-4 min-h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={activeAssignmentId === assignment.id}
                    onClick={() => void handleRemoveAssignment(assignment.id)}
                    type="button"
                  >
                    Remove from class
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
