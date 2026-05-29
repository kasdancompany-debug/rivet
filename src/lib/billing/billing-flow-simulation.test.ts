import { describe, expect, it } from "vitest"

import { buildRivetCheckoutMetadata, parseRivetCheckoutMetadata, rivetCheckoutSuccessUrl } from "@/lib/billing/checkout-metadata"
import { isFounderPurchaseComplete } from "@/lib/billing/founder-purchase-complete"
import { shouldEnforceBillingGate, getBillingReadiness } from "@/lib/billing/billing-readiness"
import { isBillingEnforced } from "@/lib/billing/config"
import { resolveWorkspaceBillingAccess } from "@/lib/billing/workspace-access"
import { RIVET_BILLING_PLAN } from "@/lib/billing/plans"

/**
 * End-to-end billing flow simulation (no live Stripe).
 * Covers checkout metadata → return URL → access resolution → installment rules.
 */
describe("billing flow simulation", () => {
  it("once payment: metadata → success URL → grandfathered access", () => {
    const metadata = buildRivetCheckoutMetadata({
      userId: "user-abc",
      workspaceId: "biz-xyz",
      email: "owner@test.com",
      paymentOption: "once",
    })

    const session = {
      id: "cs_sim_once",
      payment_status: "paid",
      metadata,
      client_reference_id: "user-abc",
      customer_email: "owner@test.com",
    }

    const parsed = parseRivetCheckoutMetadata(session)
    expect(parsed.missing).toEqual([])

    expect(rivetCheckoutSuccessUrl("https://app.rivet.test")).toContain("session_id={CHECKOUT_SESSION_ID}")

    const purchases = [{ payment_option: "once", amount: 79900, status: "paid" }]
    expect(isFounderPurchaseComplete(purchases)).toBe(true)

    const access = resolveWorkspaceBillingAccess({
      business: {
        billing_plan: RIVET_BILLING_PLAN.founder_lifetime,
        founder_grandfathered_at: "2026-05-01T00:00:00.000Z",
      },
      hasCompletedFounderPurchase: true,
      subscriptionStatus: null,
    })
    expect(access.hasAppAccess).toBe(true)
    expect(access.founderGrandfathered).toBe(true)
  })

  it("installment 1/3: paid row but no app access until complete", () => {
    const purchases = [{ payment_option: "installment_3", amount: 29900, status: "paid" }]
    expect(isFounderPurchaseComplete(purchases)).toBe(false)

    const access = resolveWorkspaceBillingAccess({
      business: { billing_plan: null, founder_grandfathered_at: null },
      hasCompletedFounderPurchase: false,
      subscriptionStatus: null,
    })
    expect(access.hasAppAccess).toBe(false)
  })

  it("installment 3/3: access after third payment", () => {
    const purchases = [
      { payment_option: "installment_3", amount: 29900, status: "paid" },
      { payment_option: "installment_3", amount: 29900, status: "paid" },
      { payment_option: "installment_3", amount: 29900, status: "paid" },
    ]
    expect(isFounderPurchaseComplete(purchases)).toBe(true)

    const access = resolveWorkspaceBillingAccess({
      business: {
        billing_plan: RIVET_BILLING_PLAN.founder_lifetime,
        founder_grandfathered_at: "2026-05-01T00:00:00.000Z",
      },
      hasCompletedFounderPurchase: true,
      subscriptionStatus: null,
    })
    expect(access.hasAppAccess).toBe(true)
  })

  it("misconfigured billing: gate off, checkout off", () => {
    const readiness = getBillingReadiness()
    if (readiness.status === "misconfigured") {
      expect(shouldEnforceBillingGate()).toBe(false)
      expect(isBillingEnforced()).toBe(false)
    }
  })
})
