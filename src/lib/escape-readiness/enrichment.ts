import { ESCAPE_READINESS_HEADLINE, ESCAPE_READINESS_TAGLINE } from "@/lib/escape-readiness/copy"
import { computeAbsenceCapacity } from "@/lib/escape-readiness/absence-capacity"
import {
  buildBiggestRisk,
  type EscapeBiggestRiskContext,
} from "@/lib/escape-readiness/build-biggest-risk"
import { buildFreedomPath } from "@/lib/escape-readiness/build-freedom-path"
import { buildWeeklyChange } from "@/lib/escape-readiness/build-weekly-change"
import { simulationContextFromFactors } from "@/lib/escape-readiness/build-simulation-context"
import { enrichFactorsWithDetails } from "@/lib/escape-readiness/build-factor-detail"
import type {
  EscapeReadinessFactor,
  EscapeReadinessFactorId,
  EscapeReadinessFactorInput,
  EscapeReadinessProgressPoint,
  EscapeReadinessView,
} from "@/lib/escape-readiness/types"
import { buildProgression } from "@/lib/escape-readiness/progression"
import { buildScoreGain } from "@/lib/escape-readiness/build-score-gain"
import {
  bandFromScoreForEscape,
  escapeStatusFromScore,
  verdictForEscapeScore,
} from "@/lib/escape-readiness/presentation"

const FACTOR_ORDER: EscapeReadinessFactorId[] = [
  "sop_coverage",
  "training_coverage",
  "unresolved_issues",
  "owner_interruptions",
  "undocumented_procedures",
]

function averageNullable(nums: (number | null)[]): number | null {
  const defined = nums.filter((n): n is number => n != null && Number.isFinite(n))
  if (defined.length === 0) return null
  return Math.round(defined.reduce((a, b) => a + b, 0) / defined.length)
}

function sortFactors(factors: EscapeReadinessFactorInput[]): EscapeReadinessFactorInput[] {
  const byId = new Map(factors.map((f) => [f.id, f]))
  return FACTOR_ORDER.map((id) => byId.get(id)).filter((f): f is EscapeReadinessFactorInput => Boolean(f))
}

function latestProgressAsOfDate(progress: EscapeReadinessProgressPoint[]): string | undefined {
  if (progress.length === 0) return undefined
  return [...progress].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date
}

export function finalizeEscapeReadinessView(
  partial: {
    score?: number | null
    verdict?: string
    factors: EscapeReadinessFactorInput[]
    progress?: EscapeReadinessProgressPoint[]
    band?: EscapeReadinessView["band"]
    demo?: boolean
    riskContext?: EscapeBiggestRiskContext
    simulationContext?: EscapeReadinessView["simulationContext"]
  }
): EscapeReadinessView {
  const factors = enrichFactorsWithDetails(sortFactors(partial.factors))
  const score =
    partial.score !== undefined
      ? partial.score
      : averageNullable(factors.map((f) => f.percent))
  const band = partial.band ?? (score == null ? null : bandFromScoreForEscape(score))
  const status = escapeStatusFromScore(score)
  const verdict = partial.verdict ?? verdictForEscapeScore(score)
  const progress = partial.progress ?? []
  const asOfDate = latestProgressAsOfDate(progress)

  return {
    tagline: ESCAPE_READINESS_TAGLINE,
    headlineQuestion: ESCAPE_READINESS_HEADLINE,
    score,
    band,
    statusTier: status.tier,
    statusBadge: status.badge,
    statusInterpretation: status.interpretation,
    progression: buildProgression(score),
    scoreGain: buildScoreGain(progress, score, asOfDate),
    absenceCapacity: computeAbsenceCapacity(score, factors),
    verdict,
    factors,
    biggestRisk: buildBiggestRisk(factors, partial.riskContext),
    fastestPathToFreedom: buildFreedomPath(factors, score),
    weeklyChange: buildWeeklyChange(progress, score, asOfDate),
    simulationContext:
      partial.simulationContext ??
      simulationContextFromFactors(partial.factors, score, partial.riskContext),
    progress,
    demo: partial.demo,
  }
}

export function escapeProgressFromAutonomyTrend(
  points: { date: string; autonomyScore: number | null }[],
  todayScore: number | null
): EscapeReadinessProgressPoint[] {
  const out = points
    .filter((p) => p.autonomyScore != null && Number.isFinite(p.autonomyScore))
    .map((p) => ({ date: p.date, score: Math.round(p.autonomyScore as number) }))
  if (todayScore != null && Number.isFinite(todayScore)) {
    const today = new Date().toISOString().slice(0, 10)
    const withoutToday = out.filter((p) => p.date !== today)
    withoutToday.push({ date: today, score: Math.round(todayScore) })
    withoutToday.sort((a, b) => a.date.localeCompare(b.date))
    return withoutToday.slice(-21)
  }
  return out.slice(-21)
}
