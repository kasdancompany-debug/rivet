import {
  buildConfusionAreas,
  buildQuestionClusters,
  type AskQueryRow,
} from "@/lib/ask-rivet/questions-prevented"
import { MINUTES_SAVED_PER_ASK } from "@/lib/ask-rivet/types"
import { estimatedDaysFromScore, formatAbsenceDays } from "@/lib/escape-readiness/absence-capacity"
import { buildTopLeaks } from "@/lib/owner-interruptions/top-leaks/build-top-leaks"
import type { MetricsDateRange } from "@/lib/internal-metrics/period"
import { isoDateInRange } from "@/lib/internal-metrics/period"
import { buildInterruptionRepeatCategories } from "@/lib/internal-metrics/repeat-categories"
import type { Tables } from "@/types/database"

export type RepeatedQuestionRow = {
  question: string
  askCount: number
  preventedCount: number
  standardId: string | null
}

export type OperationalWeakPointRow = {
  label: string
  occurrences: number
  ownerMinutes: number
  source: "interruption" | "ask_rivet"
  suggestedFix: string
}

export type PeriodMetricsSnapshot = {
  range: MetricsDateRange
  interruptionsLogged: number
  interruptionsOwnerMinutes: number
  questionsAnswered: number
  questionsPrevented: number
  ownerHoursReturned: number
  playsCreated: number
  playsPublishedInPeriod: number
  trainingCompletions: number
  trainingCompletionRate: number | null
  certificationsEarned: number
  askRivetUsage: number
  ownerFreeCapacityDays: number | null
  ownerFreeCapacityLabel: string | null
  escapeReadinessScore: number | null
  repeatedQuestions: RepeatedQuestionRow[]
  operationalWeakPoints: OperationalWeakPointRow[]
}

export type CaseStudyRawContext = {
  interruptions: Tables<"owner_interruptions">[]
  askQueries: AskQueryRow[]
  standards: Tables<"standards">[]
  trainingProgress: Tables<"training_progress">[]
  trainingModules: Tables<"training_modules">[]
  scoreSnapshots: Tables<"handoff_score_snapshots">[]
  certifications: Tables<"employee_module_certifications">[]
  standardIdsWithMedia: Set<string>
}

function filterInterruptions(rows: Tables<"owner_interruptions">[], range: MetricsDateRange) {
  return rows.filter((r) => isoDateInRange(r.occurred_at, range))
}

function filterAsk(rows: AskQueryRow[], range: MetricsDateRange) {
  return rows.filter((r) => isoDateInRange(r.created_at, range))
}

function snapshotScoreNearDate(
  snapshots: Tables<"handoff_score_snapshots">[],
  ymd: string
): number | null {
  const onDay = snapshots.filter((s) => s.snapshot_date === ymd)
  const row = onDay.at(-1) ?? snapshots.filter((s) => s.snapshot_date <= ymd).at(-1)
  const score = row?.autonomy_score
  return score != null && Number.isFinite(score) ? Math.round(score) : null
}

export function computePeriodMetricsSnapshot(
  range: MetricsDateRange,
  ctx: CaseStudyRawContext
): PeriodMetricsSnapshot {
  const interruptions = filterInterruptions(ctx.interruptions, range)
  const asks = filterAsk(ctx.askQueries, range)

  const interruptionsOwnerMinutes = interruptions.reduce(
    (s, r) => s + (r.estimated_minutes ?? 0),
    0
  )

  const questionsPrevented = asks.filter((r) => r.prevented_owner_interrupt).length
  const ownerHoursReturned = Math.round(((questionsPrevented * MINUTES_SAVED_PER_ASK) / 60) * 10) / 10
  const clusters = buildQuestionClusters(asks)
  const repeatedQuestions: RepeatedQuestionRow[] = clusters
    .filter((c) => c.askCount >= 2)
    .slice(0, 10)
    .map((c) => ({
      question: c.displayQuestion,
      askCount: c.askCount,
      preventedCount: c.preventedCount,
      standardId: c.standardId,
    }))

  const repeatCategories = buildInterruptionRepeatCategories(interruptions)
  const topLeaks = buildTopLeaks({
    repeatCategories,
    historyRows: interruptions,
    standards: ctx.standards,
    modules: ctx.trainingModules,
    standardIdsWithMedia: ctx.standardIdsWithMedia,
    askQueries: asks,
    maxLeaks: 6,
  })

  const confusion = buildConfusionAreas(clusters).slice(0, 4)
  const weakFromAsk: OperationalWeakPointRow[] = confusion.map((c) => ({
    label: c.question,
    occurrences: c.askCount,
    ownerMinutes: 0,
    source: "ask_rivet",
    suggestedFix: c.summary,
  }))

  const weakFromInterruptions: OperationalWeakPointRow[] = topLeaks.map((l) => ({
    label: l.name,
    occurrences: l.occurrences,
    ownerMinutes: l.estimatedOwnerMinutes,
    source: "interruption",
    suggestedFix: l.suggestedFix,
  }))

  const operationalWeakPoints = [...weakFromInterruptions, ...weakFromAsk]
    .sort((a, b) => b.occurrences - a.occurrences || b.ownerMinutes - a.ownerMinutes)
    .slice(0, 10)

  const playsCreated = ctx.standards.filter((s) => isoDateInRange(s.created_at, range)).length
  const playsPublishedInPeriod = ctx.standards.filter(
    (s) => s.status === "active" && isoDateInRange(s.created_at, range)
  ).length

  const completionsInPeriod = ctx.trainingProgress.filter(
    (p) => p.status === "completed" && p.completed_at && isoDateInRange(p.completed_at, range)
  )
  const assignedByEnd = ctx.trainingProgress.filter((p) => {
    const created = p.updated_at.slice(0, 10)
    return created <= range.end
  })
  const trainingCompletions = completionsInPeriod.length
  const trainingCompletionRate =
    assignedByEnd.length > 0
      ? Math.round((assignedByEnd.filter((p) => p.status === "completed").length / assignedByEnd.length) * 100)
      : null

  const certificationsEarned = ctx.certifications.filter(
    (c) => c.certified_at && isoDateInRange(c.certified_at, range)
  ).length

  const escapeReadinessScore = snapshotScoreNearDate(ctx.scoreSnapshots, range.end)
  const ownerFreeCapacityDays =
    escapeReadinessScore != null ? estimatedDaysFromScore(escapeReadinessScore) : null

  return {
    range,
    interruptionsLogged: interruptions.length,
    interruptionsOwnerMinutes,
    questionsAnswered: asks.length,
    questionsPrevented,
    ownerHoursReturned,
    playsCreated,
    playsPublishedInPeriod,
    trainingCompletions,
    trainingCompletionRate,
    certificationsEarned,
    askRivetUsage: asks.length,
    ownerFreeCapacityDays,
    ownerFreeCapacityLabel:
      ownerFreeCapacityDays != null ? formatAbsenceDays(ownerFreeCapacityDays) : null,
    escapeReadinessScore,
    repeatedQuestions,
    operationalWeakPoints,
  }
}
