"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { type FormEvent, type ReactElement, useState } from "react";

export default function SignupPage(): ReactElement {
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          approval_status: "pending",
          child_name: childName,
          class_code: classCode,
          full_name: parentName,
          phone,
          role: "parent",
        },
      },
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      "Your account request has been created and is pending CEO approval."
    );
    setParentName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setChildName("");
    setClassCode("");
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          RogerThat
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Sign up</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Parent signup creates an access request. CEO approval will be added in
          a later step.
        </p>

        <div className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-950">
            Placeholder signup methods
          </p>
          <button
            className="min-h-12 cursor-not-allowed rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-500"
            disabled
            type="button"
          >
            Continue with Google later
          </button>
          <button
            className="min-h-12 cursor-not-allowed rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-500"
            disabled
            type="button"
          >
            Sign up with phone OTP later
          </button>
        </div>

        <form
          className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleSignup}
        >
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Parent full name
            <input
              autoComplete="name"
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setParentName(event.target.value)}
              placeholder="Parent full name"
              required
              type="text"
              value={parentName}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone number
            <input
              autoComplete="tel"
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+84..."
              type="tel"
              value={phone}
            />
          </label>
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
              autoComplete="new-password"
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              type="password"
              value={password}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Child name
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setChildName(event.target.value)}
              placeholder="Child name"
              required
              type="text"
              value={childName}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Class ID / Class Code
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-4 text-base text-slate-950"
              onChange={(event) => setClassCode(event.target.value)}
              placeholder="Class code from CEO"
              type="text"
              value={classCode}
            />
          </label>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Your account will wait for CEO approval. The CEO approval screen
            will be added later.
          </p>

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
            className="min-h-14 rounded-lg bg-slate-950 px-5 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Creating request..." : "Send parent access request"}
          </button>
        </form>

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
