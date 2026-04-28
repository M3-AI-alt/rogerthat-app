"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createClassGroup,
  getClassGroups,
  type ClassGroup,
} from "@/lib/classes";
import { ROUTES } from "@/lib/routes";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

export default function CeoClassesPage(): ReactElement {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  async function loadClasses() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      setClasses(await getClassGroups());
    } catch {
      setErrorMessage(
        "Could not load classes. Please check your CEO access and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    try {
      const newClass = await createClassGroup({ code, name });
      setClasses((currentClasses) => [newClass, ...currentClasses]);
      setName("");
      setCode("");
      setSuccessMessage("Class created.");
    } catch {
      setErrorMessage(
        "Could not create class. Check that the code is unique and try again."
      );
    } finally {
      setIsCreating(false);
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
      <PageNav dashboardHref={ROUTES.ceoDashboard} />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Owner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Manage classes
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Create class groups with unique codes such as BOH-A1.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleCreateClass}
        >
          <p className="text-base font-semibold text-slate-950">
            Create new class
          </p>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Class name
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setName(event.target.value)}
              placeholder="Oxford Phonics A1"
              required
              type="text"
              value={name}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Unique class code
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base uppercase text-slate-950"
              onChange={(event) => setCode(event.target.value)}
              placeholder="BOH-A1"
              required
              type="text"
              value={code}
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
            disabled={isCreating}
            type="submit"
          >
            {isCreating ? "Creating..." : "Create class"}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">All classes</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Class groups
          </h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading classes...</p>
            ) : classes.length === 0 ? (
              <EmptyState
                description="Create a class like BOH-A1 to start parent assignment and reporting."
                title="No classes yet"
              />
            ) : (
              classes.map((classGroup) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={classGroup.id}
                >
                  <p className="text-base font-semibold text-slate-950">
                    {classGroup.name}
                  </p>
                  <p className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {classGroup.code}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
