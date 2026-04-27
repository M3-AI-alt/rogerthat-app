import { ROUTES } from "@/lib/routes";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

const valuePreviews = [
  "See today's report instantly",
  "Get teacher feedback in real-time",
  "Track your child's progress daily",
] as const;

const roles = ["Parent", "Teacher", "Director"] as const;

const trustItems = [
  "Your child's data is protected",
  "CEO supervises all communication",
  "No hidden private messages",
] as const;

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen bg-white pb-28 md:pb-0">
      <section className="relative mx-auto hidden min-h-screen w-full max-w-[1536px] overflow-hidden bg-white md:block">
        <Image
          alt="RogerThat by Ben Oxford Hub desktop SaaS landing page"
          className="absolute inset-0 h-full w-full object-contain"
          fill
          priority
          sizes="100vw"
          src="/rogerthat-saas-main-page.png"
        />

        <Link
          aria-label="Login"
          className="absolute right-[3.2%] top-[4%] h-[6.2%] w-[8%] rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/40"
          href={ROUTES.login}
        />
        <Link
          aria-label="Get Started"
          className="absolute bottom-[13.7%] left-[3.4%] h-[6.3%] w-[19.9%] rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/40"
          href={ROUTES.login}
        />
      </section>

      <div className="mx-auto w-full max-w-md bg-slate-950 md:hidden">
        <section className="relative min-h-screen overflow-hidden bg-slate-950">
          <Image
            alt="RogerThat by Ben Oxford Hub mobile landing page"
            className="absolute inset-0 h-full w-full object-cover"
            fill
            priority
            sizes="100vw"
            src="/rogerthat-landing-reference.png"
          />

          {/* Later: replace static notification artwork with Framer Motion.
              Sequence idea: report card appears first, speaking score second,
              homework third, teacher feedback fourth. */}
          <Link
            aria-label="Continue with Phone"
            className="absolute bottom-[17%] left-[9%] right-[9%] h-[6.6%] rounded-full focus:outline-none focus:ring-4 focus:ring-white/80"
            href={ROUTES.login}
          />
          <Link
            aria-label="Continue with Google"
            className="absolute bottom-[7.5%] left-[9%] h-[5.4%] w-[39%] rounded-3xl focus:outline-none focus:ring-4 focus:ring-white/80"
            href={ROUTES.login}
          />
          <Link
            aria-label="Continue with Email"
            className="absolute bottom-[7.5%] right-[9%] h-[5.4%] w-[39%] rounded-3xl focus:outline-none focus:ring-4 focus:ring-white/80"
            href={ROUTES.login}
          />
        </section>

        <section className="grid gap-8 px-6 py-8 text-white">
          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Why parents use RogerThat
            </p>
            {valuePreviews.map((item) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg"
                key={item}
              >
                <p className="text-lg font-semibold leading-7">{item}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Choose your role
            </p>
            <div className="grid gap-3">
              {roles.map((role) => (
                <Link
                  className="flex min-h-14 items-center justify-between rounded-2xl bg-white px-5 text-lg font-bold text-slate-950"
                  href={ROUTES.login}
                  key={role}
                >
                  {role}
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Trust and supervision
            </p>
            {trustItems.map((item) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/10 p-4"
                key={item}
              >
                <p className="text-base font-semibold leading-7">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md bg-slate-950/95 px-5 py-4 backdrop-blur md:hidden">
        <Link
          className="flex min-h-16 items-center justify-center rounded-full bg-blue-600 px-6 text-xl font-bold text-white shadow-2xl shadow-blue-950/40"
          href={ROUTES.login}
        >
          Continue with Phone
        </Link>
      </div>
    </main>
  );
}
