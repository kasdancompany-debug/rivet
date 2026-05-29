import type { Tables } from "@/types/database"

import { enrichInterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/enrich-action-plan-view"
import type { InterruptionOutcomeItem } from "@/lib/owner-interruptions/outcomes/types"
import type { AskQueryRow } from "@/lib/owner-interruptions/outcomes/match-ask-rivet"

export type InterruptionSystemImprovement = {
  planId: string
  interruptionId: string
  summary: string
  status: Tables<"interruption_action_plans">["status"]
  publishedAt: string | null
  outcomes: InterruptionOutcomeItem[]
  completedCount: number
  impactLabel: string | null
}

export function buildSystemImprovements(input: {
  plans: Tables<"interruption_action_plans">[]
  interruptionsById: Map<string, Tables<"owner_interruptions">>
  historyRows: Tables<"owner_interruptions">[]
  standards: Pick<Tables<"standards">, "id" | "title" | "status">[]
  modules: Pick<Tables<"training_modules">, "id" | "title">[]
  trainingProgress: Pick<Tables<"training_progress">, "training_module_id">[]
  askQueries: AskQueryRow[]
  standardIdsWithMedia?: Set<string>
  isOwner: boolean
  maxItems?: number
}): InterruptionSystemImprovement[] {
  const max = input.maxItems ?? 6

  return input.plans
    .filter((plan) => plan.status !== "dismissed")
    .map((plan) => {
      const interruption = input.interruptionsById.get(plan.interruption_id)
      if (!interruption) return null

      const view = enrichInterruptionActionPlanView({
        plan,
        interruption,
        historyRows: input.historyRows,
        standards: input.standards,
        modules: input.modules,
        trainingProgress: input.trainingProgress,
        askQueries: input.askQueries,
        standardIdsWithMedia: input.standardIdsWithMedia,
        isOwner: input.isOwner,
      })

      const completedCount = view.outcomes.filter((o) => o.complete).length

      return {
        planId: plan.id,
        interruptionId: plan.interruption_id,
        summary: interruption.summary,
        status: plan.status,
        publishedAt: plan.published_at,
        outcomes: view.outcomes,
        completedCount,
        impactLabel: view.impact?.trackingLabel ?? null,
      }
    })
    .filter((row): row is InterruptionSystemImprovement => row != null)
    .sort((a, b) => {
      const aTime = a.publishedAt ?? ""
      const bTime = b.publishedAt ?? ""
      return bTime.localeCompare(aTime)
    })
    .slice(0, max)
}

export function improvementSummaryForOutcomes(outcomes: InterruptionOutcomeItem[]): string | null {
  const complete = outcomes.filter((o) => o.complete).length
  if (complete === 0) return null
  return `${complete}/${outcomes.length} system fixes shipped`
}
