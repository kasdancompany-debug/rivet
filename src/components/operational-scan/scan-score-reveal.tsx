"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ScanDiagnosisView } from "@/lib/operational-scan/build-scan-diagnosis"
import {
  formatScanDiagnosisHeadline,
  formatScanDiagnosisSummary,
} from "@/lib/operational-scan/build-scan-diagnosis"
import {
  type OperationalScanResult,
  formatSeverityLabel,
  severityStyles,
} from "@/lib/operational-scan/score"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"
import { cn } from "@/lib/utils"

const REVEAL_MS = 1100

export function ScanDiagnosisReveal({
  result,
  diagnosis,
  industry,
  onContinue,
}: {
  result: OperationalScanResult
  diagnosis: ScanDiagnosisView
  industry?: string
  onContinue: () => void
}) {
  const styles = severityStyles(result.severity)
  const [visible, setVisible] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reducedMotion) {
      setVisible(true)
      setShowDetail(true)
      return
    }

    setVisible(false)
    setShowDetail(false)
    const t1 = window.setTimeout(() => setVisible(true), 80)
    const t2 = window.setTimeout(() => setShowDetail(true), REVEAL_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [result.severity])

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-xl px-4 py-12 text-center transition-opacity duration-700 sm:px-6 sm:py-16",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400/80">
        {SCAN_RESULTS.revealEyebrow}
      </p>

      <h2 className="mt-5 text-balance text-[clamp(1.5rem,5vw,2rem)] font-semibold leading-snug tracking-tight text-white">
        {formatScanDiagnosisHeadline(result)}
      </h2>

      {industry ? (
        <p className="mt-2 font-mono text-[11px] text-zinc-600">{industry}</p>
      ) : null}

      <p
        className={cn(
          "mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-zinc-400 transition-all duration-700",
          showDetail ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {diagnosis.ownerDependencyNarrative}
      </p>

      <div
        className={cn(
          "mt-10 grid gap-3 text-left transition-all duration-700 sm:grid-cols-2",
          showDetail ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        )}
      >
        <div className="rounded-xl border border-white/[0.1] bg-black/40 px-5 py-5 sm:col-span-2">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Estimated owner-free capacity
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {diagnosis.ownerFreeCapacityLabel}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
            {formatScanDiagnosisSummary(result)}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/35 px-4 py-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Operational risk
          </p>
          <p className={cn("mt-2 text-xl font-semibold tracking-tight", styles.score)}>
            {formatSeverityLabel(result.severity)}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/35 px-4 py-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Owner hours trapped / year
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-white">
            ~{diagnosis.impact.hoursTrappedAnnually}h
          </p>
        </div>
      </div>

      {diagnosis.biggestRisks.length > 0 ? (
        <div
          className={cn(
            "mt-8 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-5 py-4 text-left transition-all duration-700",
            showDetail ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-rose-300/70">
            Biggest risks Rivet flagged
          </p>
          <ul className="mt-3 space-y-2">
            {diagnosis.biggestRisks.map((risk) => (
              <li key={risk} className="text-[14px] font-medium leading-snug text-zinc-200">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="mt-10 h-12 w-full max-w-sm rounded-md bg-white text-[14px] font-semibold text-zinc-950 hover:bg-zinc-100 sm:w-auto sm:min-w-[16rem]"
        onClick={onContinue}
      >
        {SCAN_RESULTS.revealCta}
        <ArrowRight className="size-4 opacity-60" data-icon="inline-end" />
      </Button>

      <p className="mt-4 text-[12px] text-zinc-600">{SCAN_RESULTS.revealHint}</p>
    </div>
  )
}
