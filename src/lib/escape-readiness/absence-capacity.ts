import type {
  EscapeAbsenceCapacity,
  EscapeReadinessFactorInput,
  EscapeReadinessFactorId,
} from "@/lib/escape-readiness/types"

const DAY_ANCHORS: { score: number; days: number }[] = [
  { score: 0, days: 0.5 },
  { score: 30, days: 0.5 },
  { score: 60, days: 2 },
  { score: 73, days: 3.6 },
  { score: 80, days: 4 },
  { score: 90, days: 7 },
  { score: 95, days: 10 },
  { score: 100, days: 14 },
]

export const ABSENCE_TIMELINE_MAX_DAYS = 14

export const ABSENCE_TIMELINE_MARKS = [
  { days: 0.5, label: "0.5d" },
  { days: 2, label: "2d" },
  { days: 3.6, label: "3.6d" },
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
] as const

const FAILURE_BY_FACTOR: Record<EscapeReadinessFactorId, string> = {
  sop_coverage: "Opening or closing without written steps",
  training_coverage: "Judgment calls on trained tasks",
  unresolved_issues: "Open issues stacking while you are out",
  owner_interruptions: "Texts and walk-ups routing to you",
  undocumented_procedures: "Procedure gap mid-shift",
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function roundDays(days: number): number {
  if (days < 1) return Math.round(days * 10) / 10
  if (days < 10) return Math.round(days * 10) / 10
  return Math.round(days)
}

export function formatAbsenceDays(days: number): string {
  const rounded = roundDays(days)
  if (rounded === 0.5) return "0.5 days"
  if (rounded === 1) return "1 day"
  return `${rounded} days`
}

export function formatAbsenceDayMarker(days: number): string {
  const rounded = roundDays(days)
  if (rounded < 1) return `${rounded} day`
  if (rounded === 1) return "Day 1"
  return `Day ${rounded}`
}

export function estimatedDaysFromScore(score: number): number {
  const s = clamp(score, 0, 100)
  for (let i = 0; i < DAY_ANCHORS.length - 1; i += 1) {
    const left = DAY_ANCHORS[i]!
    const right = DAY_ANCHORS[i + 1]!
    if (s >= left.score && s <= right.score) {
      const span = right.score - left.score
      const t = span === 0 ? 0 : (s - left.score) / span
      return roundDays(left.days + t * (right.days - left.days))
    }
  }
  return DAY_ANCHORS[DAY_ANCHORS.length - 1]!.days
}

function weakestFactor(factors: EscapeReadinessFactorInput[]): EscapeReadinessFactorInput | null {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactorInput & {
    percent: number
  })[]
  if (scored.length === 0) return null
  scored.sort((a, b) => a.percent - b.percent)
  return scored[0]!
}

function failureAtDays(estimatedDays: number, weakestPercent: number | null): number {
  const health = weakestPercent == null ? 50 : weakestPercent
  const ratio = clamp(0.42 + (health / 100) * 0.48, 0.35, 0.92)
  return roundDays(clamp(estimatedDays * ratio, 0.25, estimatedDays * 0.95))
}

function computeConfidence(score: number, factors: EscapeReadinessFactorInput[]): number {
  const withData = factors.filter((f) => f.percent != null)
  if (withData.length === 0) return 0

  const coverage = withData.length / factors.length
  const values = withData.map((f) => f.percent as number)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  const agreement = Math.max(0, 100 - Math.sqrt(variance)) / 100
  const scoreSignal = clamp(score / 100, 0.35, 1)

  return clamp(Math.round(36 + coverage * 32 + agreement * 24 + scoreSignal * 8), 35, 94)
}

export function computeAbsenceCapacity(
  score: number | null,
  factors: EscapeReadinessFactorInput[]
): EscapeAbsenceCapacity | null {
  if (score == null || !Number.isFinite(score)) return null

  const estimatedDays = estimatedDaysFromScore(score)
  const weakest = weakestFactor(factors)
  const failureDays = failureAtDays(estimatedDays, weakest?.percent ?? null)
  const likelyFailurePoint = weakest
    ? FAILURE_BY_FACTOR[weakest.id]
    : "First escalation that needs owner judgment"

  return {
    estimatedDays,
    estimatedLabel: formatAbsenceDays(estimatedDays),
    likelyFailurePoint,
    failureAtDays: failureDays,
    failureAtLabel: formatAbsenceDayMarker(failureDays),
    confidencePercent: computeConfidence(score, factors),
    timelineMaxDays: ABSENCE_TIMELINE_MAX_DAYS,
    timelineMarks: ABSENCE_TIMELINE_MARKS.map((m) => ({ ...m })),
  }
}
