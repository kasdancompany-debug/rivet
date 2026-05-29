import { describe, expect, it } from "vitest"

import {
  sanitizeBusinessBillingPatch,
  validateBusinessBillingPlanChange,
} from "@/lib/billing/billing-guards"
import { RIVET_BILLING_PLAN } from "@/lib/billing/plans"

describe("billing-guards", () => {
  const grandfathered = {
    billing_plan: RIVET_BILLING_PLAN.founder_lifetime,
    founder_grandfathered_at: "2026-05-01T00:00:00.000Z",
  }

  it("blocks moving a grandfathered workspace to a future subscription plan", () => {
    const result = validateBusinessBillingPlanChange({
      current: grandfathered,
      nextBillingPlan: RIVET_BILLING_PLAN.subscription_core,
    })
    expect(result.allowed).toBe(false)
  })

  it("blocks clearing founder_grandfathered_at", () => {
    const result = validateBusinessBillingPlanChange({
      current: grandfathered,
      clearGrandfatheredAt: true,
    })
    expect(result.allowed).toBe(false)
  })

  it("strips unsafe billing_plan patches", () => {
    const patch = sanitizeBusinessBillingPatch(grandfathered, {
      billing_plan: RIVET_BILLING_PLAN.subscription_pro,
    })
    expect(patch.billing_plan).toBeUndefined()
  })
})
