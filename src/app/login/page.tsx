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
          UI preview for future phone, Google, and email login methods.
        </p>

        <div className="mt-8 grid gap-5 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div>
            <p className="text-lg font-semibold text-slate-950">
              Login with your phone number
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter your phone number, then use the OTP code sent to your
              device.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone number
            <input
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-lg text-slate-950"
              placeholder="+84..."
              type="tel"
            />
          </label>
          <div className="grid gap-3">
            <button className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white">
              Send OTP code
            </button>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              OTP code placeholder
              <input
                className="min-h-14 rounded-lg border border-slate-300 px-4 text-center text-xl tracking-wide text-slate-950"
                placeholder="000000"
                type="text"
              />
            </label>
            <button className="min-h-14 rounded-lg border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-950">
              Verify OTP
            </button>
          </div>
        </div>

        <button className="mt-4 min-h-14 w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-950">
          Continue with Google
        </button>

        <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-950">
            Login with email and password
          </p>
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
