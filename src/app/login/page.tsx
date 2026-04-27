import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { ReactElement } from "react";

export default function LoginPage(): ReactElement {
  return (
    <AppShell>
      <section className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          RogerThat
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Login</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          UI preview for future email, Google, and phone login methods.
        </p>

        <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="name@example.com"
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="Password"
              type="password"
            />
          </label>
          <button className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white">
            Login with email
          </button>
        </div>

        <button className="mt-4 min-h-14 w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-950">
          Continue with Google
        </button>

        <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone number
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="+84..."
              type="tel"
            />
          </label>
          <button className="min-h-14 rounded-lg border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-950">
            Send OTP code
          </button>
        </div>

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
