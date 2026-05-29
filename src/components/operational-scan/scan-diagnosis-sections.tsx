import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import type {
  ScanDiagnosticCard,
  ScanDiagnosticSeverity,
  ScanDiagnosisView,
  ScanHoursLeakage,
  ScanRecommendation,
} from "@/lib/operational-scan/build-scan-diagnosis"
import {
  formatScanDiagnosisHeadline,
} from "@/lib/operational-scan/build-scan-diagnosis"
import {
  formatCurrencyCad,
  type OperationalScanResult,
} from "@/lib/operational-scan/score"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{children}</p>
  )
}

function severityBadgeClass(severity: ScanDiagnosticSeverity): string {
  switch (severity) {
    case "critical":
      return "border-rose-500/40 bg-rose-500/10 text-rose-100"
    case "high":
      return "border-orange-500/35 bg-orange-500/10 text-orange-100"
    case "moderate":
      return "border-amber-500/35 bg-amber-500/10 text-amber-100"
    default:
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
  }
}

function severityLabel(severity: ScanDiagnosticSeverity): string {
  switch (severity) {
    case "critical":
      return "Critical risk"
    case "high":
      return "High risk"
    case "moderate":
      return "Moderate risk"
    default:
      return "Lower risk"
  }
}

export function ScanOperationalSummary({
  result,
  diagnosis,
}: {
  result: OperationalScanResult
  diagnosis: ScanDiagnosisView
}) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-5 py-7 sm:px-7 sm:py-8">
      <SectionEyebrow>Operational diagnosis</SectionEyebrow>
      <h2 className="mt-4 text-balance text-[clamp(1.25rem,4vw,1.75rem)] font-semibold leading-snug tracking-tight text-white">
        {formatScanDiagnosisHeadline(result)}
      </h2>
      <p className="mt-3 max-w-xl text-pretty text-[14px] leading-relaxed text-zinc-400">
        {diagnosis.ownerDependencyNarrative}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 sm:col-span-2">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-200/70">
            Estimated owner-free capacity
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {diagnosis.ownerFreeCapacityLabel}
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-zinc-500">
            How long the operation could likely hold before strain without you on the floor
          </p>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-black/35 px-4 py-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Operational risk
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-100">{diagnosis.operationalRiskLabel}</p>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-black/35 px-4 py-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Owner pulls / week
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-white">
            ~{diagnosis.impact.interruptionsPerWeek}
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200/70">
            Owner hours trapped annually
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-amber-50">
            ~{diagnosis.impact.hoursTrappedAnnually}h
          </p>
          <p className="mt-1 text-[11px] text-amber-100/55">
            ≈ {formatCurrencyCad(diagnosis.impact.estimatedDollarValue)} at owner-equivalent rate
          </p>
        </div>

        <div className="rounded-lg border border-sky-500/25 bg-sky-500/[0.06] px-4 py-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-200/70">
            Interruptions preventable / year
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-sky-50">
            ~{diagnosis.impact.interruptionsPreventedAnnually}
          </p>
          <p className="mt-1 text-[11px] text-sky-100/55">If you ship the fastest-path fixes below</p>
        </div>
      </div>
    </section>
  )
}

