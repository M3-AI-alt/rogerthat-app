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
    className: "left-4 top-24 lg:left-0 lg:top-16",
    delay: "animation-delay-0",
    driftX: "7px",
    driftY: "-8px",
  },
  {
    title: "Parent Read",
    time: "10:15 AM",
    icon: "✉",
    color: "bg-blue-100 text-blue-700",
    className: "right-3 top-[42%] lg:-right-2 lg:top-[40%]",
    delay: "animation-delay-200",
    driftX: "-6px",
    driftY: "7px",
  },
  {
    title: "Feedback Delivered",
    time: "11:45 AM",
    icon: "★",
    color: "bg-amber-100 text-amber-500",
    className: "bottom-10 left-8 lg:-bottom-2 lg:left-12",
    delay: "animation-delay-400",
    driftX: "5px",
    driftY: "-6px",
  },
] as const;

const entryOptions = [
  {
    title: "Parent access request",
    description: "Parents can request access and wait for class assignment.",
    href: ROUTES.signup,
    action: "Request access",
  },
  {
    title: "Teacher account",
    description: "Teacher accounts are created by school administration.",
    href: ROUTES.login,
    action: "Log in",
  },
  {
    title: "Director account",
    description: "Director accounts are created by school administration.",
    href: ROUTES.login,
    action: "Log in",
  },
  {
    title: "CEO login",
    description: "CEO account signs in with school-managed credentials.",
    href: ROUTES.login,
    action: "Log in",
  },
] as const;

const valuePreviews = [
  "Daily reports arrive in one supervised place.",
  "Parents only see their assigned classes.",
  "CEO and Directors stay visible in communication.",
] as const;

function BrandLockup(): ReactElement {
  return (
    <Link
      className="group flex items-center gap-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30"
      href="/"
    >
      <Image
        alt="Ben Oxford Hub logo"
        className="h-12 w-12 rounded-full object-contain shadow-sm transition duration-200 group-hover:scale-105 md:h-14 md:w-14"
        height={56}
        priority
        src="/ben-oxford-logo.png"
        width={56}
      />
      <span>
        <span className="block text-2xl font-bold leading-none tracking-normal text-[#071b45] md:text-3xl">
          RogerThat
        </span>
        <span className="mt-1 block text-xs font-medium tracking-wide text-[#35517f] md:text-sm">
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
      className={`absolute z-20 flex w-[min(18rem,82vw)] animate-float-card items-center gap-3 rounded-2xl bg-white/95 p-4 text-slate-950 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80 backdrop-blur ${notification.className} ${notification.delay}`}
      style={animationStyle}
    >
      <div
        className={`animate-icon-breathe flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${notification.color}`}
      >
        {notification.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold leading-5">
          {notification.title}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {notification.time}
        </p>
      </div>
      <div className="flex h-7 w-7 animate-check-pop items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
        ✓
      </div>
    </div>
  );
}

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen bg-[#f5f8ff] text-[#071126]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <BrandLockup />
        <nav className="flex items-center gap-2">
          <Link
            className="hidden min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:inline-flex"
            href={ROUTES.signup}
          >
            Create account
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg bg-[#071b45] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
            href={ROUTES.login}
          >
            Login
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-6 md:grid-cols-[1fr_0.92fr] md:px-8 md:pb-20 md:pt-10">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
            RogerThat by Ben Oxford Hub
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-[#061636] md:text-7xl">
            Connect instantly.
            <span className="block text-blue-700">Understand effortlessly.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700 md:text-xl">
            A supervised communication space for teachers and parents, built
            around class reports, safe chats, and clear school oversight.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-14 items-center justify-center rounded-lg bg-blue-700 px-6 text-base font-bold text-white shadow-xl shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
              href={ROUTES.login}
            >
              Get Started
            </Link>
            <Link
              className="inline-flex min-h-14 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-base font-bold text-slate-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98]"
              href={ROUTES.signup}
            >
              Create account
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {valuePreviews.map((item) => (
              <div
                className="rounded-lg border border-white bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                key={item}
              >
                <p className="text-sm font-semibold leading-6 text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-white bg-[#071b45] p-4 shadow-2xl shadow-blue-950/20">
          <div className="grid h-full grid-cols-2 gap-3">
            <div className="relative overflow-hidden rounded-3xl">
              <Image
                alt="Parent using RogerThat"
                className="h-full w-full object-cover"
                fill
                priority
                sizes="(max-width: 768px) 50vw, 320px"
                src="/person-parent.png"
              />
            </div>
            <div className="grid gap-3">
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  alt="Teacher using RogerThat"
                  className="h-full w-full object-cover"
                  fill
                  priority
                  sizes="(max-width: 768px) 50vw, 320px"
                  src="/person-teacher.png"
                />
              </div>
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  alt="School director using RogerThat"
                  className="h-full w-full object-cover"
                  fill
                  priority
                  sizes="(max-width: 768px) 50vw, 320px"
                  src="/person-professional-woman.png"
                />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#071b45]/70 via-transparent to-white/10" />
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.title}
              notification={notification}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-5 pb-20 md:grid-cols-4 md:px-8">
        {entryOptions.map((option) => (
          <Link
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.99]"
            href={option.href}
            key={option.title}
          >
            <p className="text-base font-bold text-slate-950">
              {option.title}
            </p>
            <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">
              {option.description}
            </p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">
              {option.action} →
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
