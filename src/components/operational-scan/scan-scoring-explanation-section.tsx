"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import type { ScanScoringExplanation } from "@/lib/operational-scan/build-scoring-explanation"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"
import { cn } from "@/lib/utils"

export function ScanScoringExplanationSection({
  explanation,
}: {
  explanation: ScanScoringExplanation
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-10 rounded-xl border border-white/[0.08] bg-black/30">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {SCAN_RESULTS.scoringEyebrow}
          </p>
          <p className="mt-1 text-[15px] font-semibold text-white">{SCAN_RESULTS.scoringTitle}</p>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 text-zinc-500 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-6 border-t border-white/[0.06] px-5 py-5">
          <p className="text-[13px] leading-relaxed text-zinc-400">{explanation.methodology}</p>
          <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-zinc-400">
            {explanation.formula}
          </p>

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
              {explanation.ownerDependencyScore}
            </span>
            <span className="text-sm text-zinc-500">/100 owner dependency</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
              {explanation.severityLabel} risk
            </span>
          </div>

          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              What moved your score
            </p>
            <ul className="mt-3 space-y-3">
              {explanation.factors.map((factor) => (
                <li
                  key={factor.key}
                  className="rounded-lg border border-white/[0.06] bg-black/25 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-100">{factor.label}</p>
                    <p className="text-sm font-semibold tabular-nums text-white">
                      +{factor.points}
                      {factor.weightPercent > 0 ? (
                        <span className="ml-1 text-[11px] font-normal text-zinc-500">
                          ({factor.weightPercent}% weight)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{factor.why}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Derived metrics
            </p>
            <ul className="mt-3 space-y-2">
              {explanation.derivedMetrics.map((metric) => (
                <li key={metric.label} className="rounded-lg border border-white/[0.06] px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-400">{metric.label}</p>
                    <p className="text-sm font-semibold text-zinc-100">{metric.value}</p>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{metric.explanation}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Limits of this model
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] leading-relaxed text-zinc-500">
              {explanation.caveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  )
}
