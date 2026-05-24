import type { OwnerInterruptionSeverity, OwnerInterruptionUrgency } from "@/types/database"

import { maxSeverity } from "@/lib/owner-interruptions/severity/severities"

export type InterruptionSeverityDrivers = {
  timeSpent: { score: number; minutes: number }
  urgency: { score: number; level: OwnerInterruptionUrgency }
  frequency: { score: number; count: number }
}

export type InterruptionSeverityResult = {
  severity: OwnerInterruptionSeverity
  impactScore: number
  drivers: InterruptionSeverityDrivers
}

const FREQUENCY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function scoreTimeSpent(minutes: number): number {
  const m = clamp(Math.round(minutes), 1, 240)
  if (m <= 5) return 15
  if (m <= 15) return 35
  if (m <= 30) return 55
  if (m <= 60) return 75
  return 95
}

export function scoreUrgency(urgency: OwnerInterruptionUrgency): number {
  switch (urgency) {
    case "can_wait":
      return 20
    case "today":
      return 45
    case "time_sensitive":
      return 70
    case "right_now":
      return 100
    default:
      return 45
  }
}

export function scoreFrequency(count: number): number {
  const n = Math.max(1, Math.round(count))
  if (n === 1) return 15
  if (n === 2) return 40
  if (n <= 4) return 65
  return 90
}

function severityFromImpactScore(score: number): OwnerInterruptionSeverity {
  if (score >= 75) return "emergency"
  if (score >= 55) return "heavy_pull"
  if (score >= 35) return "medium_pull"
  return "small_pull"
}

function applySeverityFloors(input: {
  severity: OwnerInterruptionSeverity
  minutes: number
  urgency: OwnerInterruptionUrgency
  frequencyCount: number
}): OwnerInterruptionSeverity {
  let severity = input.severity

  if (input.urgency === "right_now" && input.minutes >= 90) {
    severity = maxSeverity(severity, "emergency")
  } else if (input.urgency === "right_now" && input.minutes >= 45) {
    severity = maxSeverity(severity, "heavy_pull")
  }

  if (input.frequencyCount >= 5 && input.minutes >= 15) {
    severity = maxSeverity(severity, "heavy_pull")
  }

  if (input.frequencyCount >= 8 && input.urgency !== "can_wait") {
    severity = maxSeverity(severity, "emergency")
  }

  return severity
}

export function computeInterruptionSeverity(input: {
  estimatedMinutes: number
  urgency: OwnerInterruptionUrgency
  frequencyCount: number
}): InterruptionSeverityResult {
  const minutes = clamp(Math.round(input.estimatedMinutes), 1, 240)
  const frequencyCount = Math.max(1, Math.round(input.frequencyCount))

  const timeScore = scoreTimeSpent(minutes)
  const urgencyScore = scoreUrgency(input.urgency)
  const frequencyScore = scoreFrequency(frequencyCount)

  const impactScore = Math.round(timeScore * 0.4 + urgencyScore * 0.35 + frequencyScore * 0.25)

  const baseSeverity = severityFromImpactScore(impactScore)
  const severity = applySeverityFloors({
    severity: baseSeverity,
    minutes,
    urgency: input.urgency,
    frequencyCount,
  })

  return {
    severity,
    impactScore,
    drivers: {
      timeSpent: { score: timeScore, minutes },
      urgency: { score: urgencyScore, level: input.urgency },
      frequency: { score: frequencyScore, count: frequencyCount },
    },
  }
}

export function countSimilarPullsInWindow(
  rows: { summary: string; occurred_at: string }[],
  target: { summary: string; occurred_at: string },
  windowMs: number = FREQUENCY_WINDOW_MS
): number {
  const key = target.summary.trim().toLowerCase().replace(/\s+/g, " ")
  if (!key) return 1

  const endMs = new Date(target.occurred_at).getTime()
  const startMs = endMs - windowMs

  let count = 0
  for (const row of rows) {
    const rowKey = row.summary.trim().toLowerCase().replace(/\s+/g, " ")
    if (rowKey !== key) continue
    const t = new Date(row.occurred_at).getTime()
    if (t >= startMs && t <= endMs) count += 1
  }

  return Math.max(1, count)
}
