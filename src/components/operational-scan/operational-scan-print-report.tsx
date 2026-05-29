import { buildScanDiagnosis } from "@/lib/operational-scan/build-scan-diagnosis"
import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"
import { formatCurrencyCad, formatSeverityLabel } from "@/lib/operational-scan/score"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"

function formatReportDate(d: Date): string {
  return d.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function OperationalScanPrintReport({
  result,
  answers,
  reportDate,
  fixes,
  visible = false,
}: {
  result: OperationalScanResult
  answers: OperationalScanAnswers
  reportDate: Date
  fixes: [string, string, string]
  visible?: boolean
}) {
  const business = answers.businessName.trim() || "Operation"
  const diagnosis = buildScanDiagnosis(result, answers)

  return (
    <div
      id="scan-print-report"
      className={
        visible
          ? "rounded-xl border border-white/[0.08] bg-[#fafafa] text-zinc-950 shadow-xl"
          : "hidden bg-[#fafafa] text-zinc-950 print:block print:bg-white print:text-black"
      }
      aria-hidden={visible ? undefined : true}
    >
      <div className="mx-auto max-w-[210mm] px-10 py-12 print:max-w-none print:px-0 print:py-0">
        <header className="border-b border-zinc-300 pb-6 print:border-zinc-900/20">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Rivet · owner dependency report
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{business}</h1>
          <p className="mt-2 font-mono text-[11px] text-zinc-600">{formatReportDate(reportDate)}</p>
        </header>

        <section className="mt-8 border border-zinc-200 bg-white p-6">
          <p className="text-[14px] leading-relaxed text-zinc-700">{diagnosis.ownerDependencyNarrative}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-b border-zinc-100 pb-6 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Owner-free capacity
              </p>
              <p className="mt-1.5 text-2xl font-semibold">{diagnosis.ownerFreeCapacityLabel}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Operational risk
              </p>
              <p className="mt-1.5 text-lg font-semibold">{formatSeverityLabel(result.severity)}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Hours trapped / year
              </p>
              <p className="mt-1.5 text-lg font-semibold tabular-nums">~{diagnosis.impact.hoursTrappedAnnually}h</p>
            </div>
          </div>

          <p className="mt-4 text-[12px] font-medium text-zinc-700">
            ~{diagnosis.impact.interruptionsPerWeek} owner pulls/week ·{" "}
            {formatCurrencyCad(diagnosis.impact.estimatedDollarValue)} equivalent annually · ~
            {diagnosis.impact.interruptionsPreventedAnnually} interruptions preventable if fixes ship.
          </p>

          {diagnosis.whyRivetBelieves.length > 0 ? (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Why Rivet believes this
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-zinc-700">
                {diagnosis.whyRivetBelieves.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {diagnosis.fastestPath ? (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Fastest path
              </p>
              <p className="mt-2 text-[13px] font-semibold text-zinc-900">{diagnosis.fastestPath.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-zinc-700">{diagnosis.fastestPath.action}</p>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              {SCAN_RESULTS.fixesHeading}
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[12px] leading-relaxed text-zinc-700">
              {fixes.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </section>

        <p className="mt-10 border-t border-zinc-200 pt-6 text-center text-[13px] font-semibold text-zinc-900">
          {SCAN_RESULTS.primaryCta}
        </p>
      </div>
    </div>
  )
}
