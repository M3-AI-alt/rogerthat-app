import { ROUTES } from "@/lib/routes";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";

const notifications = [
  {
    title: "Report Sent",
    time: "9:30 AM",
    icon: "↗",
    color: "bg-emerald-100 text-emerald-600",
    className: "left-[5%] top-[28%] md:left-[4%] md:top-[10%]",
    delay: "animation-delay-0",
    driftX: "7px",
    driftY: "-8px",
  },
  {
    title: "Parent Read",
    time: "10:15 AM",
    icon: "✉",
    color: "bg-violet-100 text-violet-600",
    className: "right-[4%] top-[42%] md:right-[4%] md:top-[43%]",
    delay: "animation-delay-200",
    driftX: "-6px",
    driftY: "7px",
  },
  {
    title: "Feedback Delivered",
    time: "11:45 AM",
    icon: "★",
    color: "bg-amber-100 text-amber-500",
    className: "left-[9%] top-[58%] md:left-[5%] md:top-auto md:bottom-[4%]",
    delay: "animation-delay-400",
    driftX: "5px",
    driftY: "-6px",
  },
] as const;

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

function BrandLockup(): ReactElement {
  return (
    <Link className="flex items-center gap-4" href="/">
      <Image
        alt="Ben Oxford Hub logo"
        className="h-20 w-20 rounded-full object-contain md:h-20 md:w-20"
        height={80}
        priority
        src="/ben-oxford-logo.png"
        width={80}
      />
      <span>
        <span className="block text-4xl font-bold leading-none tracking-normal text-[#071b45] md:text-4xl">
          RogerThat
        </span>
        <span className="mt-2 block text-lg font-medium text-[#14285c] md:text-base">
          by Ben Oxford Hub
        </span>
      </span>
    </Link>
  );
}

function NotificationCard({
  notification,
}: {
  notification: (typeof notifications)[number];
}): ReactElement {
  const animationStyle = {
    "--card-drift-x": notification.driftX,
    "--card-drift-y": notification.driftY,
  } as CSSProperties;

  return (
    <div
      className={`absolute z-20 flex w-[min(18rem,80vw)] animate-float-card items-center gap-3 rounded-3xl bg-white/95 p-4 text-slate-950 shadow-2xl shadow-slate-900/10 backdrop-blur md:w-72 ${notification.className} ${notification.delay}`}
      style={animationStyle}
    >
      <div
        className={`animate-icon-breathe flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${notification.color}`}
      >
        {notification.icon}
      </div>
      <div>
        <p className="text-base font-bold leading-5">{notification.title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {notification.time}
        </p>
      </div>
      <div className="ml-2 flex h-6 w-6 animate-check-pop items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        ✓
      </div>
    </div>
  );
}

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen bg-white pb-28 text-[#071126] md:pb-0">
      <section className="relative mx-auto hidden h-screen w-full max-w-[1536px] overflow-hidden bg-white md:block">
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

      <section className="mx-auto min-h-screen w-full max-w-md bg-slate-950 text-white md:hidden">
        <div className="relative min-h-[760px] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              alt="Asian mother using RogerThat on a smartphone"
              className="h-full w-full object-cover"
              fill
              priority
              sizes="100vw"
              src="/person-asian-mother.png"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-slate-950" />
            <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent" />
          </div>

          <div className="relative z-10 px-6 pt-7">
            <BrandLockup />
          </div>

          {notifications.map((notification) => (
            <NotificationCard key={notification.title} notification={notification} />
          ))}

          <div className="relative z-10 flex min-h-[760px] flex-col justify-end px-6 pb-10 text-center">
            <h1 className="text-6xl font-extrabold leading-[0.95] tracking-normal">
              Report smarter,
              <span className="block text-blue-500">not harder</span>
            </h1>
            <div className="mx-auto mt-3 h-2 w-36 rounded-full bg-amber-400" />
            <p className="mx-auto mt-6 max-w-xs text-2xl font-medium leading-9 text-slate-200">
              Stay connected to your child&apos;s learning every day
            </p>
          </div>
        </div>

        <section className="grid gap-8 px-6 py-8">
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
      </section>

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
