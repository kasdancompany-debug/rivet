import { describe, expect, it } from "vitest"

import {
  FOUNDER_INSTALLMENT_PAYMENT_COUNT,
  FOUNDER_INSTALLMENT_TOTAL_CENTS,
  isFounderPurchaseComplete,
} from "@/lib/billing/founder-purchase-complete"

describe("isFounderPurchaseComplete", () => {
  it("accepts a single once payment", () => {
    expect(
      isFounderPurchaseComplete([{ payment_option: "once", amount: 79900, status: "paid" }])
    ).toBe(true)
  })

  it("accepts legacy rows without payment_option", () => {
    expect(isFounderPurchaseComplete([{ payment_option: null, amount: 79900, status: "paid" }])).toBe(
      true
    )
  })

  it("rejects a single installment payment", () => {
    expect(
      isFounderPurchaseComplete([{ payment_option: "installment_3", amount: 29900, status: "paid" }])
    ).toBe(false)
  })

  it("accepts three installment payments", () => {
    const rows = Array.from({ length: FOUNDER_INSTALLMENT_PAYMENT_COUNT }, () => ({
      payment_option: "installment_3" as const,
      amount: 29900,
      status: "paid",
    }))
    expect(isFounderPurchaseComplete(rows)).toBe(true)
  })

  it("accepts installment sum threshold", () => {
    expect(
      isFounderPurchaseComplete([
        { payment_option: "installment_3", amount: FOUNDER_INSTALLMENT_TOTAL_CENTS, status: "paid" },
      ])
    ).toBe(true)
  })
})
