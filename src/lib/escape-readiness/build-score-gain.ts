import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"
import { progressionStageFromScore } from "@/lib/escape-readiness/progression"
import { findWeekOverWeekScores } from "@/lib/escape-readiness/score-progress-comparison"
import type { EscapeReadinessProgressPoint, EscapeScoreGain } from "@/lib/escape-readiness/types"

function roundDays(days: number): number {
  if (days < 1) return Math.round(days * 10) / 10
  if (days < 10) return Math.round(days * 10) / 10
  return Math.round(days)
}


export function humanScoreGainExplanation(
  pointsGained: number,
  baselineScore: number,
  currentScore: number
): string {
  const previousStage = progressionStageFromScore(baselineScore)
  const currentStage = progressionStageFromScore(currentScore)
  if (previousStage.id !== currentStage.id) {
    return `You graduated to ${currentStage.label}.`
  }

  const baselineDays = estimatedDaysFromScore(baselineScore)
  const currentDays = estimatedDaysFromScore(currentScore)
  const daysDelta = roundDays(currentDays - baselineDays)

  if (daysDelta >= 2) {
    return `You earned about ${daysDelta} more days away.`
  }
  if (daysDelta >= 1) {
    return "You earned another full day away."
  }
  if (daysDelta >= 0.5) {
    return "You earned another half-day away."
  }
  if (daysDelta >= 0.25) {
    return "You bought a little more runway before pulls stack up."
  }

  if (pointsGained >= 8) {
    return "Your systems tightened—stepping away got meaningfully easier."
  }
  if (pointsGained >= 3) {
    return "Steady progress—keep closing the gap on your weakest factor."
  }
  return "Small gain—document one more procedure to keep momentum."
}

export function buildScoreGain(
  progress: EscapeReadinessProgressPoint[],
  currentScore: number | null,
  asOfDate?: string
): EscapeScoreGain | null {
  const comparison = findWeekOverWeekScores(progress, currentScore, asOfDate)
  if (!comparison) return null

  const pointsGained = comparison.current - comparison.baseline
  if (pointsGained <= 0) return null

  const baselineDays = estimatedDaysFromScore(comparison.baseline)
  const currentDays = estimatedDaysFromScore(comparison.current)

  return {
    previousScore: comparison.baseline,
    currentScore: comparison.current,
    pointsGained,
    gainLabel: `+${pointsGained} gained`,
    absenceDaysGained: roundDays(currentDays - baselineDays),
    humanExplanation: humanScoreGainExplanation(
      pointsGained,
      comparison.baseline,
      comparison.current
    ),
    periodLabel: "vs 7 days ago",
  }
}
