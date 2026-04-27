import { ROUTES } from "@/lib/routes";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-slate-950">
        <Image
          alt="RogerThat by Ben Oxford Hub mobile landing page"
          className="absolute inset-0 h-full w-full object-cover"
          fill
          priority
          sizes="100vw"
          src="/rogerthat-landing-reference.png"
        />

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
    </main>
  );
}
