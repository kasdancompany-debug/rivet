import type { Tables } from "@/types/database"

import { generateInterruptionFixSuggestions } from "@/lib/owner-interruptions/fix-suggestions/generate-fix-suggestions"
import type { AskQueryRow } from "@/lib/owner-interruptions/outcomes/match-ask-rivet"
import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import type { OwnerInterruptionRepeatCategory, OwnerInterruptionTopLeak } from "@/lib/owner-interruptions/types"

function fallbackCreateHref(label: string): string {
  const params = new URLSearchParams()
  params.set("title", `${label} play`)
  params.set("prompt", `This keeps routing to the owner: ${label}. Write a play so the team can handle it without calling you.`)
  return `/sops/capture?${params.toString()}`
}

function summarizeFixBundle(actions: { label: string }[]): string {
  if (actions.length === 0) return "Write a play so the team can handle this without you."
  if (actions.length === 1) return actions[0]!.label
  return actions.map((a) => a.label).join(" · ")
}

export function buildTopLeaks(input: {
  repeatCategories: OwnerInterruptionRepeatCategory[]
  historyRows: Tables<"owner_interruptions">[]
  standards?: Tables<"standards">[]
  modules?: Tables<"training_modules">[]
  standardIdsWithMedia?: Set<string>
  askQueries?: AskQueryRow[]
  maxLeaks?: number
}): OwnerInterruptionTopLeak[] {
  const max = input.maxLeaks ?? 8
  const fixSuggestions = generateInterruptionFixSuggestions({
    repeatCategories: input.repeatCategories,
    historyRows: input.historyRows,
    standards: input.standards,
    modules: input.modules,
    standardIdsWithMedia: input.standardIdsWithMedia,
    askQueries: input.askQueries,
    maxSuggestions: max,
  })
  const fixByKey = new Map(fixSuggestions.map((f) => [f.patternKey, f]))

  const leaks = input.repeatCategories.map((cat) => {
    const matching = input.historyRows.filter((r) => normalizeSummaryKey(r.summary) === cat.key)
    const estimatedOwnerMinutes = matching.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0)
    const fix = fixByKey.get(cat.key)
    const fixType = fix?.fixType ?? "sop"

    return {
      key: cat.key,
      name: cat.label,
      occurrences: cat.count,
      estimatedOwnerMinutes,
      suggestedFix: fix ? summarizeFixBundle(fix.actions) : "Write a play so the team can handle this without you.",
      fixType,
      createHref: fix?.createHref ?? fallbackCreateHref(cat.label),
    }
  })

  return leaks
    .sort((a, b) => b.estimatedOwnerMinutes - a.estimatedOwnerMinutes || b.occurrences - a.occurrences)
    .slice(0, max)
    .map((leak, index) => ({ ...leak, rank: index + 1 }))
}
