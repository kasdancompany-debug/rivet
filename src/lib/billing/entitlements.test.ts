import { describe, expect, it } from "vitest"

import { resolveWorkspaceEntitlements } from "@/lib/billing/entitlements"
import { RIVET_BILLING_PLAN } from "@/lib/billing/plans"
import type { WorkspaceBillingAccess } from "@/lib/billing/workspace-access"

describe("resolveWorkspaceEntitlements", () => {
  it("grants full Rivet Core to grandfathered founders", () => {
    const access: WorkspaceBillingAccess = {
      hasAppAccess: true,
      billingPlan: RIVET_BILLING_PLAN.founder_lifetime,
      founderGrandfathered: true,
      hasCompletedFounderPurchase: true,
      subscriptionStatus: "canceled",
      accessSource: "founder_lifetime",
    }
    const ent = resolveWorkspaceEntitlements(access)
    expect(ent.founderGrandfathered).toBe(true)
    expect(ent.entitlements).toContain("ask_rivet")
    expect(ent.accessLabel).toBe("Founder Lifetime Access")
  })
})
