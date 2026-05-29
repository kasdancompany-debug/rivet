import { FOUNDER_GRANDFATHER_CONTRACT } from "@/lib/billing/founder-offer"
import {
  isFounderGrandfathered,
  isFounderLifetimeBillingPlan,
  RIVET_BILLING_PLAN,
  type RivetBillingPlanId,
} from "@/lib/billing/plans"

export type BusinessBillingRow = {
  billing_plan: string | null
  founder_grandfathered_at: string | null
}

export type BillingPlanChangeResult =
  | { allowed: true }
  | { allowed: false; reason: string }

/**
 * Founder-grandfathered workspaces cannot be moved to a future subscription-only plan
 * or stripped of grandfathering — protects founder promises after catalog expansion.
 */
export function validateBusinessBillingPlanChange(input: {
  current: BusinessBillingRow
  nextBillingPlan?: RivetBillingPlanId | string | null
  clearGrandfatheredAt?: boolean
}): BillingPlanChangeResult {
  const grandfathered = isFounderGrandfathered({
    billingPlan: input.current.billing_plan,
    founderGrandfatheredAt: input.current.founder_grandfathered_at,
  })

  if (!grandfathered) {
    return { allowed: true }
  }

  if (input.clearGrandfatheredAt) {
    return {
      allowed: false,
      reason:
        "Founder Lifetime Access cannot be removed from a grandfathered workspace.",
    }
  }

  const next = input.nextBillingPlan ?? null
  if (
    next &&
    next !== FOUNDER_GRANDFATHER_CONTRACT.planId &&
    !isFounderLifetimeBillingPlan(next)
  ) {
    return {
      allowed: false,
      reason:
        "This workspace has Founder Lifetime Access. Future subscription tiers cannot replace grandfathered access.",
    }
  }

  return { allowed: true }
}

/** Strip unsafe billing fields before any business update (admin scripts, future tier sync). */
export function sanitizeBusinessBillingPatch(
  current: BusinessBillingRow,
  patch: Partial<BusinessBillingRow>
): Partial<BusinessBillingRow> {
  const out = { ...patch }
  const check = validateBusinessBillingPlanChange({
    current,
    nextBillingPlan: out.billing_plan ?? undefined,
    clearGrandfatheredAt: out.founder_grandfathered_at === null,
  })

  if (!check.allowed) {
    if (
      out.billing_plan &&
      !isFounderLifetimeBillingPlan(out.billing_plan)
    ) {
      delete out.billing_plan
    }
    if (out.founder_grandfathered_at === null) {
      delete out.founder_grandfathered_at
    }
  }

  return out
}

/** Subscription lapse must never revoke founder access. */
export function subscriptionStatusAffectsAccess(input: {
  founderGrandfathered: boolean
  subscriptionStatus: string | null | undefined
}): boolean {
  if (input.founderGrandfathered) return false
  return true
}
