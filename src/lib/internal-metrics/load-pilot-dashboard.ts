import "server-only"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { buildPilotDailySeries } from "@/lib/internal-metrics/build-daily-series"
import { buildCaseStudyMetricRows, buildMarketingProofBullets } from "@/lib/internal-metrics/build-metric-deltas"
import { computePeriodMetricsSnapshot } from "@/lib/internal-metrics/compute-period-snapshot"
import { caseStudyLabelFromEnv, loadRawContext } from "@/lib/internal-metrics/load-case-study-data"
import type { PilotWindowDays } from "@/lib/internal-metrics/period"
import { addUtcDays, pilotComparisonPeriods } from "@/lib/internal-metrics/period"
import { createClient } from "@/lib/supabase/server"

export type KasdanPilotDashboardModel = {
  caseStudyLabel: string
  businessName: string
  businessId: string
  windowDays: PilotWindowDays
  baseline: ReturnType<typeof computePeriodMetricsSnapshot>
  current: ReturnType<typeof computePeriodMetricsSnapshot>
  metricRows: ReturnType<typeof buildCaseStudyMetricRows>
  marketingBullets: string[]
  daily: ReturnType<typeof buildPilotDailySeries>
}

export async function loadKasdanPilotDashboard(
  windowDays: PilotWindowDays
): Promise<KasdanPilotDashboardModel | null> {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const { baseline, current } = pilotComparisonPeriods(windowDays)
  const earliest = baseline.start
  const fetchSince = `${addUtcDays(earliest, -7)}T00:00:00.000Z`

  const ctx = await loadRawContext(business.id, fetchSince)
  if (!ctx) return null

  const baselineSnapshot = computePeriodMetricsSnapshot(baseline, ctx)
  const currentSnapshot = computePeriodMetricsSnapshot(current, ctx)
  const metricRows = buildCaseStudyMetricRows(baselineSnapshot, currentSnapshot)
  const caseStudyLabel = caseStudyLabelFromEnv()
  const marketingBullets = buildMarketingProofBullets(
    caseStudyLabel,
    baselineSnapshot,
    currentSnapshot,
    metricRows
  )
  const daily = buildPilotDailySeries(current, ctx)

  return {
    caseStudyLabel,
    businessName: business.name,
    businessId: business.id,
    windowDays,
    baseline: baselineSnapshot,
    current: currentSnapshot,
    metricRows,
    marketingBullets,
    daily,
  }
}
