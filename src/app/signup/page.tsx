"use client";

import { ROUTES } from "@/lib/routes";
import { getFriendlyAuthError } from "@/lib/supabase/auth-errors";
import { supabase, supabaseConfig } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactElement, useState } from "react";

function getSupabaseConfigError(): string {
  if (!supabaseConfig.hasUrl || !supabaseConfig.hasAnonKey) {
    return "Parent access requests are temporarily unavailable. Please contact school administration.";
  }

  return "";
}

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

    const configError = getSupabaseConfigError();

    if (configError) {
      setErrorMessage(configError);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
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
      setErrorMessage(getFriendlyAuthError(error));
      return;
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          full_name: parentName,
          email: email.trim(),
          phone,
          role: "PARENT",
          approval_status: "PENDING",
        },
        { ignoreDuplicates: true, onConflict: "id" }
      );

      if (profileError) {
        setErrorMessage(
          "Your account was created, but your parent profile could not be completed. Please contact school administration."
        );
        return;
      }
    }

    if (data.user && !data.session) {
      setSuccessMessage(
        "Your parent account has been created. Check your email to confirm your account before login. Class access will be assigned by the CEO later."
      );
    } else {
      setSuccessMessage(
        "Your parent account has been created. Your account is active, and class access will be assigned by the CEO later."
      );
    }

    setParentName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setChildName("");
    setClassCode("");
  }

  return (
    <main className="min-h-screen bg-[#f5f8ff] px-5 py-5 text-slate-950">
      <section className="mx-auto w-full max-w-md">
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
          <p className="mt-2 text-sm font-normal tracking-wide text-[#071b45]">
            by Ben Oxford Hub
          </p>
          <h1 className="mt-6 text-3xl font-bold tracking-normal text-slate-950">
            Parent Access Request
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Parent signup only. Teacher, Director, and CEO accounts are created
            by school administration.
          </p>
        </div>

        <form
          className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleSignup}
        >
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Parent full name
            <input
              autoComplete="name"
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onChange={(event) => setParentName(event.target.value)}
              placeholder="Parent full name"
              required
              type="text"
              value={parentName}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Phone number
            <input
              autoComplete="tel"
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+84..."
              type="tel"
              value={phone}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input
              autoComplete="email"
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
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
            Child name
            <input
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onChange={(event) => setChildName(event.target.value)}
              placeholder="Child name"
              required
              type="text"
              value={childName}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Class ID / Class Code
            <input
              className="min-h-14 rounded-lg border border-slate-300 px-4 text-base text-slate-950 transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onChange={(event) => setClassCode(event.target.value)}
              placeholder="Class code from CEO"
              type="text"
              value={classCode}
            />
          </label>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Your app account can log in after email confirmation. Class access
            stays pending until the CEO assigns your class.
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
            className="min-h-14 rounded-lg bg-blue-700 px-5 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Sending request..." : "Send parent access request"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            className="font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            href={ROUTES.login}
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
