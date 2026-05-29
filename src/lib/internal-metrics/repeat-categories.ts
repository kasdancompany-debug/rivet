import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import type { OwnerInterruptionRepeatCategory } from "@/lib/owner-interruptions/types"
import type { Tables } from "@/types/database"

export function buildInterruptionRepeatCategories(
  rows: Tables<"owner_interruptions">[],
  minCount = 2
): OwnerInterruptionRepeatCategory[] {
  const summaryKeyToLabel = new Map<string, string>()
  const summaryCounts = new Map<string, number>()
  for (const r of rows) {
    const key = normalizeSummaryKey(r.summary)
    if (!key) continue
    if (!summaryKeyToLabel.has(key)) summaryKeyToLabel.set(key, r.summary.trim().slice(0, 120))
    summaryCounts.set(key, (summaryCounts.get(key) ?? 0) + 1)
  }
  return [...summaryCounts.entries()]
    .filter(([, n]) => n >= minCount)
    .map(([key, count]) => ({ key, label: summaryKeyToLabel.get(key) ?? key, count }))
    .sort((a, b) => b.count - a.count)
}
