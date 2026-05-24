import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EscapeReadinessHero } from "@/components/escape-readiness/escape-readiness-hero";
import {
  LANDING_CTA,
  LANDING_ESCAPE_PAYOFF,
  LANDING_ESCAPE_READINESS_DEMO,
} from "@/lib/marketing-landing-copy";

export function LandingEscapeReadinessSection() {
  const { eyebrow, title, hook } = LANDING_ESCAPE_PAYOFF;

  return (
    <section
      className="relative border-b border-zinc-800 bg-zinc-950 py-12 text-zinc-100 sm:py-16"
      aria-labelledby="escape-readiness-landing-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="escape-readiness-landing-heading"
          className="mt-4 max-w-[20ch] text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-4xl lg:text-[2.75rem]"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-[42ch] text-base text-zinc-400 sm:text-lg">
          {hook}
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 ring-1 ring-white/[0.04]">
          <EscapeReadinessHero model={LANDING_ESCAPE_READINESS_DEMO} dark />
        </div>

        <Link
          href="/scan?from=landing-escape"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          {LANDING_CTA.secondary}
          <ArrowRight className="size-3.5 opacity-50" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
