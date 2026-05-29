import type { Tables } from "@/types/database"

import { buildInterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/build-action-plan-view"
import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { computeFixImpact } from "@/lib/owner-interruptions/outcomes/compute-fix-impact"
import {
  countMatchingAskQueries,
  findMatchingAskStandardId,
  hasVerifiedAskAnswer,
  type AskQueryRow,
} from "@/lib/owner-interruptions/outcomes/match-ask-rivet"
import {
  buildRecommendations,
  resolveInterruptionOutcomes,
} from "@/lib/owner-interruptions/outcomes/resolve-outcomes"

type StandardRow = Pick<Tables<"standards">, "id" | "title" | "status">
type ModuleRow = Pick<Tables<"training_modules">, "id" | "title">

export function enrichInterruptionActionPlanView(input: {
  plan: Tables<"interruption_action_plans">
  interruption: Pick<Tables<"owner_interruptions">, "summary" | "kind">
  historyRows: Tables<"owner_interruptions">[]
  standards: StandardRow[]
  modules: ModuleRow[]
  trainingProgress: Pick<Tables<"training_progress">, "training_module_id">[]
  askQueries: AskQueryRow[]
  standardIdsWithMedia?: Set<string>
  isOwner: boolean
}): InterruptionActionPlanView {
  const standardIdsWithMedia = input.standardIdsWithMedia ?? new Set<string>()
  const base = buildInterruptionActionPlanView({
    plan: input.plan,
    isOwner: input.isOwner,
  })

  const askMatchCount = countMatchingAskQueries(input.interruption.summary, input.askQueries)
  const askStandardId = findMatchingAskStandardId(input.interruption.summary, input.askQueries)
  const askVerified = hasVerifiedAskAnswer(input.interruption.summary, input.askQueries)

  const payload = input.plan.ai_payload
  const repeatCount =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? Number((payload as Record<string, unknown>).repeatCount) || 1
      : 1

  const resolvedPlayId =
    input.plan.draft_standard_id ??
    input.plan.related_standard_id ??
    askStandardId
  const standardHasMedia = resolvedPlayId ? standardIdsWithMedia.has(resolvedPlayId) : false

  const recommendations = buildRecommendations({
    repeatCount,
    fixType: input.plan.fix_type,
    relatedStandard: base.relatedStandard,
    relatedModule: base.relatedModule,
    standardHasMedia,
    askMatchCount,
    kind: input.interruption.kind,
  })

  const outcomes = resolveInterruptionOutcomes({
    plan: input.plan,
    interruptionSummary: input.interruption.summary,
    standards: input.standards,
    modules: input.modules,
    trainingProgress: input.trainingProgress,
    askStandardId,
    askVerified,
    standardHasMedia,
  })

  const impact = computeFixImpact({
    plan: input.plan,
    interruptionSummary: input.interruption.summary,
    historyRows: input.historyRows,
  })

  return {
    ...base,
    repeatCount,
    recommendations,
    outcomes,
    impact,
    askMatchCount,
  }
}
