import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"
import { formatCurrencyCad } from "@/lib/operational-scan/score"
import { recommendedNextSteps } from "@/lib/operational-scan/recommended-next-steps"

const PRINT_CTA = "Install Rivet — $799 once"

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
}: {
  result: OperationalScanResult
  answers: OperationalScanAnswers
  reportDate: Date
}) {
  const business = answers.businessName.trim() || "Operation"
  const steps = recommendedNextSteps(result, answers)

  return (
    <div
      id="scan-print-report"
      className="hidden bg-[#fafafa] text-zinc-950 print:block print:bg-white print:text-black"
      aria-hidden
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
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-zinc-200 pb-6">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Owner Dependency Score
              </p>
              <p className="mt-1 text-5xl font-semibold tabular-nums tracking-[-0.04em]">{result.ownerDependencyScore}</p>
              <p className="mt-1 font-mono text-[10px] text-zinc-500">0–100 · higher = more load on you</p>
            </div>
            <div className="border-l border-zinc-200 pl-6">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Severity</p>
              <p className="mt-2 text-xl font-semibold">{result.severity}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-b border-zinc-100 pb-6">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Est. interrupts / month
              </p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums">~{result.estimatedInterruptionsPerMonth}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Est. hours lost / month
              </p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums">~{result.estimatedOwnerHoursLostPerMonth}h</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Est. annual cost</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums">{formatCurrencyCad(result.estimatedAnnualCost)}</p>
            </div>
          </div>

          <p className="mt-4 text-[12px] font-medium text-zinc-700">Most owners underestimate this by 2–3×.</p>

          <div className="mt-6">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Drivers</p>
            <ul className="mt-3 list-none space-y-2.5 p-0">
              {result.painDrivers.map((line, i) => (
                <li key={i} className="text-[12px] leading-relaxed text-zinc-700">
                  — {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Next steps</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[12px] leading-relaxed text-zinc-700">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>

        <p className="mt-10 border-t border-zinc-200 pt-6 text-center text-[13px] font-semibold text-zinc-900">{PRINT_CTA}</p>
      </div>
    </div>
  )
}
