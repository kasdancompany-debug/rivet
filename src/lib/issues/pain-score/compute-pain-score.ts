import type { IssueStatus, Tables } from "@/types/database"

import { painLevelFromScore, type IssuePainLevel } from "@/lib/issues/pain-score/pain-levels"

export type IssuePainScoreDrivers = {
  frequency: { score: number; count: number }
  timeCost: { score: number; severity: string }
  ownerInvolvement: { score: number; ownerRequired: boolean }
  recency: { score: number; daysSinceCreated: number }
}

export type IssuePainScoreResult = {
  painScore: number
  level: IssuePainLevel
  drivers: IssuePainScoreDrivers
}

const FREQUENCY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const MS_PER_DAY = 24 * 60 * 60 * 1000

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function normalizeIssueTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ")
}

export function scoreIssueFrequency(count: number): number {
  const n = Math.max(1, Math.round(count))
  if (n === 1) return 15
  if (n === 2) return 40
  if (n <= 4) return 65
  return 90
}

export function scoreIssueTimeCost(severity: string): number {
  switch (severity) {
    case "low":
      return 20
    case "medium":
      return 45
    case "high":
      return 70
    case "critical":
      return 95
    default:
      return 45
  }
}

export function scoreOwnerInvolvement(input: {
  ownerRequired: boolean
  status: IssueStatus
}): number {
  if (input.status === "resolved") return 10
  if (input.ownerRequired) {
    if (input.status === "fix_in_progress") return 90
    if (input.status === "investigating") return 85
    return 100
  }
  if (input.status === "fix_in_progress") return 45
  if (input.status === "investigating") return 40
  return 30
}

export function scoreIssueRecency(createdAt: string, nowMs: number = Date.now()): number {
  const days = Math.max(0, (nowMs - new Date(createdAt).getTime()) / MS_PER_DAY)
  if (days <= 1) return 100
  if (days <= 3) return 85
  if (days <= 7) return 70
  if (days <= 14) return 50
  if (days <= 30) return 30
  return 15
}

export function countSimilarIssuesInWindow(
  rows: Pick<Tables<"bottlenecks">, "title" | "created_at">[],
  target: Pick<Tables<"bottlenecks">, "title" | "created_at">,
  windowMs: number = FREQUENCY_WINDOW_MS
): number {
  const key = normalizeIssueTitle(target.title)
  if (!key) return 1

  const endMs = new Date(target.created_at).getTime()
  const startMs = endMs - windowMs

  let count = 0
  for (const row of rows) {
    if (normalizeIssueTitle(row.title) !== key) continue
    const t = new Date(row.created_at).getTime()
    if (t >= startMs && t <= endMs) count += 1
  }

  return Math.max(1, count)
}

export function computePainScore(input: {
  issue: Pick<
    Tables<"bottlenecks">,
    "title" | "severity" | "owner_required" | "status" | "created_at"
  >
  history?: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
  nowMs?: number
}): IssuePainScoreResult {
  const nowMs = input.nowMs ?? Date.now()
  const frequencyCount = countSimilarIssuesInWindow(input.history ?? [input.issue], input.issue)
  const daysSinceCreated = Math.max(
    0,
    (nowMs - new Date(input.issue.created_at).getTime()) / MS_PER_DAY
  )

  const frequencyScore = scoreIssueFrequency(frequencyCount)
  const timeScore = scoreIssueTimeCost(input.issue.severity)
  const ownerScore = scoreOwnerInvolvement({
    ownerRequired: input.issue.owner_required,
    status: input.issue.status,
  })
  const recencyScore = scoreIssueRecency(input.issue.created_at, nowMs)

  const raw = Math.round(
    frequencyScore * 0.25 + timeScore * 0.3 + ownerScore * 0.25 + recencyScore * 0.2
  )

  const painScore =
    input.issue.status === "resolved" ? clamp(Math.round(raw * 0.15), 0, 100) : clamp(raw, 0, 100)

  return {
    painScore,
    level: painLevelFromScore(painScore),
    drivers: {
      frequency: { score: frequencyScore, count: frequencyCount },
      timeCost: { score: timeScore, severity: input.issue.severity },
      ownerInvolvement: {
        score: ownerScore,
        ownerRequired: input.issue.owner_required,
      },
      recency: { score: recencyScore, daysSinceCreated: Math.round(daysSinceCreated * 10) / 10 },
    },
  }
}

export function rankIssuesByPainScore<T extends Tables<"bottlenecks">>(
  issues: T[],
  history: Pick<Tables<"bottlenecks">, "title" | "created_at">[],
  nowMs?: number
): Array<{ issue: T; pain: IssuePainScoreResult }> {
  return issues
    .map((issue) => ({
      issue,
      pain: computePainScore({ issue, history, nowMs }),
    }))
    .sort((a, b) => b.pain.painScore - a.pain.painScore)
}
