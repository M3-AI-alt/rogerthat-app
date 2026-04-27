"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/routes";
import { supabase, supabaseConfig } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactElement, useState } from "react";

type LoginRole = "ceo" | "director" | "teacher" | "parent";

const dashboardByRole: Record<LoginRole, string> = {
  ceo: ROUTES.ceoDashboard,
  director: ROUTES.directorDashboard,
  teacher: ROUTES.teacherDashboard,
  parent: ROUTES.parentDashboard,
};

function isLoginRole(role: unknown): role is LoginRole {
  return (
    role === "ceo" ||
    role === "director" ||
    role === "teacher" ||
    role === "parent"
  );
}

function getSupabaseConfigError(): string {
  if (!supabaseConfig.hasUrl || !supabaseConfig.hasAnonKey) {
    return "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart npm run dev.";
  }

  return "";
}

export default function LoginPage(): ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<LoginRole | "">("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    const configError = getSupabaseConfigError();

    if (configError) {
      console.error("[Supabase login] Missing configuration", {
        hasAnonKey: supabaseConfig.hasAnonKey,
        hasUrl: supabaseConfig.hasUrl,
      });
      setErrorMessage(configError);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      console.error("[Supabase login] signInWithPassword failed", {
        message: error.message,
        status: error.status,
      });
      setErrorMessage(error.message);
      return;
    }

    console.info("[Supabase login] signInWithPassword succeeded", {
      hasSession: Boolean(data.session),
      userId: data.user?.id,
    });

    const userMetadata = data.user?.user_metadata ?? {};
    const approvalStatus = userMetadata.approval_status;
    const metadataRole = userMetadata.role;

    if (approvalStatus === "pending") {
      setStatusMessage(
        "Your account request is still waiting for CEO approval."
      );
      return;
    }

    const role = isLoginRole(metadataRole) ? metadataRole : selectedRole;

    if (role) {
      router.push(dashboardByRole[role]);
      return;
    }

    router.push(ROUTES.roles);
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          RogerThat
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Login</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Email and password login is active. Phone and Google login will be
          added later.
        </p>
        <p className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
          Supabase config:{" "}
          {supabaseConfig.hasUrl && supabaseConfig.hasAnonKey
            ? `connected to ${supabaseConfig.urlHost}`
            : "missing local environment variables"}
        </p>

        <div className="mt-8 grid gap-5 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div>
            <p className="text-lg font-semibold text-slate-950">
              Phone login placeholder
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Phone OTP login is planned for a later step.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone number
            <input
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-lg text-slate-500"
              disabled
              placeholder="+84..."
              type="tel"
            />
          </label>
          <button
            className="min-h-14 cursor-not-allowed rounded-lg bg-slate-200 px-5 py-4 text-base font-semibold text-slate-500"
            disabled
            type="button"
          >
            Send OTP code later
          </button>
        </div>

        <button
          className="mt-4 min-h-14 w-full cursor-not-allowed rounded-lg border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-500"
          disabled
          type="button"
        >
          Continue with Google later
        </button>

        <form
          className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleEmailLogin}
        >
          <p className="text-base font-semibold text-slate-950">
            Login with email and password
          </p>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              autoComplete="email"
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              autoComplete="current-password"
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Temporary role redirect
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) =>
                setSelectedRole(event.target.value as LoginRole | "")
              }
              value={selectedRole}
            >
              <option value="">Use account role, or choose later</option>
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
              <option value="director">Director</option>
              <option value="ceo">CEO / Owner</option>
            </select>
          </label>

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
            className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Logging in..." : "Login with email"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-semibold text-slate-950" href={ROUTES.signup}>
            Sign up
          </Link>
        </p>
      </section>
    </AppShell>
  );
}
