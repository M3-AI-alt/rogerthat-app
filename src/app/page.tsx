import { ROUTES } from "@/lib/routes";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

const notifications = [
  {
    title: "Report Sent",
    time: "9:30 AM",
    icon: "↗",
    color: "bg-emerald-100 text-emerald-600",
    className: "left-[5%] top-[28%] md:left-[40%] md:top-[20%]",
    delay: "animation-delay-0",
  },
  {
    title: "Parent Read",
    time: "10:15 AM",
    icon: "✉",
    color: "bg-violet-100 text-violet-600",
    className: "right-[4%] top-[42%] md:right-[5%] md:top-[44%]",
    delay: "animation-delay-200",
  },
  {
    title: "Feedback Delivered",
    time: "11:45 AM",
    icon: "★",
    color: "bg-amber-100 text-amber-500",
    className: "left-[9%] top-[58%] md:left-[43%] md:top-[82%]",
    delay: "animation-delay-400",
  },
] as const;

const people = [
  {
    alt: "Asian mother reading a school report on her phone",
    src: "/person-asian-mother.png",
  },
  {
    alt: "Young professional woman reading a message on her phone",
    src: "/person-professional-woman.png",
  },
  {
    alt: "Teacher smiling while using a smartphone",
    src: "/person-teacher.png",
  },
  {
    alt: "Parent smiling while reading school messages",
    src: "/person-parent.png",
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

const featureItems = [
  {
    title: "Instant Messaging",
    icon: "↯",
    color: "bg-violet-100 text-violet-600",
  },
  {
    title: "Secure & Private",
    icon: "♢",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Stronger Connections",
    icon: "●",
    color: "bg-blue-100 text-blue-600",
  },
] as const;

function BrandLockup(): ReactElement {
  return (
    <Link className="flex items-center gap-4" href="/">
      <Image
        alt="Ben Oxford Hub logo"
        className="h-20 w-20 rounded-full object-contain md:h-28 md:w-28"
        height={112}
        priority
        src="/ben-oxford-logo.png"
        width={112}
      />
      <span>
        <span className="block text-4xl font-bold leading-none tracking-normal text-[#071b45] md:text-5xl">
          RogerThat
        </span>
        <span className="mt-2 block text-lg font-medium text-[#14285c] md:text-xl">
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
  return (
    <div
      className={`absolute z-20 flex animate-float-card items-center gap-3 rounded-3xl bg-white/95 p-4 text-slate-950 shadow-2xl shadow-slate-900/10 backdrop-blur ${notification.className} ${notification.delay}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${notification.color}`}
      >
        {notification.icon}
      </div>
      <div>
        <p className="text-base font-bold leading-5">{notification.title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {notification.time}
        </p>
      </div>
      <div className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        ✓
      </div>
    </div>
  );
}

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen bg-white pb-28 text-[#071126] md:pb-0">
      <section className="mx-auto hidden min-h-screen w-full max-w-[1536px] px-10 py-10 md:block">
        <nav className="flex items-center justify-between">
          <BrandLockup />
          <div className="flex items-center gap-12 text-xl font-medium text-[#071126]">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#resources">Resources⌄</a>
          </div>
          <Link
            className="rounded-2xl border border-slate-200 px-9 py-5 text-xl font-medium shadow-sm"
            href={ROUTES.login}
          >
            Login
          </Link>
        </nav>

        <div className="grid grid-cols-[0.9fr_1.1fr] gap-14 pt-10">
          <section className="pt-16">
            <h1 className="max-w-[590px] text-8xl font-extrabold leading-[1.05] tracking-normal">
              Connect instantly.
              <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Understand
              </span>
              effortlessly.
            </h1>
            <p className="mt-8 max-w-xl text-3xl leading-[1.35] text-slate-500">
              Seamless communication between teachers and parents
            </p>

            <div className="mt-10 grid grid-cols-3 gap-8">
              {featureItems.map((feature) => (
                <div className="flex items-center gap-4" key={feature.title}>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold ${feature.color}`}
                  >
                    {feature.icon}
                  </div>
                  <p className="text-lg font-medium leading-6">{feature.title}</p>
                </div>
              ))}
            </div>

            <Link
              className="mt-12 inline-flex min-h-16 items-center justify-center rounded-2xl bg-blue-600 px-20 text-2xl font-semibold text-white shadow-xl shadow-blue-600/25"
              href={ROUTES.login}
            >
              Get Started <span className="ml-3">→</span>
            </Link>

            <div className="mt-9 flex items-center gap-6 text-lg text-slate-500">
              <div className="flex -space-x-3">
                {people.map((person) => (
                  <Image
                    alt={person.alt}
                    className="h-11 w-11 rounded-full border-2 border-white object-cover"
                    height={44}
                    key={person.src}
                    src={person.src}
                    width={44}
                  />
                ))}
              </div>
              <p>
                Trusted by 10,000+ schools
                <span className="block">and families</span>
              </p>
            </div>
          </section>

          <section className="relative grid grid-cols-2 gap-4">
            {people.map((person) => (
              <div
                className="relative min-h-[400px] overflow-hidden rounded-2xl bg-slate-100 shadow-sm"
                key={person.src}
              >
                <Image
                  alt={person.alt}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  src={person.src}
                />
              </div>
            ))}
            {/* Later: convert these CSS animated cards to Framer Motion and
                stagger them with sequence timing for report, read, feedback. */}
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.title}
                notification={notification}
              />
            ))}
          </section>
        </div>
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

          {/* Later: replace CSS animation with Framer Motion staggered cards. */}
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
