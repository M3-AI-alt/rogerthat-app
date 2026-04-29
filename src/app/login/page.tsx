"use client";

import { getCurrentUserProfile, getDashboardRoute } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { getFriendlyAuthError } from "@/lib/supabase/auth-errors";
import { supabase, supabaseConfig } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactElement, useState } from "react";

const accountOptions = [
  {
    title: "Parent access request",
    description: "Parents can request access and get class assignment later.",
    href: ROUTES.signup,
    action: "Request parent access",
  },
  {
    title: "Teacher account",
    description: "Account created by school administration.",
  },
  {
    title: "Director account",
    description: "Account created by school administration.",
  },
  {
    title: "CEO login",
    description: "Use the CEO credentials created for the school.",
  },
] as const;

function getSupabaseConfigError(): string {
  if (!supabaseConfig.hasUrl || !supabaseConfig.hasAnonKey) {
    return "Login is temporarily unavailable. Please contact school administration.";
  }

  return "";
}

export default function LoginPage(): ReactElement {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  async function handlePasswordResetRequest() {
    setErrorMessage("");
    setStatusMessage("");

    const configError = getSupabaseConfigError();

    if (configError) {
      setErrorMessage(configError);
      return;
    }

    if (!loginId.includes("@")) {
      setErrorMessage("Enter your school email address first, then request a reset link.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(loginId.trim(), {
      redirectTo: `${window.location.origin}${ROUTES.resetPassword}`,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(getFriendlyAuthError(error));
      return;
    }

    setStatusMessage(
      "If this email exists in RogerThat, a password reset link has been sent. Open the link, set a new password, then log in again."
    );
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    const configError = getSupabaseConfigError();

    if (configError) {
      setErrorMessage(configError);
      return;
    }

    if (!loginId.includes("@")) {
      setErrorMessage("Use your school email address.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginId.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(getFriendlyAuthError(error));
      return;
    }

    try {
      const profile = await getCurrentUserProfile();

      if (!profile) {
        setErrorMessage(
          "No profile was found for this account. Ask the CEO to create or approve your profile."
        );
        return;
      }

      const dashboardRoute = getDashboardRoute(profile);

      if (!dashboardRoute) {
        setErrorMessage(
          "Your staff profile is not active yet. Ask the CEO to approve or complete your profile."
        );
        return;
      }

      router.push(dashboardRoute);
    } catch {
      setErrorMessage("Could not load your profile. Please try again.");
    }
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f5f8ff] px-4 py-4 text-slate-950 sm:px-5 sm:py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col sm:min-h-[calc(100vh-2.5rem)]">
        <div className="flex items-center justify-between">
          <Link
            aria-label="Go back home"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-95"
            href="/"
          >
            ←
          </Link>
          <Link
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            href={ROUTES.signup}
          >
            Sign up
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 sm:mt-10">
          <div className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#071b45] px-4 py-2 text-white shadow-xl shadow-blue-950/20 sm:min-h-14 sm:py-3">
            <Image
              alt="Ben Oxford Hub logo"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
              height={48}
              priority
              src="/ben-oxford-logo.png"
              width={48}
            />
            <span className="text-xl font-semibold leading-none tracking-normal sm:text-2xl">
              RogerThat
            </span>
          </div>
          <p className="text-sm font-normal tracking-wide text-[#071b45]">
            by Ben Oxford Hub
          </p>
        </div>

        <div className="mt-5 text-center sm:mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            RogerThat
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:mt-3 sm:text-3xl">
            Log into RogerThat
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3">
            Use your school email and password. Parent access starts with an
            access request.
          </p>
        </div>

        <form className="mt-5 grid gap-3 sm:mt-8" onSubmit={handleEmailLogin}>
          <input
            autoComplete="email"
            className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:min-h-14"
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="Email address"
            required
            type="text"
            value={loginId}
          />
          <input
            autoComplete="current-password"
            className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:min-h-14"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700 sm:p-4">
              {errorMessage}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 sm:p-4">
              {statusMessage}
            </p>
          ) : null}

          <button
            className="mt-1 min-h-12 rounded-lg bg-blue-700 px-5 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 sm:mt-2 sm:min-h-14"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <button
          className="mt-4 text-center text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          disabled={isLoading}
          onClick={() => void handlePasswordResetRequest()}
          type="button"
        >
          Forgot password?
        </button>

        <button
          className="mt-5 min-h-12 rounded-lg border border-slate-300 bg-white px-5 text-base font-bold text-slate-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98] sm:mt-6 sm:min-h-14"
          onClick={() => setShowCreateOptions((current) => !current)}
          type="button"
        >
          Create new account
        </button>

        {showCreateOptions ? (
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            {accountOptions.map((option) =>
              "href" in option ? (
                <Link
                  className="rounded-lg border border-blue-100 bg-blue-50 p-3 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:p-4"
                  href={option.href}
                  key={option.title}
                >
                  <p className="text-sm font-bold text-slate-950">
                    {option.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {option.description}
                  </p>
                  <span className="mt-2 inline-flex text-sm font-bold text-blue-700">
                    {option.action}
                  </span>
                </Link>
              ) : (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4"
                  key={option.title}
                >
                  <p className="text-sm font-bold text-slate-950">
                    {option.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {option.description}
                  </p>
                </div>
              )
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
