import type { EscapeReadinessProgressPoint } from "@/lib/escape-readiness/types"

const DAYS_AGO = 7

export type ScoreProgressComparison = {
  baseline: number
  current: number
  baselineDate: string
  currentDate: string
}

export function findWeekOverWeekScores(
  progress: EscapeReadinessProgressPoint[],
  currentScore: number | null,
  asOfDate?: string
): ScoreProgressComparison | null {
  const sorted = [...progress].sort((a, b) => a.date.localeCompare(b.date))
  let points = sorted

  if (currentScore != null && Number.isFinite(currentScore)) {
    const today = asOfDate ?? new Date().toISOString().slice(0, 10)
    const withoutToday = sorted.filter((p) => p.date !== today)
    withoutToday.push({ date: today, score: Math.round(currentScore) })
    withoutToday.sort((a, b) => a.date.localeCompare(b.date))
    points = withoutToday
  }

  if (points.length < 2) return null

  const latest = points[points.length - 1]!
  const latestDate = new Date(`${latest.date}T12:00:00Z`)
  const targetTime = latestDate.getTime() - DAYS_AGO * 86_400_000
  const minBaselineGapMs = 4 * 86_400_000

  let baseline: EscapeReadinessProgressPoint | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const point of points) {
    const pointTime = new Date(`${point.date}T12:00:00Z`).getTime()
    if (pointTime >= latestDate.getTime()) continue
    if (latestDate.getTime() - pointTime < minBaselineGapMs) continue

    const distance = Math.abs(pointTime - targetTime)
    if (distance < bestDistance) {
      bestDistance = distance
      baseline = point
    }
  }

  if (!baseline) return null

  const spanDays =
    (latestDate.getTime() - new Date(`${baseline.date}T12:00:00Z`).getTime()) / 86_400_000
  if (spanDays < 4) return null

  return {
    baseline: baseline.score,
    current: latest.score,
    baselineDate: baseline.date,
    currentDate: latest.date,
  }
}
