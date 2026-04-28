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
      setErrorMessage("Use your email address for now. Phone login is coming later.");
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
    <main className="min-h-screen bg-[#f5f8ff] px-5 py-5 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col">
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

        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#071b45] px-4 py-3 text-white shadow-xl shadow-blue-950/20">
            <Image
              alt="Ben Oxford Hub logo"
              className="h-11 w-11 object-contain"
              height={44}
              priority
              src="/ben-oxford-logo.png"
              width={44}
            />
            <span className="text-2xl font-semibold leading-none tracking-normal">
              RogerThat
            </span>
          </div>
          <p className="text-sm font-normal tracking-wide text-[#071b45]">
            by Ben Oxford Hub
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            RogerThat
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
            Log into RogerThat
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use your school email and password. Parent access starts with an
            access request.
          </p>
        </div>

        <form className="mt-8 grid gap-3" onSubmit={handleEmailLogin}>
          <input
            autoComplete="email"
            className="min-h-14 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="Phone number or email"
            required
            type="text"
            value={loginId}
          />
          <input
            autoComplete="current-password"
            className="min-h-14 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {statusMessage}
            </p>
          ) : null}

          <button
            className="mt-2 min-h-14 rounded-lg bg-blue-700 px-5 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <button
          className="mt-4 text-center text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          onClick={() =>
            setStatusMessage(
              "Password reset will be added later. Ask school administration if you cannot log in."
            )
          }
          type="button"
        >
          Forgot password?
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase text-slate-400">
            or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          className="min-h-14 rounded-lg border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
          onClick={() =>
            setStatusMessage("Google login is not available yet.")
          }
          type="button"
        >
          Continue with Google
        </button>

        <button
          className="mt-3 min-h-14 rounded-lg border border-slate-300 bg-white px-5 text-base font-bold text-slate-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
          onClick={() => setShowCreateOptions((current) => !current)}
          type="button"
        >
          Create new account
        </button>

        {showCreateOptions ? (
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {accountOptions.map((option) =>
              "href" in option ? (
                <Link
                  className="rounded-lg border border-blue-100 bg-blue-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
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
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
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
