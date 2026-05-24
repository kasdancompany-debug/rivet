import type {
  AffectedPerson,
  InterruptionActionPlanView,
  RelatedModuleRef,
  RelatedStandardRef,
} from "@/lib/owner-interruptions/action-plan/types"
import type { InterruptionActionFixType, Tables } from "@/types/database"

function draftEditHref(input: {
  fixType: InterruptionActionFixType
  draftStandardId: string | null
  draftModuleId: string | null
}): string | null {
  if (input.fixType === "sop" && input.draftStandardId) {
    return `/sops/capture/${input.draftStandardId}`
  }
  if (input.fixType === "training_module" && input.draftModuleId) {
    return `/training/modules/${input.draftModuleId}`
  }
  return null
}

function relatedFromPayload(plan: Tables<"interruption_action_plans">): {
  relatedStandard: RelatedStandardRef | null
  relatedModule: RelatedModuleRef | null
} {
  const payload = plan.ai_payload
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { relatedStandard: null, relatedModule: null }
  }
  const p = payload as Record<string, unknown>
  return {
    relatedStandard: (p.relatedStandard as RelatedStandardRef | null) ?? null,
    relatedModule: (p.relatedModule as RelatedModuleRef | null) ?? null,
  }
}

export function buildInterruptionActionPlanView(input: {
  plan: Tables<"interruption_action_plans">
  relatedStandard?: RelatedStandardRef | null
  relatedModule?: RelatedModuleRef | null
  isOwner: boolean
}): InterruptionActionPlanView {
  const { plan, isOwner } = input
  const fromPayload = relatedFromPayload(plan)
  const relatedStandard = input.relatedStandard ?? fromPayload.relatedStandard
  const relatedModule = input.relatedModule ?? fromPayload.relatedModule
  const affectedPeople = (plan.affected_people as AffectedPerson[] | null) ?? []
  const status = plan.status
  const canApprove = isOwner && status === "draft"
  const canPublish = isOwner && status === "approved"
  const canDismiss = isOwner && status !== "published" && status !== "dismissed"

  return {
    id: plan.id,
    interruptionId: plan.interruption_id,
    status,
    fixType: plan.fix_type,
    rootCause: plan.root_cause,
    suggestedTitle: plan.suggested_title,
    suggestedDescription: plan.suggested_description,
    relatedStandard,
    relatedModule,
    draftStandardId: plan.draft_standard_id,
    draftModuleId: plan.draft_module_id,
    draftEditHref: draftEditHref({
      fixType: plan.fix_type,
      draftStandardId: plan.draft_standard_id,
      draftModuleId: plan.draft_module_id,
    }),
    affectedPeople,
    isOwner,
    canApprove,
    canPublish,
    canDismiss,
  }
}
