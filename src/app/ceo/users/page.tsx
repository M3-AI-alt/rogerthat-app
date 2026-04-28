"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import type { ApprovalStatus, UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import { type ReactElement, useEffect, useMemo, useState } from "react";

type ProfileRow = Pick<
  UserProfile,
  | "id"
  | "full_name"
  | "email"
  | "phone"
  | "role"
  | "has_admin_access"
  | "approval_status"
  | "created_at"
>;

const profileSelect =
  "id, full_name, email, phone, role, has_admin_access, approval_status, created_at";

function formatProfileValue(value: string | null): string {
  return value?.trim() || "Not provided";
}

function getOnlineStatus(profileId: string): "online" | "offline" {
  return profileId.charCodeAt(0) % 2 === 0 ? "online" : "offline";
}

function getParentAssignmentLabel(status: ApprovalStatus | null): string {
  if (status === "APPROVED") {
    return "Class assigned";
  }

  if (status === "REJECTED") {
    return "Class access removed";
  }

  return "Waiting for class assignment";
}

function OnlineBadge({ status }: { status: "online" | "offline" }): ReactElement {
  const colorClass =
    status === "online"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${colorClass}`}
    >
      {status}
    </span>
  );
}

function AssignmentBadge({
  status,
}: {
  status: ApprovalStatus | null;
}): ReactElement {
  const colorClass =
    status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colorClass}`}
    >
      {getParentAssignmentLabel(status)}
    </span>
  );
}

function MemberCard({ profile }: { profile: ProfileRow }): ReactElement {
  const onlineStatus = getOnlineStatus(profile.id);

  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-950">
            {formatProfileValue(profile.full_name)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatProfileValue(profile.email)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatProfileValue(profile.phone)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {profile.role ?? "NO ROLE"}
          </span>
          <OnlineBadge status={onlineStatus} />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Admin: {profile.has_admin_access ? "Yes" : "No"}
          </span>
        </div>
      </div>
      {profile.role === "PARENT" ? (
        <div className="mt-3">
          <AssignmentBadge status={profile.approval_status} />
        </div>
      ) : null}
    </article>
  );
}

export default function CeoUsersPage(): ReactElement {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const newParents = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.role === "PARENT" && profile.approval_status === "PENDING"
      ),
    [profiles]
  );

  async function loadProfiles() {
    setErrorMessage("");
    setIsLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .order("created_at", { ascending: false });

    setIsLoading(false);

    if (error) {
      setErrorMessage(
        "Could not load profiles. Please check your CEO access and try again."
      );
      return;
    }

    setProfiles(data ?? []);
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadProfiles();
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
          User management
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          View all app members and track parent class assignment status.
        </p>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">All members</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            CEO, Directors, Teachers, and Parents
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Online/offline is a placeholder until real presence tracking is
            added.
          </p>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading members...</p>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-slate-600">No profiles found.</p>
            ) : (
              profiles.map((profile) => (
                <MemberCard key={profile.id} profile={profile} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">New parents</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Waiting for class assignment
          </h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading parents...</p>
            ) : newParents.length === 0 ? (
              <p className="text-sm text-slate-600">
                No new parents are waiting for class assignment.
              </p>
            ) : (
              newParents.map((profile) => (
                <MemberCard key={profile.id} profile={profile} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Create staff account placeholder
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Director or Teacher
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              className="min-h-12 cursor-not-allowed rounded-lg border border-slate-300 bg-slate-50 px-5 text-base font-semibold text-slate-500"
              disabled
              type="button"
            >
              Director
            </button>
            <button
              className="min-h-12 cursor-not-allowed rounded-lg border border-slate-300 bg-slate-50 px-5 text-base font-semibold text-slate-500"
              disabled
              type="button"
            >
              Teacher
            </button>
          </div>
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Staff account creation and class assignment will be added in next
            steps.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
