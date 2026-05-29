import type { Tables } from "@/types/database"

import {
  detectInterruptionFix,
  findRelatedModule,
  findRelatedStandard,
} from "@/lib/owner-interruptions/action-plan/analyze-interruption"
import { buildOperationalFixActions } from "@/lib/owner-interruptions/fix-suggestions/build-operational-fix-actions"
import type { InterruptionFixSuggestion } from "@/lib/owner-interruptions/fix-suggestions/types"
import { countMatchingAskQueries } from "@/lib/owner-interruptions/outcomes/match-ask-rivet"
import type { AskQueryRow } from "@/lib/owner-interruptions/outcomes/match-ask-rivet"
import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import type { OwnerInterruptionRepeatCategory } from "@/lib/owner-interruptions/types"
import type { OwnerInterruptionKind } from "@/types/database"

const HISTORY_WINDOW_DAYS = 14
const MONTHLY_MULTIPLIER = 30 / HISTORY_WINDOW_DAYS
const PREVENTION_RATE = 0.7

function dominantKind(
  rows: Tables<"owner_interruptions">[]
): OwnerInterruptionKind | null {
  const counts = new Map<OwnerInterruptionKind, number>()
  for (const r of rows) {
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
  }
  let best: OwnerInterruptionKind | null = null
  let bestN = 0
  for (const [kind, n] of counts) {
    if (n > bestN) {
      best = kind
      bestN = n
    }
  }
  return best
}

function estimateImpact(count: number, totalMinutes: number): {
  estimatedInterruptionsPrevented: number
  estimatedOwnerMinutesRecovered: number
} {
  const monthlyOccurrences = count * MONTHLY_MULTIPLIER
  const estimatedInterruptionsPrevented = Math.max(1, Math.round(monthlyOccurrences * PREVENTION_RATE))
  const avgMinutes = count > 0 ? totalMinutes / count : 8
  const estimatedOwnerMinutesRecovered = Math.round(estimatedInterruptionsPrevented * avgMinutes)
  return { estimatedInterruptionsPrevented, estimatedOwnerMinutesRecovered }
}

export function generateInterruptionFixSuggestions(input: {
  repeatCategories: OwnerInterruptionRepeatCategory[]
  historyRows: Tables<"owner_interruptions">[]
  standards?: Tables<"standards">[]
  modules?: Tables<"training_modules">[]
  standardIdsWithMedia?: Set<string>
  askQueries?: AskQueryRow[]
  maxSuggestions?: number
}): InterruptionFixSuggestion[] {
  const max = input.maxSuggestions ?? 3
  const standards = input.standards ?? []
  const modules = input.modules ?? []
  const mediaIds = input.standardIdsWithMedia ?? new Set<string>()
  const askQueries = input.askQueries ?? []
  const suggestions: InterruptionFixSuggestion[] = []

  for (const pattern of input.repeatCategories) {
    const matching = input.historyRows.filter(
      (r) => normalizeSummaryKey(r.summary) === pattern.key
    )
    if (matching.length < 2) continue

    const kind = dominantKind(matching)
    const totalMinutes = matching.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0)
    const analysis = detectInterruptionFix(pattern.label, kind, matching)
    const relatedStandard = findRelatedStandard(standards, pattern.label)
    const relatedModule = findRelatedModule(modules, pattern.label)
    const standardHasMedia = relatedStandard ? mediaIds.has(relatedStandard.id) : false
    const askMatchCount = countMatchingAskQueries(pattern.label, askQueries)

    const actions = buildOperationalFixActions({
      label: pattern.label,
      repeatCount: pattern.count,
      kind,
      suggestedTitle: analysis.suggestedTitle,
      suggestedDescription: analysis.suggestedDescription,
      capturePrompt: analysis.capturePrompt,
      relatedStandard,
      relatedModule,
      standardHasMedia,
      askMatchCount,
    })

    const impact = estimateImpact(pattern.count, totalMinutes)
    const sampleInterruptionId =
      [...matching].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )[0]?.id ?? null

    const createHref = actions[0]?.href ?? `/sops/capture`

    suggestions.push({
      patternKey: pattern.key,
      problemTitle: pattern.label,
      rootCause: analysis.rootCause,
      fixType: analysis.fixType,
      suggestedTitle: analysis.suggestedTitle,
      suggestedDescription: analysis.suggestedDescription,
      capturePrompt: analysis.capturePrompt,
      repeatCount: pattern.count,
      ...impact,
      createHref,
      actions,
      sampleInterruptionId,
      askMatchCount,
    })
  }

  return suggestions
    .sort((a, b) => b.repeatCount - a.repeatCount || b.estimatedOwnerMinutesRecovered - a.estimatedOwnerMinutesRecovered)
    .slice(0, max)
}
