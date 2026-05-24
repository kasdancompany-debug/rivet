import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"
import { humanScoreGainExplanation } from "@/lib/escape-readiness/build-score-gain"
import { findWeekOverWeekScores } from "@/lib/escape-readiness/score-progress-comparison"
import type {
  EscapeReadinessProgressPoint,
  EscapeWeeklyChange,
  EscapeWeeklyChangeDirection,
  EscapeWeeklyChangeItem,
} from "@/lib/escape-readiness/types"

function roundDays(days: number): number {
  if (days < 1) return Math.round(days * 10) / 10
  if (days < 10) return Math.round(days * 10) / 10
  return Math.round(days)
}

function directionFromDelta(delta: number, flatThreshold = 0.5): EscapeWeeklyChangeDirection {
  if (Math.abs(delta) < flatThreshold) return "flat"
  return delta > 0 ? "up" : "down"
}

function scoreDifferenceLabel(delta: number): string {
  const rounded = Math.round(delta)
  if (rounded === 0) return "No change"
  return `${rounded > 0 ? "+" : ""}${rounded} pts`
}

function daysDifferenceLabel(delta: number): string {
  const rounded = roundDays(Math.abs(delta))
  if (rounded === 0) return "No change"
  const sign = delta > 0 ? "+" : "−"
  if (rounded < 1) return `${sign}${rounded} day`
  return `${sign}${rounded} days`
}

function scoreExplanation(
  direction: EscapeWeeklyChangeDirection,
  delta: number,
  baseline: number,
  current: number
): string {
  if (direction === "up") {
    return humanScoreGainExplanation(delta, baseline, current)
  }
  if (direction === "down") {
    return "Score slipped—open issues or owner pulls likely climbed faster than fixes landed."
  }
  return "Flat week—nothing new logged to move the score yet."
}

function absenceExplanation(direction: EscapeWeeklyChangeDirection): string {
  if (direction === "up") {
    return "You could tolerate a longer absence before stress shows—systems are holding better."
  }
  if (direction === "down") {
    return "Absence window shrank—address the weakest readiness factor before stepping away."
  }
  return "Absence capacity held steady—same runway as last week."
}

function buildScoreChange(baseline: number, current: number): EscapeWeeklyChangeItem {
  const delta = current - baseline
  const direction = directionFromDelta(delta, 1)

  return {
    metric: "Escape readiness score",
    direction,
    differenceLabel: scoreDifferenceLabel(delta),
    explanation: scoreExplanation(direction, delta, baseline, current),
  }
}

function buildAbsenceChange(baselineScore: number, currentScore: number): EscapeWeeklyChangeItem {
  const baselineDays = estimatedDaysFromScore(baselineScore)
  const currentDays = estimatedDaysFromScore(currentScore)
  const delta = roundDays(currentDays - baselineDays)
  const direction = directionFromDelta(delta, 0.25)

  return {
    metric: "Owner absence capacity",
    direction,
    differenceLabel: daysDifferenceLabel(delta),
    explanation: absenceExplanation(direction),
  }
}

export function buildWeeklyChange(
  progress: EscapeReadinessProgressPoint[],
  currentScore: number | null,
  asOfDate?: string
): EscapeWeeklyChange | null {
  const comparison = findWeekOverWeekScores(progress, currentScore, asOfDate)
  if (!comparison) return null

  const items: EscapeWeeklyChangeItem[] = [
    buildScoreChange(comparison.baseline, comparison.current),
    buildAbsenceChange(comparison.baseline, comparison.current),
  ]

  return {
    periodLabel: "vs 7 days ago",
    items,
  }
}
