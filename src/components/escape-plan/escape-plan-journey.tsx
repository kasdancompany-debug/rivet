"use client"

import type { Tables } from "@/types/database"
import { EscapePlanGuidedJourney } from "@/components/escape-plan/escape-plan-guided-journey"
import { EscapePlanLegacyJourney } from "@/components/escape-plan/escape-plan-legacy-journey"

type Plan = Tables<"owner_escape_plans">

export function EscapePlanJourney({
  plan,
  tasks,
  businessName,
}: {
  plan: Plan
  tasks: Tables<"owner_escape_plan_tasks">[]
  businessName: string
}) {
  if ((plan.plan_version ?? 1) >= 2) {
    return <EscapePlanGuidedJourney plan={plan} tasks={tasks} businessName={businessName} />
  }
  return <EscapePlanLegacyJourney plan={plan} tasks={tasks} businessName={businessName} />
}
