import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"
import type {
  EscapeAbsenceSimulationFix,
  EscapeReadinessView,
} from "@/lib/escape-readiness/types"

function roundDays(days: number): number {
  if (days < 1) return Math.round(days * 10) / 10
  if (days < 10) return Math.round(days * 10) / 10
  return Math.round(days)
}

export function buildAbsenceSimulationFixes(view: EscapeReadinessView): {
  fixes: EscapeAbsenceSimulationFix[]
  projectedDaysGain: number
} {
  const score = view.score ?? 50
  const items = view.fastestPathToFreedom.slice(0, 3)
  const totalGain = items.reduce((sum, item) => sum + item.estimatedScoreGain, 0)
  const projectedDaysGain = roundDays(
    estimatedDaysFromScore(score + totalGain) - estimatedDaysFromScore(score)
  )

  const fixes: EscapeAbsenceSimulationFix[] = items.map((item) => {
    const factor = item.factorId ? view.factors.find((f) => f.id === item.factorId) : null
    return {
      title: item.title,
      action: item.action,
      href: factor?.detail.fixCta.href ?? "/escape-plan",
      estimatedScoreGain: item.estimatedScoreGain,
    }
  })

  return { fixes, projectedDaysGain }
}

export function formatProjectedDaysGain(days: number): string {
  const rounded = roundDays(days)
  if (rounded <= 0) return "+0 owner-free days"
  const sign = rounded > 0 ? "+" : ""
  if (rounded === 1) return `${sign}1 owner-free day`
  return `${sign}${rounded} owner-free days`
}
