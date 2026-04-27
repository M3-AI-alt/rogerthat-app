import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { ReactElement } from "react";

export default function SignupPage(): ReactElement {
  return (
    <AppShell>
      <section className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          RogerThat
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Sign up</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Request access for a Director, Teacher, or Parent account.
        </p>

        <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Full name
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="Your full name"
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email optional
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="name@example.com"
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone number optional
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="+84..."
              type="tel"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password optional
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="Password"
              type="password"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Requested role
            <select className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950">
              <option>Director</option>
              <option>Teacher</option>
              <option>Parent</option>
            </select>
          </label>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Accounts must be approved by CEO before access.
          </p>

          <button className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white">
            Request account
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-slate-950" href={ROUTES.login}>
            Login
          </Link>
        </p>
      </section>
    </AppShell>
  );
}
