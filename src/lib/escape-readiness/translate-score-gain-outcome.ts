import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"
import type { EscapeReadinessFactorId } from "@/lib/escape-readiness/types"

function roundDays(days: number): number {
  if (days < 1) return Math.round(days * 10) / 10
  if (days < 10) return Math.round(days * 10) / 10
  return Math.round(days)
}

const INTERRUPTION_OUTCOME_FACTORS: EscapeReadinessFactorId[] = [
  "owner_interruptions",
  "unresolved_issues",
]

export function formatOwnerFreeDayOutcome(daysDelta: number): string {
  const rounded = roundDays(daysDelta)
  if (rounded >= 1) {
    const n = Math.max(1, Math.floor(rounded))
    return n === 1 ? "≈ +1 owner-free day" : `≈ +${n} owner-free days`
  }
  if (rounded >= 0.5) return "≈ +½ owner-free day"
  if (rounded >= 0.25) return "≈ a little more runway"
  return "≈ tighter systems before breakdowns"
}

export function formatFewerInterruptionsOutcome(scoreGain: number): string {
  const fewer = Math.max(1, Math.round(scoreGain / 2.3))
  return fewer === 1 ? "≈ 1 fewer interruption/week" : `≈ ${fewer} fewer interruptions/week`
}

export function translateScoreGainOutcome(
  scoreGain: number,
  currentScore: number | null,
  factorId: EscapeReadinessFactorId | null
): string {
  const baseline = currentScore ?? 50
  const daysDelta =
    estimatedDaysFromScore(baseline + scoreGain) - estimatedDaysFromScore(baseline)

  const useInterruptionFraming =
    factorId != null &&
    INTERRUPTION_OUTCOME_FACTORS.includes(factorId) &&
    scoreGain <= 10 &&
    daysDelta < 1

  if (useInterruptionFraming) {
    return formatFewerInterruptionsOutcome(scoreGain)
  }

  if (daysDelta >= 0.5) {
    return formatOwnerFreeDayOutcome(daysDelta)
  }

  if (factorId != null && INTERRUPTION_OUTCOME_FACTORS.includes(factorId)) {
    return formatFewerInterruptionsOutcome(scoreGain)
  }

  return formatOwnerFreeDayOutcome(Math.max(daysDelta, 0.25))
}
