import { describe, expect, it, vi, beforeEach } from "vitest"
import type Stripe from "stripe"

import { syncRivetPurchaseFromCheckoutSession } from "@/lib/billing/sync-rivet-purchase"

function chainMaybeSingle(data: unknown) {
  return {
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    }),
  }
}

function mockAdmin(paidRows: { payment_option: string | null; amount: number; status: string }[]) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })

  const from = vi.fn((table: string) => {
    if (table === "rivet_purchases") {
      return {
        select: vi.fn((cols: string) => {
          if (cols === "status, purchased_at") {
            return chainMaybeSingle(null)
          }
          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: paidRows, error: null }),
            }),
          }
        }),
        upsert,
      }
    }
    if (table === "businesses") {
      return {
        select: vi.fn(() =>
          chainMaybeSingle({
            billing_plan: "founder_lifetime",
            founder_grandfathered_at: paidRows.length ? "2026-01-01" : null,
          })
        ),
        update,
      }
    }
    return { select: vi.fn(() => chainMaybeSingle(null)) }
  })

  return {
    admin: { from } as unknown as Parameters<typeof syncRivetPurchaseFromCheckoutSession>[0],
    upsert,
    update,
    updateEq,
  }
}

describe("syncRivetPurchaseFromCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseSession = {
    id: "cs_test_123",
    payment_status: "paid",
    amount_total: 79900,
    currency: "cad",
    customer: "cus_123",
    payment_intent: "pi_123",
    metadata: {
      user_id: "user-1",
      workspace_id: "biz-1",
      rivet_product: "rivet_founder_lifetime_v1",
      rivet_billing_plan: "founder_lifetime",
      rivet_payment_option: "once",
    },
  } as unknown as Stripe.Checkout.Session

  it("reports missing metadata", async () => {
    const admin = { from: vi.fn() } as unknown as Parameters<typeof syncRivetPurchaseFromCheckoutSession>[0]
    const result = await syncRivetPurchaseFromCheckoutSession(admin, {
      ...baseSession,
      metadata: {},
    } as unknown as Stripe.Checkout.Session)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("missing_metadata")
      expect(result.missing).toContain("user_id")
    }
  })

  it("grandfathers on completed once purchase", async () => {
    const { admin, updateEq } = mockAdmin([
      { payment_option: "once", amount: 79900, status: "paid" },
    ])
    const result = await syncRivetPurchaseFromCheckoutSession(admin, baseSession)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.founderGrandfathered).toBe(true)
    }
    expect(updateEq).toHaveBeenCalledWith("id", "biz-1")
  })

  it("does not grandfather after first installment only", async () => {
    const { admin, updateEq } = mockAdmin([
      { payment_option: "installment_3", amount: 29900, status: "paid" },
    ])
    const session = {
      ...baseSession,
      metadata: { ...baseSession.metadata!, rivet_payment_option: "installment_3" },
      amount_total: 29900,
    } as unknown as Stripe.Checkout.Session
    const result = await syncRivetPurchaseFromCheckoutSession(admin, session)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.founderGrandfathered).toBe(false)
    }
    expect(updateEq).not.toHaveBeenCalled()
  })
})
