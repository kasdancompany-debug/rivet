import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { EscapeReadinessPanel } from "@/components/escape-readiness/escape-readiness-panel"
import { LANDING_ESCAPE_READINESS_DEMO, LANDING_SCAN_CTA } from "@/lib/marketing-landing-copy"

export function LandingEscapeReadinessSection() {
  return (
    <section
      className="border-b border-zinc-200 bg-white py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="escape-readiness-landing-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Escape readiness</p>
        <h2
          id="escape-readiness-landing-heading"
          className="mt-3 max-w-[32ch] text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:max-w-none sm:text-[1.75rem] dark:text-white"
        >
          One score for a week away—not a gut feel
        </h2>
        <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          Rivet blends procedures, training coverage, critical owner dependencies, and staffing risk into an Escape
          Readiness Score. Higher means the business is more likely to hold if you disappear for seven days.
        </p>

        <div className="mt-8 [&_section]:border-zinc-200 [&_section]:bg-zinc-50/80 dark:[&_section]:border-zinc-800 dark:[&_section]:bg-zinc-900/40">
          <EscapeReadinessPanel model={LANDING_ESCAPE_READINESS_DEMO} />
        </div>

        <Link
          href="/scan?from=landing-escape"
          className="group mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-950 dark:text-white"
        >
          {LANDING_SCAN_CTA.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
