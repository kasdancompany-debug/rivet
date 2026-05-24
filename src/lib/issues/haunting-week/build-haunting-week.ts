import type { Tables } from "@/types/database"

import {
  computePainScore,
  normalizeIssueTitle,
  scoreIssueTimeCost,
} from "@/lib/issues/pain-score/compute-pain-score"
import { utcMondayStartIso } from "@/lib/time/utc-week"
import type { HauntingWeekItem, HauntingWeekItemInput, HauntingWeekSort } from "@/lib/issues/haunting-week/types"

export function sortHauntingWeekItems(
  items: HauntingWeekItemInput[],
  sort: HauntingWeekSort
): HauntingWeekItemInput[] {
  const copy = [...items]
  switch (sort) {
    case "impact":
      return copy.sort(
        (a, b) =>
          b.estimatedImpact - a.estimatedImpact ||
          b.frequency - a.frequency ||
          b.timeCostScore - a.timeCostScore
      )
    case "time_cost":
      return copy.sort(
        (a, b) =>
          b.timeCostScore - a.timeCostScore ||
          b.frequency - a.frequency ||
          b.estimatedImpact - a.estimatedImpact
      )
    case "frequency":
    default:
      return copy.sort(
        (a, b) =>
          b.frequency - a.frequency ||
          b.estimatedImpact - a.estimatedImpact ||
          b.timeCostScore - a.timeCostScore
      )
  }
}

export function rankHauntingWeekItems(items: HauntingWeekItemInput[]): HauntingWeekItem[] {
  return items.map((item, index) => ({ ...item, rank: index + 1 }))
}

export function buildHauntingWeek(input: {
  issues: Tables<"bottlenecks">[]
  history?: Tables<"bottlenecks">[]
  now?: Date
  maxItems?: number
  sort?: HauntingWeekSort
}): HauntingWeekItem[] {
  const now = input.now ?? new Date()
  const weekStartMs = new Date(utcMondayStartIso(now)).getTime()
  const history = input.history ?? input.issues
  const maxItems = input.maxItems ?? 8
  const sort = input.sort ?? "frequency"

  const thisWeek = input.issues.filter((issue) => new Date(issue.created_at).getTime() >= weekStartMs)
  const groups = new Map<string, Tables<"bottlenecks">[]>()

  for (const issue of thisWeek) {
    const key = normalizeIssueTitle(issue.title)
    if (!key) continue
    const rows = groups.get(key) ?? []
    rows.push(issue)
    groups.set(key, rows)
  }

  const items: HauntingWeekItemInput[] = [...groups.entries()].map(([key, rows]) => {
    const sorted = [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const latest = sorted[0]
    const pain = computePainScore({
      issue: latest,
      history,
      nowMs: now.getTime(),
    })

    return {
      key,
      title: latest.title,
      issueId: latest.id,
      frequency: rows.length,
      estimatedImpact: pain.painScore,
      timeCostScore: Math.max(...rows.map((row) => scoreIssueTimeCost(row.severity))),
      painLevel: pain.level,
      ownerRequired: rows.some((row) => row.owner_required),
      status: latest.status,
    }
  })

  return rankHauntingWeekItems(sortHauntingWeekItems(items, sort).slice(0, maxItems))
}
