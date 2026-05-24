import type { ManagerObservationType } from "@/types/database"

export type ObservationCounts = {
  positive: number
  improvement: number
  critical: number
}

export type ObservationRow = {
  observation_type: ManagerObservationType
  observed_at: string
}

export function countObservations(rows: ObservationRow[]): ObservationCounts {
  const counts: ObservationCounts = { positive: 0, improvement: 0, critical: 0 }
  for (const row of rows) {
    counts[row.observation_type] += 1
  }
  return counts
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function shiftRunFallbackScore(completedShiftRuns: number): number {
  if (completedShiftRuns >= 5) return 100
  if (completedShiftRuns >= 3) return 85
  if (completedShiftRuns >= 1) return clampPct(completedShiftRuns * 28)
  return 0
}

const RECENT_CRITICAL_DAYS = 30

function hasRecentCritical(rows: ObservationRow[], now = Date.now()): boolean {
  const cutoff = now - RECENT_CRITICAL_DAYS * 24 * 60 * 60 * 1000
  return rows.some(
    (row) =>
      row.observation_type === "critical" && new Date(row.observed_at).getTime() >= cutoff
  )
}

/** Manager observation signal blended with completed shift runs when no notes exist yet. */
export function computeManagerObservationSignalScore(
  rows: ObservationRow[],
  completedShiftRuns: number,
  now = Date.now()
): number {
  const counts = countObservations(rows)
  const total = counts.positive + counts.improvement + counts.critical

  if (total === 0) {
    return shiftRunFallbackScore(completedShiftRuns)
  }

  let score = 35
  score += Math.min(counts.positive * 12, 45)
  score += Math.min(counts.improvement * 5, 15)
  score -= counts.critical * 18

  const runBonus =
    completedShiftRuns >= 5 ? 12 : completedShiftRuns >= 3 ? 8 : completedShiftRuns >= 1 ? 4 : 0
  score += runBonus

  if (hasRecentCritical(rows, now)) {
    score = Math.min(score, 50)
  }

  return clampPct(score)
}
