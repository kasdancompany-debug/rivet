import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseStudyMetricsDashboard } from "@/components/internal/case-study-metrics-dashboard"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { canAccessInternalDiagnostics } from "@/lib/billing/internal-access"
import { loadCaseStudyMetricsDashboard } from "@/lib/internal-metrics/load-case-study-data"
import { parseCaseStudyPeriodsFromSearchParams } from "@/lib/internal-metrics/period"

export const metadata: Metadata = {
  title: "Case study metrics",
  description: "Internal before/after Rivet pilot metrics for marketing proof.",
  robots: { index: false, follow: false },
}

export default async function InternalMetricsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = requireAuthUser(await getServerAuthUser(), "/internal/metrics")

  if (!canAccessInternalDiagnostics(user.email)) {
    notFound()
  }

  const sp = await searchParams
  const periods = parseCaseStudyPeriodsFromSearchParams(sp)
  const model = await loadCaseStudyMetricsDashboard(periods)

  if (!model) {
    notFound()
  }

  return <CaseStudyMetricsDashboard model={model} />
}
