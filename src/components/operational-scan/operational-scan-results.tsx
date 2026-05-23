import Link from "next/link"
import { ArrowRight, Mail, Printer } from "lucide-react"

import { EscapeReadinessPanel } from "@/components/escape-readiness/escape-readiness-panel"
import { OperationalScanPrintReport } from "@/components/operational-scan/operational-scan-print-report"
import { computeEscapeReadinessFromScan } from "@/lib/escape-readiness/compute-from-scan"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"
import { recommendedFirstFixes } from "@/lib/operational-scan/recommended-next-steps"
import { Button } from "@/components/ui/button"
import {
  type OperationalScanAnswers,
  type OperationalScanResult,
  formatCurrencyCad,
  formatSeverityLabel,
  severityStyles,
} from "@/lib/operational-scan/score"
import { cn } from "@/lib/utils"

const container = "mx-auto w-full max-w-2xl px-4 sm:px-6"

function DependencyScoreHero({ result }: { result: OperationalScanResult }) {
  const styles = severityStyles(result.severity)
  const pct = result.ownerDependencyScore / 100
  const r = 52
  const c = 2 * Math.PI * r
  const dash = c * pct

  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className="relative aspect-square w-[min(18rem,82vw)] max-w-[18rem]"
        role="img"
        aria-label={`Owner Dependency Score ${result.ownerDependencyScore} out of 100`}
      >
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
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Owner Dependency Score
          </p>
          <p
            className={cn(
              "mt-2 text-[clamp(3.25rem,11vw,4.25rem)] font-semibold tabular-nums leading-none tracking-[-0.05em]",
              styles.score
            )}
          >
            {result.ownerDependencyScore}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            0–100 · higher = more depends on you
          </p>
        </div>
      </div>
      <p
        className={cn(
          "mt-6 inline-flex rounded-md border px-4 py-1.5 text-[12px] font-semibold tracking-tight",
          styles.badge
        )}
      >
        Severity · {formatSeverityLabel(result.severity)}
      </p>
    </div>
  )
}

function CostStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/40 px-4 py-4">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">{sub}</p> : null}
    </div>
  )
}

function buildEmailScanBody(answers: OperationalScanAnswers, result: OperationalScanResult): string {
  const biz = answers.businessName.trim() || "My business"
  return [
    `Rivet Scan — ${biz}`,
    ``,
    `Owner Dependency Score: ${result.ownerDependencyScore}/100`,
    `Severity: ${formatSeverityLabel(result.severity)}`,
    `Est. owner interruptions / month: ~${result.estimatedInterruptionsPerMonth}`,
    `Est. owner hours lost / month: ~${result.estimatedOwnerHoursLostPerMonth}h`,
    `Est. annual cost: ${formatCurrencyCad(result.estimatedAnnualCost)}`,
    ``,
    `View full report: ${typeof window !== "undefined" ? window.location.href : "https://rivet-tan.vercel.app/scan"}`,
  ].join("\n")
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
  const fixes = recommendedFirstFixes(result, answers)
  const escapeReadiness = computeEscapeReadinessFromScan(answers)
  const styles = severityStyles(result.severity)
  const email = answers.email.trim()

  const refLine = [
    answers.businessName.trim() || "Unnamed operation",
    answers.industry,
    reportDate.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }),
  ]
    .filter(Boolean)
    .join(" · ")

  const mailtoHref =
    email.length > 0
      ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Rivet Scan — ${answers.businessName.trim() || "Owner dependency"}`)}&body=${encodeURIComponent(buildEmailScanBody(answers, result))}`
      : undefined

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

        {submissionSaved && email ? (
          <div className="border-b border-emerald-500/15 bg-emerald-950/25 px-4 py-3 sm:px-6">
            <p className="text-[12px] text-zinc-400">
              <span className="font-medium text-emerald-400/90">{SCAN_RESULTS.emailedNote}</span> {email}
            </p>
          </div>
        ) : null}

        <div className={cn(container, "py-10 sm:py-12")}>
          <p className="text-center text-[15px] leading-relaxed text-zinc-400 sm:text-base">{SCAN_RESULTS.hook}</p>

          <div className="mt-10 flex justify-center">
            <DependencyScoreHero result={result} />
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <CostStat
              label="Est. owner interruptions / month"
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

          <div className="mt-12 space-y-3 border-t border-white/[0.08] pt-10">
            <Button
              size="lg"
              className="h-12 w-full rounded-md bg-white text-[14px] font-semibold text-zinc-950 hover:bg-zinc-100"
              nativeButton={false}
              render={<Link href="/signup?from=scan" />}
            >
              {SCAN_RESULTS.primaryCta}
              <ArrowRight className="size-4 opacity-60" data-icon="inline-end" />
            </Button>
            {mailtoHref ? (
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-md border-white/18 bg-transparent text-[14px] font-medium text-zinc-100 hover:bg-white/[0.06]"
                nativeButton={false}
                render={<a href={mailtoHref} />}
              >
                <Mail className="size-4 opacity-70" data-icon="inline-start" />
                {SCAN_RESULTS.secondaryCta}
              </Button>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="h-9 text-[12px] text-zinc-500 hover:text-zinc-200"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5 opacity-70" data-icon="inline-start" />
                Print report
              </Button>
              <Button type="button" variant="ghost" className="h-9 text-[12px] text-zinc-500 hover:text-zinc-200" onClick={onRunAgain}>
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
