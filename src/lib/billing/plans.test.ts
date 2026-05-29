import { describe, expect, it } from "vitest"

import {
  checkoutProductToBillingPlan,
  isFounderGrandfathered,
  isFounderLifetimeCheckoutProduct,
  RIVET_BILLING_PLAN,
} from "@/lib/billing/plans"
import { resolveWorkspaceBillingAccess } from "@/lib/billing/workspace-access"

describe("founder billing plans", () => {
  it("recognizes founder checkout product ids", () => {
    expect(isFounderLifetimeCheckoutProduct("rivet_founder_lifetime_v1")).toBe(true)
    expect(isFounderLifetimeCheckoutProduct("rivet_lifetime_v1")).toBe(true)
    expect(isFounderLifetimeCheckoutProduct(null)).toBe(false)
    expect(isFounderLifetimeCheckoutProduct("")).toBe(false)
    expect(checkoutProductToBillingPlan("rivet_lifetime_v1")).toBe(RIVET_BILLING_PLAN.founder_lifetime)
  })

  it("grandfathers founder plan and timestamp", () => {
    expect(
      isFounderGrandfathered({
        billingPlan: RIVET_BILLING_PLAN.founder_lifetime,
        founderGrandfatheredAt: null,
      })
    ).toBe(true)
    expect(
      isFounderGrandfathered({
        billingPlan: null,
        founderGrandfatheredAt: "2026-05-01T00:00:00.000Z",
      })
    ).toBe(true)
  })

  it("keeps founder access when a future subscription lapses", () => {
    const access = resolveWorkspaceBillingAccess({
      business: {
        billing_plan: RIVET_BILLING_PLAN.founder_lifetime,
        founder_grandfathered_at: "2026-05-01T00:00:00.000Z",
      },
      hasCompletedFounderPurchase: true,
      subscriptionStatus: "canceled",
    })
    expect(access.hasAppAccess).toBe(true)
    expect(access.accessSource).toBe("founder_lifetime")
  })

  it("allows subscription access for non-founder workspaces", () => {
    const access = resolveWorkspaceBillingAccess({
      business: { billing_plan: RIVET_BILLING_PLAN.subscription_core, founder_grandfathered_at: null },
      hasCompletedFounderPurchase: false,
      subscriptionStatus: "active",
    })
    expect(access.hasAppAccess).toBe(true)
    expect(access.accessSource).toBe("subscription")
  })
})
