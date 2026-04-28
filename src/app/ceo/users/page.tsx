"use client";

import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase/client";
import type { ApprovalStatus, ProfileRole, UserProfile } from "@/lib/profile";
import { type ReactElement, useEffect, useState } from "react";

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

function StatusBadge({ status }: { status: ApprovalStatus | null }): ReactElement {
  const label = status ?? "UNKNOWN";
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
      {label}
    </span>
  );
}

export default function CeoUsersPage(): ReactElement {
  const [pendingParents, setPendingParents] = useState<ProfileRow[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ProfileRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  async function loadProfiles() {
    setErrorMessage("");
    setIsLoading(true);

    const [pendingResult, approvedResult] = await Promise.all([
      supabase
        .from("profiles")
        .select(profileSelect)
        .eq("role", "PARENT" satisfies ProfileRole)
        .eq("approval_status", "PENDING" satisfies ApprovalStatus)
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select(profileSelect)
        .eq("approval_status", "APPROVED" satisfies ApprovalStatus)
        .order("created_at", { ascending: false }),
    ]);

    setIsLoading(false);

    if (pendingResult.error || approvedResult.error) {
      setErrorMessage(
        "Could not load profiles. Make sure you are logged in as an approved CEO and the CEO profile policies SQL has been run."
      );
      return;
    }

    setPendingParents(pendingResult.data ?? []);
    setApprovedUsers(approvedResult.data ?? []);
  }

  async function updateParentApproval(
    profileId: string,
    approvalStatus: Extract<ApprovalStatus, "APPROVED" | "REJECTED">
  ) {
    setErrorMessage("");
    setActiveProfileId(profileId);

    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: approvalStatus,
        has_admin_access: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("role", "PARENT");

    setActiveProfileId(null);

    if (error) {
      setErrorMessage(
        "Could not update this parent request. Make sure your CEO profile is approved and the CEO profile policies SQL has been run."
      );
      return;
    }

    await loadProfiles();
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadProfiles();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Owner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          User management
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Review parent access requests and monitor approved users.
        </p>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pending parent requests
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Parents waiting for approval
              </h2>
            </div>
            <StatusBadge status="PENDING" />
          </div>

          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading requests...</p>
            ) : pendingParents.length === 0 ? (
              <p className="text-sm text-slate-600">
                No parent requests are pending.
              </p>
            ) : (
              pendingParents.map((profile) => (
                <article
                  className="grid gap-4 rounded-lg border border-slate-200 p-4"
                  key={profile.id}
                >
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
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="min-h-11 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={activeProfileId === profile.id}
                      onClick={() =>
                        void updateParentApproval(profile.id, "APPROVED")
                      }
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="min-h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      disabled={activeProfileId === profile.id}
                      onClick={() =>
                        void updateParentApproval(profile.id, "REJECTED")
                      }
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Approved users</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Active approved accounts
          </h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading users...</p>
            ) : approvedUsers.length === 0 ? (
              <p className="text-sm text-slate-600">
                No approved profiles found.
              </p>
            ) : (
              approvedUsers.map((profile) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={profile.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        {formatProfileValue(profile.full_name)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatProfileValue(profile.email)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {profile.role ?? "NO ROLE"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        Admin: {profile.has_admin_access ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </article>
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
            Staff account creation will be added in next step.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
