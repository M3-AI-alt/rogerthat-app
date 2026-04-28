"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import {
  assignParentToClass,
  getClassGroups,
  getParentClassAssignments,
  removeParentFromClass,
  type ClassGroup,
  type ParentClassAssignment,
} from "@/lib/classes";
import type { UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

type ParentProfile = Pick<UserProfile, "id" | "full_name" | "email" | "phone">;

function formatValue(value: string | null): string {
  return value?.trim() || "Not provided";
}

export default function CeoAssignParentsPage(): ReactElement {
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [assignments, setAssignments] = useState<ParentClassAssignment[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [childName, setChildName] = useState("");
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

    const parentsQuery = supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "PARENT")
      .order("created_at", { ascending: false });

    try {
      const [parentResult, classResult, assignmentResult] = await Promise.all([
        parentsQuery,
        getClassGroups(),
        getParentClassAssignments(),
      ]);

      if (parentResult.error) {
        throw parentResult.error;
      }

      setParents(parentResult.data ?? []);
      setClasses(classResult);
      setAssignments(assignmentResult);
    } catch {
      setErrorMessage(
        "Could not load assignment data. Make sure you are logged in as an approved CEO and the class SQL has been run."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssignParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      await assignParentToClass({
        childName,
        classId: selectedClassId,
        parentId: selectedParentId,
      });
      setChildName("");
      setSuccessMessage("Parent assigned to class.");
      await loadAssignmentData();
    } catch {
      setErrorMessage(
        "Could not assign parent to class. Check that a parent and class are selected."
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
      await removeParentFromClass({ assignmentId });
      setSuccessMessage("Parent removed from class.");
      await loadAssignmentData();
    } catch {
      setErrorMessage("Could not remove this parent from the class.");
    } finally {
      setActiveAssignmentId(null);
    }
  }

  function getParentLabel(parentId: string | null): string {
    const parent = parents.find((item) => item.id === parentId);
    return parent?.full_name || parent?.email || "Unknown parent";
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
          Assign parents
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Assign parents to one or more class groups. Teacher assignment comes
          later.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleAssignParent}
        >
          <p className="text-base font-semibold text-slate-950">
            New class assignment
          </p>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Parent
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setSelectedParentId(event.target.value)}
              required
              value={selectedParentId}
            >
              <option value="">Select parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.full_name || parent.email || parent.id}
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
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Child name optional
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setChildName(event.target.value)}
              placeholder="Child name"
              type="text"
              value={childName}
            />
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
            {isSaving ? "Assigning..." : "Assign parent to class"}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Current assignments
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Parents and classes
          </h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-slate-600">
                No active parent class assignments yet.
              </p>
            ) : (
              assignments.map((assignment) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={assignment.id}
                >
                  <p className="text-base font-semibold text-slate-950">
                    {getParentLabel(assignment.parent_id)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {assignment.class_groups?.code ?? "No code"} -{" "}
                    {assignment.class_groups?.name ?? "No class"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Child: {formatValue(assignment.child_name)}
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
