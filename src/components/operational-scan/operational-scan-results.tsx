import Link from "next/link"
import { ArrowRight, Printer } from "lucide-react"

import { EscapeReadinessPanel } from "@/components/escape-readiness/escape-readiness-panel"
import { OperationalScanPrintReport } from "@/components/operational-scan/operational-scan-print-report"
import { computeEscapeReadinessFromScan } from "@/lib/escape-readiness/compute-from-scan"
import { Button } from "@/components/ui/button"
import {
  type OperationalScanAnswers,
  type OperationalScanResult,
  formatCurrencyCad,
  severityStyles,
} from "@/lib/operational-scan/score"
import { cn } from "@/lib/utils"

const landingMax = "mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8"

function DependencyScoreHero({ result }: { result: OperationalScanResult }) {
  const styles = severityStyles(result.severity)
  const pct = result.ownerDependencyScore / 100
  const r = 52
  const c = 2 * Math.PI * r
  const dash = c * pct

  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative aspect-square w-[min(20rem,88vw)] max-w-[20rem]" role="img" aria-label={`Owner Dependency Score ${result.ownerDependencyScore} out of 100`}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="4" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            className={styles.ring}
            strokeWidth="4"
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${c - dash + 0.001}`}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Owner Dependency Score
          </p>
          <p className={cn("mt-2 text-[clamp(3.5rem,12vw,4.5rem)] font-semibold tabular-nums leading-none tracking-[-0.05em]", styles.score)}>
            {result.ownerDependencyScore}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">0–100 · higher = more load on you</p>
        </div>
      </div>
      <p
        className={cn(
          "mt-6 inline-flex rounded-md border px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em]",
          styles.badge
        )}
      >
        Severity · {result.severity}
      </p>
    </div>
  )
}

function CostStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-white/[0.08] bg-black/35 px-4 py-4 sm:px-5 sm:py-5">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">{value}</p>
      {sub ? <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">{sub}</p> : null}
    </div>
  )
}

export function OperationalScanResults({
  result,
  answers,
  reportDate,
  submissionSaved = false,
  onRunAgain,
}: {
  result: OperationalScanResult
  answers: OperationalScanAnswers
  reportDate: Date
  submissionSaved?: boolean
  onRunAgain: () => void
}) {
  const escapeReadiness = computeEscapeReadinessFromScan(answers)

  const refLine = [
    answers.businessName.trim() || "Unnamed operation",
    answers.industry,
    reportDate.toISOString().slice(0, 10),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <div className="border border-rose-500/15 bg-zinc-950/90 print:hidden">
        <div className="pointer-events-none border-b border-white/[0.06] bg-gradient-to-b from-rose-950/20 to-transparent px-4 py-5 sm:px-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-400/80">
            Owner dependency report
          </p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-zinc-600">{refLine}</p>
        </div>

        {submissionSaved ? (
          <div className="border-b border-emerald-500/15 bg-emerald-950/20 px-4 py-3 sm:px-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500/90">
              Report saved
            </p>
            <p className="mt-1 text-[12px] leading-snug text-zinc-400">Your answers are on file—we will follow up from Rivet.</p>
          </div>
        ) : null}

        <div className={cn(landingMax, "py-10 sm:py-14")}>
          <p className="max-w-[52ch] text-center text-[15px] leading-relaxed text-zinc-400 sm:mx-auto sm:text-base">
            If nothing changes, this is the tax you pay for being the default answer—every week, every month.
          </p>

          <div className="mt-10 flex justify-center">
            <DependencyScoreHero result={result} />
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            <CostStat
              label="Est. owner interruptions / month"
              value={`~${result.estimatedInterruptionsPerMonth}`}
              sub="Texts, approvals, judgment calls, repeats."
            />
            <CostStat
              label="Est. owner hours lost / month"
              value={`~${result.estimatedOwnerHoursLostPerMonth}h`}
              sub="Reactive time + rework from tribal knowledge."
            />
            <CostStat
              label="Est. annual cost"
              value={formatCurrencyCad(result.estimatedAnnualCost)}
              sub="Owner-equivalent hourly rate × hours × 12."
            />
          </div>

          <p className="mt-8 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-center text-[13px] font-medium leading-relaxed text-amber-100/90 sm:text-sm">
            Most owners underestimate this by 2–3×.
          </p>

          <div className="mt-12 [&_section]:border-white/10 [&_section]:bg-zinc-900/60 [&_h2]:text-white [&_.text-foreground]:text-zinc-100 [&_.text-muted-foreground]:text-zinc-400">
            <EscapeReadinessPanel model={escapeReadiness} compact />
          </div>

          <div className="mt-12 border-t border-white/[0.06] pt-10">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">What is driving this</p>
            <ul className="mt-5 space-y-4" aria-label="Pain drivers">
              {result.painDrivers.map((line, i) => (
                <li
                  key={`pain-${i}`}
                  className="border-l-2 border-rose-500/35 pl-4 text-[14px] leading-relaxed text-zinc-300"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 flex flex-col items-stretch gap-3 border-t border-white/[0.06] pt-10 sm:flex-row sm:items-center sm:justify-center">
            <Button
              size="lg"
              className="h-12 w-full rounded-md bg-white px-8 text-[14px] font-semibold text-zinc-950 shadow-lg shadow-white/5 hover:bg-zinc-100 sm:w-auto sm:min-w-[16rem]"
              nativeButton={false}
              render={<Link href="/signup?from=scan" />}
            >
              Install Rivet — $799 once
              <ArrowRight className="size-4 opacity-60" data-icon="inline-end" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-md border-white/15 bg-transparent text-[13px] font-medium text-zinc-200 hover:bg-white/[0.06] sm:w-auto"
              onClick={() => window.print()}
            >
              <Printer className="size-3.5 opacity-70" data-icon="inline-start" />
              Print report
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 text-zinc-500 hover:text-zinc-200 sm:ml-2"
              onClick={onRunAgain}
            >
              Run again
            </Button>
          </div>

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
            Directional model from your answers · not tax or legal advice
          </p>
        </div>
      </div>

      <OperationalScanPrintReport result={result} answers={answers} reportDate={reportDate} />
    </>
  )
}
