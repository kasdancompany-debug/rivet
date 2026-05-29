import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"
import type { CaseStudyRawContext } from "@/lib/internal-metrics/compute-period-snapshot"
import type { MetricsDateRange } from "@/lib/internal-metrics/period"
import { eachUtcDayInRange, isoDateInRange } from "@/lib/internal-metrics/period"

export type DailyMetricPoint = {
  date: string
  value: number
}

export type PilotDailySeries = {
  interruptions: DailyMetricPoint[]
  askRivetUsage: DailyMetricPoint[]
  questionsPrevented: DailyMetricPoint[]
  playsCreated: DailyMetricPoint[]
  trainingCompletions: DailyMetricPoint[]
  certificationsEarned: DailyMetricPoint[]
  escapeReadiness: DailyMetricPoint[]
  ownerFreeCapacityDays: DailyMetricPoint[]
}

function emptySeries(range: MetricsDateRange): Map<string, number> {
  return new Map(eachUtcDayInRange(range).map((date) => [date, 0]))
}

function increment(map: Map<string, number>, isoTimestamp: string) {
  const day = isoTimestamp.slice(0, 10)
  if (map.has(day)) {
    map.set(day, (map.get(day) ?? 0) + 1)
  }
}

function mapToSeries(map: Map<string, number>): DailyMetricPoint[] {
  return [...map.entries()].map(([date, value]) => ({ date, value }))
}

function scoreByDay(
  snapshots: CaseStudyRawContext["scoreSnapshots"],
  range: MetricsDateRange
): DailyMetricPoint[] {
  const days = eachUtcDayInRange(range)
  const byDate = new Map(
    snapshots
      .filter((s) => s.autonomy_score != null && s.snapshot_date >= range.start && s.snapshot_date <= range.end)
      .map((s) => [s.snapshot_date, Math.round(s.autonomy_score as number)])
  )

  let lastScore: number | null = null
  const prior = snapshots
    .filter((s) => s.autonomy_score != null && s.snapshot_date < range.start)
    .at(-1)
  if (prior?.autonomy_score != null) {
    lastScore = Math.round(prior.autonomy_score as number)
  }

  return days.map((date) => {
    const onDay = byDate.get(date)
    if (onDay != null) lastScore = onDay
    return { date, value: lastScore ?? 0 }
  })
}

export function buildPilotDailySeries(
  range: MetricsDateRange,
  ctx: CaseStudyRawContext
): PilotDailySeries {
  const interruptions = emptySeries(range)
  for (const row of ctx.interruptions) {
    if (isoDateInRange(row.occurred_at, range)) increment(interruptions, row.occurred_at)
  }

  const askRivetUsage = emptySeries(range)
  const questionsPrevented = emptySeries(range)
  for (const row of ctx.askQueries) {
    if (!isoDateInRange(row.created_at, range)) continue
    increment(askRivetUsage, row.created_at)
    if (row.prevented_owner_interrupt) increment(questionsPrevented, row.created_at)
  }

  const playsCreated = emptySeries(range)
  for (const row of ctx.standards) {
    if (isoDateInRange(row.created_at, range)) increment(playsCreated, row.created_at)
  }

  const trainingCompletions = emptySeries(range)
  for (const row of ctx.trainingProgress) {
    if (row.status === "completed" && row.completed_at && isoDateInRange(row.completed_at, range)) {
      increment(trainingCompletions, row.completed_at)
    }
  }

  const certificationsEarned = emptySeries(range)
  for (const row of ctx.certifications) {
    if (row.certified_at && isoDateInRange(row.certified_at, range)) {
      increment(certificationsEarned, row.certified_at)
    }
  }

  const escapeReadiness = scoreByDay(ctx.scoreSnapshots, range)
  const ownerFreeCapacityDays = escapeReadiness.map((p) => ({
    date: p.date,
    value: p.value > 0 ? Math.round(estimatedDaysFromScore(p.value) * 10) / 10 : 0,
  }))

  return {
    interruptions: mapToSeries(interruptions),
    askRivetUsage: mapToSeries(askRivetUsage),
    questionsPrevented: mapToSeries(questionsPrevented),
    playsCreated: mapToSeries(playsCreated),
    trainingCompletions: mapToSeries(trainingCompletions),
    certificationsEarned: mapToSeries(certificationsEarned),
    escapeReadiness,
    ownerFreeCapacityDays,
  }
}

export function sumSeries(points: DailyMetricPoint[]): number {
  return points.reduce((s, p) => s + p.value, 0)
}

export function latestNonZero(points: DailyMetricPoint[]): number | null {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const v = points[i]!.value
    if (v > 0) return v
  }
  return points.at(-1)?.value ?? null
}
