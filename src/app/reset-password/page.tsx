"use client";

import { getDashboardRoute } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { getFriendlyAuthError } from "@/lib/supabase/auth-errors";
import { supabase, supabaseConfig } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactElement,
  useEffect,
  useState,
} from "react";

function getSupabaseConfigError(): string {
  if (!supabaseConfig.hasUrl || !supabaseConfig.hasAnonKey) {
    return "Password reset is temporarily unavailable. Please contact school administration.";
  }

  return "";
}

export default function ResetPasswordPage(): ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function detectResetSession() {
      const configError = getSupabaseConfigError();

      if (configError) {
        setErrorMessage(configError);
        setIsReady(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setIsReady(Boolean(session));

        if (!session) {
          setErrorMessage(
            "This reset link is missing, expired, or already used. Request a new reset link from the login page."
          );
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
        setErrorMessage("");
      }
    });

    void detectResetSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Both password fields must match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Use at least 6 characters.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsSaving(false);

    if (error) {
      setErrorMessage(getFriendlyAuthError(error));
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccessMessage("Password updated. Redirecting to your dashboard...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(ROUTES.login);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, role, has_admin_access, approval_status, created_at, updated_at"
      )
      .eq("id", user.id)
      .maybeSingle();

    window.setTimeout(() => {
      const dashboardRoute = profile ? getDashboardRoute(profile) : null;
      router.push(dashboardRoute ?? ROUTES.login);
    }, 900);
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f5f8ff] px-4 py-4 text-slate-950 sm:px-5 sm:py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col sm:min-h-[calc(100vh-2.5rem)]">
        <div className="flex items-center justify-between">
          <Link
            aria-label="Go back to login"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-95"
            href={ROUTES.login}
          >
            ←
          </Link>
          <Link
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            href="/"
          >
            Home
          </Link>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl shadow-blue-950/10 ring-1 ring-slate-200">
          <div className="inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#071b45] px-4 py-3 text-white shadow-xl shadow-blue-950/20">
            <Image
              alt="Ben Oxford Hub logo"
              className="h-12 w-12 object-contain"
              height={48}
              priority
              src="/ben-oxford-logo.png"
              width={48}
            />
            <span className="text-2xl font-semibold leading-none tracking-normal">
              RogerThat
            </span>
          </div>
          <p className="mt-2 text-sm font-normal tracking-wide text-[#071b45]">
            by Ben Oxford Hub
          </p>
          <h1 className="mt-6 text-3xl font-bold tracking-normal text-slate-950">
            Set a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use the reset link from your email to choose a new password for your
            RogerThat account.
          </p>
        </div>

        <form
          className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleUpdatePassword}
        >
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            New password
            <input
              autoComplete="new-password"
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              type="password"
              value={password}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Confirm password
            <input
              autoComplete="new-password"
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              minLength={6}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat new password"
              required
              type="password"
              value={confirmPassword}
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
            className="min-h-14 rounded-lg bg-blue-700 px-5 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!isReady || isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
