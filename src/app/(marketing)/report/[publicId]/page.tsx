import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { HostedScanReportActions } from "@/components/operational-scan/hosted-scan-report-actions"
import { OperationalScanPrintReport } from "@/components/operational-scan/operational-scan-print-report"
import { Button } from "@/components/ui/button"
import { getScanReportByPublicId } from "@/lib/operational-scan/scan-report-service"
import { SCAN_RESULTS } from "@/lib/operational-scan/scan-copy"

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params
  const report = await getScanReportByPublicId(publicId)
  if (!report) return { title: "Report not found · Rivet" }

  const business =
    report.payload.answers.businessName.trim() ||
    `${report.payload.answers.firstName.trim()}'s business`

  return {
    title: `${business} · Owner Dependency Report · Rivet`,
    description: `Owner Dependency Score ${report.payload.result.ownerDependencyScore}/100`,
  }
}

export default async function HostedScanReportPage({
  params,
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = await params
  const report = await getScanReportByPublicId(publicId)
  if (!report) notFound()

  const { payload } = report
  const reportDate = new Date(payload.generatedAt)

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/[0.08] bg-zinc-950/90 print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-white">
            Rivet
          </Link>
          <Button
            size="sm"
            className="h-9 rounded-md bg-white text-zinc-950 hover:bg-zinc-100"
            nativeButton={false}
            render={<Link href="/signup?from=scan-report" />}
          >
            Install Rivet
            <ArrowRight className="size-3.5 opacity-60" data-icon="inline-end" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400/80 print:hidden">
          Your dependency report
        </p>
        <p className="mt-2 font-mono text-[11px] text-zinc-600 print:hidden">
          {payload.answers.industry} ·{" "}
          {reportDate.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
        </p>

        <div className="mt-8">
          <OperationalScanPrintReport
            result={payload.result}
            answers={payload.answers}
            reportDate={reportDate}
            fixes={payload.fixes}
            visible
          />
        </div>

        <HostedScanReportActions />

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600 print:hidden">
          {SCAN_RESULTS.disclaimer}
        </p>
      </main>
    </div>
  )
}
