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
          Parent access request for your child&apos;s class reports and
          supervised chats.
        </p>

        <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Parent full name
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="Parent full name"
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone number
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="+84..."
              type="tel"
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
            Child name
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="Child name"
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Class ID / Class Code
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              placeholder="Class code from CEO"
              type="text"
            />
          </label>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Your account will wait for CEO approval. The CEO will assign you to
            the correct class.
          </p>

          <button className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white">
            Send parent access request
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-950">
            Your request has been sent.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your account is pending CEO approval. After approval, you will be
            assigned to your child&apos;s class.
          </p>
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
