import "server-only"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import {
  computePeriodMetricsSnapshot,
  type CaseStudyRawContext,
} from "@/lib/internal-metrics/compute-period-snapshot"
import { buildCaseStudyMetricRows, buildMarketingProofBullets } from "@/lib/internal-metrics/build-metric-deltas"
import type { MetricsDateRange } from "@/lib/internal-metrics/period"
import { addUtcDays } from "@/lib/internal-metrics/period"
import { createClient } from "@/lib/supabase/server"
import type { AskQueryRow } from "@/lib/ask-rivet/questions-prevented"
export type CaseStudyMetricsDashboard = {
  caseStudyLabel: string
  businessName: string
  businessId: string
  baseline: ReturnType<typeof computePeriodMetricsSnapshot>
  current: ReturnType<typeof computePeriodMetricsSnapshot>
  metricRows: ReturnType<typeof buildCaseStudyMetricRows>
  marketingBullets: string[]
  scoreTrend: { date: string; score: number }[]
}

export function caseStudyLabelFromEnv(): string {
  return process.env.NEXT_PUBLIC_CASE_STUDY_LABEL?.trim() || "Kasdan Co."
}

export async function loadRawContext(
  businessId: string,
  fetchSince: string
): Promise<CaseStudyRawContext | null> {
  const supabase = await createClient()

  const [
    interruptionsRes,
    askRes,
    standardsRes,
    progressRes,
    modulesRes,
    certificationsRes,
    snapshotsRes,
    mediaRes,
  ] = await Promise.all([
    supabase
      .from("owner_interruptions")
      .select("*")
      .eq("business_id", businessId)
      .gte("occurred_at", fetchSince)
      .order("occurred_at", { ascending: false })
      .limit(2000),
    supabase
      .from("rivet_ask_queries")
      .select(
        "question_text, normalized_question, standard_id, prevented_owner_interrupt, response, created_at"
      )
      .eq("business_id", businessId)
      .gte("created_at", fetchSince)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("standards").select("*").eq("business_id", businessId),
    supabase.from("training_progress").select("*").eq("business_id", businessId),
    supabase.from("training_modules").select("*").eq("business_id", businessId),
    supabase
      .from("employee_module_certifications")
      .select("*")
      .eq("business_id", businessId),
    supabase
      .from("handoff_score_snapshots")
      .select("*")
      .eq("business_id", businessId)
      .gte("snapshot_date", fetchSince.slice(0, 10))
      .order("snapshot_date", { ascending: true }),
    supabase.from("standard_media").select("standard_id").eq("business_id", businessId),
  ])

  if (interruptionsRes.error || askRes.error) return null

  const standardIdsWithMedia = new Set(
    (mediaRes.data ?? []).map((m) => m.standard_id).filter(Boolean)
  )

  return {
    interruptions: interruptionsRes.data ?? [],
    askQueries: (askRes.data ?? []) as AskQueryRow[],
    standards: standardsRes.data ?? [],
    trainingProgress: progressRes.data ?? [],
    trainingModules: modulesRes.data ?? [],
    certifications: certificationsRes.data ?? [],
    scoreSnapshots: snapshotsRes.data ?? [],
    standardIdsWithMedia,
  }
}

export async function loadCaseStudyMetricsDashboard(input: {
  baseline: MetricsDateRange
  current: MetricsDateRange
}): Promise<CaseStudyMetricsDashboard | null> {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const earliest = [input.baseline.start, input.current.start].sort()[0]!
  const fetchSince = `${addUtcDays(earliest, -7)}T00:00:00.000Z`

  const ctx = await loadRawContext(business.id, fetchSince)
  if (!ctx) return null

  const baseline = computePeriodMetricsSnapshot(input.baseline, ctx)
  const current = computePeriodMetricsSnapshot(input.current, ctx)
  const metricRows = buildCaseStudyMetricRows(baseline, current)
  const caseStudyLabel = caseStudyLabelFromEnv()
  const marketingBullets = buildMarketingProofBullets(
    caseStudyLabel,
    baseline,
    current,
    metricRows
  )

  const scoreTrend = ctx.scoreSnapshots
    .filter((s) => s.autonomy_score != null)
    .map((s) => ({
      date: s.snapshot_date,
      score: Math.round(s.autonomy_score as number),
    }))

  return {
    caseStudyLabel,
    businessName: business.name,
    businessId: business.id,
    baseline,
    current,
    metricRows,
    marketingBullets,
    scoreTrend,
  }
}