export function ScanBiggestRisksSection({ risks }: { risks: string[] }) {
  if (risks.length === 0) return null

  return (
    <section className="mt-12">
      <SectionEyebrow>Operational risk</SectionEyebrow>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
        {SCAN_RESULTS.biggestRisksHeading}
      </h3>
      <ul className="mt-5 space-y-3">
        {risks.map((risk, i) => (
          <li
            key={risk}
            className="flex gap-4 rounded-xl border border-white/[0.08] bg-black/30 px-5 py-4"
          >
            <span className="font-mono text-[11px] font-semibold tabular-nums text-rose-400/80">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[15px] font-medium leading-snug text-zinc-100">{risk}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ScanWhyRivetBelievesSection({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null

  return (
    <section className="mt-12 border-t border-white/[0.08] pt-10">
      <SectionEyebrow>Why Rivet believes this</SectionEyebrow>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
        {SCAN_RESULTS.whyBelievesHeading}
      </h3>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-zinc-500">
        {SCAN_RESULTS.whyBelievesSubtext}
      </p>
      <ul className="mt-6 space-y-3">
        {lines.map((line) => (
          <li
            key={line}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[14px] leading-relaxed text-zinc-300"
          >
            {line}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ScanFastestPathSection({ path }: { path: ScanRecommendation | null }) {
  if (!path) return null

  return (
    <section className="mt-12 border-t border-white/[0.08] pt-10">
      <SectionEyebrow>Fastest path to improvement</SectionEyebrow>
      <article className="mt-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-6 sm:px-6">
        <h3 className="text-lg font-semibold tracking-tight text-white">{path.title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">{path.action}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-md border border-white/[0.08] bg-black/30 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
            Effort · {path.estimatedEffort}
          </span>
          <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-200/90">
            {path.expectedInterruptionReduction}
          </span>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-zinc-400">
            {path.expectedReadinessGain}
          </span>
        </div>
      </article>
    </section>
  )
}

export function ScanFailurePointsSection({ cards }: { cards: ScanDiagnosticCard[] }) {
  if (cards.length === 0) return null

  return (
    <section className="mt-12 border-t border-white/[0.08] pt-10">
      <SectionEyebrow>Likely failure points</SectionEyebrow>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
        {SCAN_RESULTS.failurePointsHeading}
      </h3>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-zinc-500">
        {SCAN_RESULTS.failurePointsSubtext}
      </p>

      <div className="mt-6 space-y-4">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-xl border border-white/[0.08] bg-black/30 px-5 py-5 sm:px-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h4 className="text-[15px] font-semibold tracking-tight text-zinc-100">{card.title}</h4>
              <span
                className={cn(
                  "inline-flex rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
                  severityBadgeClass(card.severity)
                )}
              >
                {severityLabel(card.severity)}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  What we see
                </dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-zinc-300">{card.currentState}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  If nothing changes
                </dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-zinc-300">{card.likelyConsequence}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  Business impact
                </dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-zinc-300">{card.businessImpact}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ScanRecommendationsSection({ recommendations }: { recommendations: ScanRecommendation[] }) {
  if (recommendations.length <= 1) return null

  return (
    <section className="mt-12 border-t border-white/[0.08] pt-10">
      <SectionEyebrow>Full improvement path</SectionEyebrow>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
        {SCAN_RESULTS.fixesHeading}
      </h3>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-zinc-500">
        Next priorities after the fastest path—not everything at once.
      </p>

      <ol className="mt-6 list-none space-y-4 p-0">
        {recommendations.slice(1).map((rec) => (
          <li
            key={rec.id}
            className="rounded-xl border border-white/[0.08] bg-black/30 px-5 py-5 sm:px-6"
          >
            <div className="flex gap-4">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[11px] font-semibold text-zinc-400">
                {rec.priority}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-semibold tracking-tight text-white">{rec.title}</h4>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">{rec.action}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-zinc-400">
                    {rec.estimatedEffort}
                  </span>
                  <span className="rounded-md border border-sky-500/20 bg-sky-500/[0.06] px-2.5 py-1 font-mono text-[10px] text-sky-200/90">
                    {rec.expectedInterruptionReduction}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ScanHoursLeakageSection({ leakage }: { leakage: ScanHoursLeakage }) {
  return (
    <section className="mt-12 border-t border-white/[0.08] pt-10">
      <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-[13px] font-medium leading-relaxed text-amber-100/90">
        {SCAN_RESULTS.underestimate} Roughly{" "}
        <span className="tabular-nums font-semibold text-amber-50">~{leakage.interruptionsPerWeek}</span>{" "}
        owner pulls per week at ~{leakage.minutesPerInterruption} minutes each—about{" "}
        <span className="tabular-nums font-semibold text-amber-50">~{leakage.hoursPerYear}h</span> per year on you.
      </p>
    </section>
  )
}

/** @deprecated Use ScanOperationalSummary */
export function ScanDiagnosisHero({
  result,
  diagnosis,
}: {
  result: OperationalScanResult
  confidenceScore?: number
  diagnosis?: ScanDiagnosisView
}) {
  if (!diagnosis) return null
  return <ScanOperationalSummary result={result} diagnosis={diagnosis} />
}

/** @deprecated Use ScanFailurePointsSection */
export function ScanDiagnosticCardsSection({ cards }: { cards: ScanDiagnosticCard[] }) {
  return <ScanFailurePointsSection cards={cards} />
}
