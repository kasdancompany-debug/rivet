"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Printer } from "lucide-react"

import { OperationalScanPrintReport } from "@/components/operational-scan/operational-scan-print-report"
import { ScanDiagnosisReveal } from "@/components/operational-scan/scan-score-reveal"
import {
  ScanBiggestRisksSection,
  ScanFailurePointsSection,
  ScanFastestPathSection,
  ScanHoursLeakageSection,
  ScanOperationalSummary,
  ScanRecommendationsSection,
  ScanWhyRivetBelievesSection,
} from "@/components/operational-scan/scan-diagnosis-sections"
import { ScanScoringExplanationSection } from "@/components/operational-scan/scan-scoring-explanation-section"
import {
  SaveScanReportCard,
  type SaveScanReportFields,
} from "@/components/operational-scan/save-scan-report-card"
import { buildScanDiagnosis } from "@/lib/operational-scan/build-scan-diagnosis"
import { buildScanScoringExplanation } from "@/lib/operational-scan/build-scoring-explanation"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"
import { recommendedFirstFixes } from "@/lib/operational-scan/recommended-next-steps"
import { Button } from "@/components/ui/button"
import {
  type OperationalScanAnswers,
  type OperationalScanResult,
} from "@/lib/operational-scan/score"
import { cn } from "@/lib/utils"

const container = "mx-auto w-full max-w-2xl px-4 sm:px-6"

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
  const diagnosis = buildScanDiagnosis(result, answers)
  const scoringExplanation = buildScanScoringExplanation(result)
  const fixes = recommendedFirstFixes(result, answers)
  const refLine = buildRefLine(answers, reportDate)
  const [reportUnlocked, setReportUnlocked] = useState(false)

  if (!reportUnlocked) {
    return (
      <>
        <div className="print:hidden">
          <ScanDiagnosisReveal
            result={result}
            diagnosis={diagnosis}
            industry={refLine}
            onContinue={() => setReportUnlocked(true)}
          />
        </div>
        <OperationalScanPrintReport result={result} answers={answers} reportDate={reportDate} fixes={fixes} />
      </>
    )
  }

  return (
    <>
      <div className="print:hidden">
        <div className="pointer-events-none border-b border-white/[0.06] bg-gradient-to-b from-rose-950/20 to-transparent px-4 py-5 sm:px-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400/80">
            {SCAN_RESULTS.fullReportEyebrow}
          </p>
          <p className="mt-2 font-mono text-[11px] text-zinc-600">{refLine}</p>
        </div>

        <div className={cn(container, "py-10 sm:py-12")}>
          <p className="text-center text-[15px] leading-relaxed text-zinc-400 sm:text-base">{SCAN_RESULTS.hook}</p>

          <div className="mt-10">
            <ScanOperationalSummary result={result} diagnosis={diagnosis} />
          </div>

          <ScanScoringExplanationSection explanation={scoringExplanation} />

          <ScanBiggestRisksSection risks={diagnosis.biggestRisks} />
          <ScanWhyRivetBelievesSection lines={diagnosis.whyRivetBelieves} />
          <ScanFastestPathSection path={diagnosis.fastestPath} />
          <ScanFailurePointsSection cards={diagnosis.diagnosticCards} />
          <ScanRecommendationsSection recommendations={diagnosis.recommendations} />
          <ScanHoursLeakageSection leakage={diagnosis.hoursLeakage} />

          <div id="save-scan-report" className="mt-14 scroll-mt-24 border-t border-white/[0.08] pt-10">
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

          <div className="mt-12 border-t border-white/[0.08] pt-10 text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              {SCAN_RESULTS.bottomCtaHeadline}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-zinc-400">
              {SCAN_RESULTS.bottomCtaSubtext}
            </p>
            <p className="mx-auto mt-2 text-[13px] font-medium text-zinc-300">
              {SCAN_RESULTS.bottomCtaPriceLine}
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
