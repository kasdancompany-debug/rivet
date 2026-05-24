import type { InterruptionActionPlanView, RelatedModuleRef, RelatedStandardRef } from "@/lib/owner-interruptions/action-plan/types"
import type { Tables } from "@/types/database"

export function relatedStandardFromPlan(
  plan: Tables<"interruption_action_plans">,
  standards: Tables<"standards">[]
): RelatedStandardRef | null {
  if (!plan.related_standard_id) return null
  const s = standards.find((row) => row.id === plan.related_standard_id)
  return s ? { id: s.id, title: s.title, status: s.status } : null
}

export function relatedModuleFromPlan(
  plan: Tables<"interruption_action_plans">,
  modules: Tables<"training_modules">[]
): RelatedModuleRef | null {
  if (!plan.related_module_id) return null
  const m = modules.find((row) => row.id === plan.related_module_id)
  return m ? { id: m.id, title: m.title, assignedRole: m.assigned_role } : null
}

export type ActionPlanBundle = {
  view: InterruptionActionPlanView
  plan: Tables<"interruption_action_plans">
}
