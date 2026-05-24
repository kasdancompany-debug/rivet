import Link from "next/link"
import { ArrowRight, Printer } from "lucide-react"

import { EscapeReadinessPanel } from "@/components/escape-readiness/escape-readiness-panel"
import { OperationalScanPrintReport } from "@/components/operational-scan/operational-scan-print-report"
import { ScanScoreReveal } from "@/components/operational-scan/scan-score-reveal"
import {
  SaveScanReportCard,
  type SaveScanReportFields,
} from "@/components/operational-scan/save-scan-report-card"
import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"
import { computeEscapeReadinessFromScan } from "@/lib/escape-readiness/compute-from-scan"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"
import { recommendedFirstFixes } from "@/lib/operational-scan/recommended-next-steps"
import { Button } from "@/components/ui/button"
import {
  type OperationalScanAnswers,
  type OperationalScanResult,
  formatCurrencyCad,
  severityStyles,
} from "@/lib/operational-scan/score"
import { cn } from "@/lib/utils"

const container = "mx-auto w-full max-w-2xl px-4 sm:px-6"

function CostStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/40 px-4 py-4">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">{sub}</p> : null}
    </div>
  )
}

function buildRefLine(answers: OperationalScanAnswers, reportDate: Date): string {
  return [
    answers.businessName.trim() || "Your operation",
    answers.industry,
    reportDate.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }),
  ]
    .filter(Boolean)
    .join(" · ")
}

export function OperationalScanResults({
  result,
  answers,
  reportDate,
  submissionSaved = false,
  submitError = null,
  reportUrl,
  onSaveReport,
  onResendReport,
  onRunAgain,
}: {
  result: OperationalScanResult
  answers: OperationalScanAnswers
  reportDate: Date
  submissionSaved?: boolean
  submitError?: string | null
  reportUrl?: string
  onSaveReport: (fields: SaveScanReportFields) => void | Promise<void>
  onResendReport?: () => void | Promise<void>
  onRunAgain: () => void
}) {
  const fixes = recommendedFirstFixes(result, answers)
  const escapeReadiness = computeEscapeReadinessFromScan(answers)
  const stepAwayDays = estimatedDaysFromScore(escapeReadiness.score ?? 0)
  const styles = severityStyles(result.severity)
  const refLine = buildRefLine(answers, reportDate)

  return (
    <>
      <div className="print:hidden">
        <div
          className={cn(
            "pointer-events-none border-b border-white/[0.06] bg-gradient-to-b px-4 py-6 sm:px-6",
            styles.glow,
            "to-transparent"
          )}
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400/80">
            Your dependency report
          </p>
          <p className="mt-2 font-mono text-[11px] text-zinc-600">{refLine}</p>
        </div>

        <div className={cn(container, "py-10 sm:py-12")}>
          <p className="text-center text-[15px] leading-relaxed text-zinc-400 sm:text-base">{SCAN_RESULTS.hook}</p>

          <div className="mt-10 flex justify-center">
            <ScanScoreReveal result={result} stepAwayDays={stepAwayDays} />
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <CostStat
              label="Est. routed back to you / month"
              value={`~${result.estimatedInterruptionsPerMonth}`}
              sub="Texts, calls, walk-ups, repeats."
            />
            <CostStat
              label="Est. owner hours lost / month"
              value={`~${result.estimatedOwnerHoursLostPerMonth}h`}
              sub="Reactive time + rework from tribal knowledge."
            />
            <CostStat
              label={SCAN_RESULTS.annualCostLabel}
              value={formatCurrencyCad(result.estimatedAnnualCost)}
              sub="Owner-equivalent rate × hours × 12."
            />
          </div>

          <p className="mt-8 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-center text-[13px] font-medium leading-relaxed text-amber-100/95">
            {SCAN_RESULTS.underestimate}
          </p>

          <div id="save-scan-report" className="mt-10 scroll-mt-24">
            <SaveScanReportCard
              initialBusinessName={answers.businessName}
              onSubmit={onSaveReport}
              onResend={onResendReport}
              saved={submissionSaved}
              savedEmail={answers.email.trim() || undefined}
              reportUrl={reportUrl}
              error={submitError}
            />
          </div>

          <div className="mt-12">
            <EscapeReadinessPanel model={escapeReadiness} compact dark />
          </div>

          <div className="mt-12 border-t border-white/[0.08] pt-10">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {SCAN_RESULTS.fixesHeading}
            </p>
            <ol className="mt-5 list-none space-y-4 p-0">
              {fixes.map((line, i) => (
                <li key={line} className="flex gap-3 text-[14px] leading-relaxed text-zinc-300">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 font-mono text-[11px] font-semibold text-rose-200/90">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 border-t border-white/[0.08] pt-10 text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              {SCAN_RESULTS.bottomCtaHeadline}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-zinc-400">
              {SCAN_RESULTS.bottomCtaSubtext}
            </p>

            <div className="mx-auto mt-8 max-w-md space-y-3">
              <Button
                size="lg"
                className="h-12 w-full rounded-md bg-white text-[14px] font-semibold text-zinc-950 hover:bg-zinc-100"
                nativeButton={false}
                render={<Link href="/signup?from=scan" />}
              >
                {SCAN_RESULTS.primaryCta}
                <ArrowRight className="size-4 opacity-60" data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-md border-white/18 bg-transparent text-[14px] font-medium text-zinc-100 hover:bg-white/[0.06]"
                nativeButton={false}
                render={<a href="#save-scan-report" />}
              >
                {SCAN_RESULTS.secondaryCta}
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button
                type="button"
                variant="ghost"
                className="h-9 text-[12px] text-zinc-500 hover:text-zinc-200"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5 opacity-70" data-icon="inline-start" />
                Print report
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 text-[12px] text-zinc-500 hover:text-zinc-200"
                onClick={onRunAgain}
              >
                Run again
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600">
            {SCAN_RESULTS.disclaimer}
          </p>
        </div>
      </div>

      <OperationalScanPrintReport result={result} answers={answers} reportDate={reportDate} fixes={fixes} />
    </>
  )
}
