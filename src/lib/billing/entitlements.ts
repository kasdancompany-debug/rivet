import type { WorkspaceBillingAccess } from "@/lib/billing/workspace-access"
import { RIVET_BILLING_PLAN, type RivetBillingPlanId } from "@/lib/billing/plans"

/** Rivet Core capabilities — founders receive all permanently. */
export const RIVET_CORE_ENTITLEMENTS = [
  "plays",
  "training_center",
  "ask_rivet",
  "owner_interruptions",
  "escape_readiness",
  "operations_proof",
] as const

export type RivetCoreEntitlement = (typeof RIVET_CORE_ENTITLEMENTS)[number]

/** Future Pro tier may add entitlements here without affecting grandfathered founders. */
export const RIVET_PRO_ONLY_ENTITLEMENTS = [] as const

export type WorkspaceEntitlements = {
  planId: RivetBillingPlanId | null
  entitlements: RivetCoreEntitlement[]
  founderGrandfathered: boolean
  /** Human label for settings / billing UI */
  accessLabel: string
}

function entitlementsForPlan(plan: RivetBillingPlanId | null): RivetCoreEntitlement[] {
  if (plan === RIVET_BILLING_PLAN.founder_lifetime) {
    return [...RIVET_CORE_ENTITLEMENTS]
  }
  if (plan === RIVET_BILLING_PLAN.subscription_pro) {
    return [...RIVET_CORE_ENTITLEMENTS]
  }
  if (plan === RIVET_BILLING_PLAN.subscription_core) {
    return [...RIVET_CORE_ENTITLEMENTS]
  }
  return []
}

export function resolveWorkspaceEntitlements(access: WorkspaceBillingAccess): WorkspaceEntitlements {
  if (access.founderGrandfathered) {
    return {
      planId: RIVET_BILLING_PLAN.founder_lifetime,
      entitlements: [...RIVET_CORE_ENTITLEMENTS],
      founderGrandfathered: true,
      accessLabel: "Founder Lifetime Access",
    }
  }

  const planId = access.billingPlan
  return {
    planId,
    entitlements: entitlementsForPlan(planId),
    founderGrandfathered: false,
    accessLabel:
      access.accessSource === "subscription"
        ? planId === RIVET_BILLING_PLAN.subscription_pro
          ? "Rivet Pro"
          : "Rivet Core"
        : "No active plan",
  }
}

export function workspaceHasEntitlement(
  access: WorkspaceBillingAccess,
  entitlement: RivetCoreEntitlement
): boolean {
  return resolveWorkspaceEntitlements(access).entitlements.includes(entitlement)
}
