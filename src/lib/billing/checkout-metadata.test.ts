import { describe, expect, it } from "vitest"

import {
  buildRivetCheckoutMetadata,
  parseRivetCheckoutMetadata,
  rivetCheckoutCancelUrl,
  rivetCheckoutSuccessUrl,
} from "@/lib/billing/checkout-metadata"

describe("buildRivetCheckoutMetadata", () => {
  it("includes user_id, workspace_id, and email when provided", () => {
    expect(
      buildRivetCheckoutMetadata({
        userId: "user-123",
        workspaceId: "ws-456",
        email: "owner@example.com",
      })
    ).toEqual({
      user_id: "user-123",
      workspace_id: "ws-456",
      email: "owner@example.com",
      rivet_product: "rivet_founder_lifetime_v1",
      rivet_billing_plan: "founder_lifetime",
      rivet_payment_option: "once",
    })
  })

  it("records installment payment option", () => {
    expect(
      buildRivetCheckoutMetadata({
        userId: "user-123",
        workspaceId: "ws-456",
        paymentOption: "installment_3",
      }).rivet_payment_option
    ).toBe("installment_3")
  })

  it("omits email when unavailable", () => {
    expect(
      buildRivetCheckoutMetadata({
        userId: "user-123",
        workspaceId: "ws-456",
      })
    ).toEqual({
      user_id: "user-123",
      workspace_id: "ws-456",
      rivet_product: "rivet_founder_lifetime_v1",
      rivet_billing_plan: "founder_lifetime",
      rivet_payment_option: "once",
    })
  })
})

describe("parseRivetCheckoutMetadata", () => {
  it("reads canonical keys", () => {
    expect(
      parseRivetCheckoutMetadata({
        metadata: {
          user_id: "user-123",
          workspace_id: "ws-456",
          email: "owner@example.com",
        },
      })
    ).toEqual({
      userId: "user-123",
      workspaceId: "ws-456",
      email: "owner@example.com",
      missing: [],
    })
  })

  it("falls back to legacy keys and client_reference_id", () => {
    expect(
      parseRivetCheckoutMetadata({
        metadata: {
          supabase_user_id: "legacy-user",
          business_id: "legacy-ws",
        },
        client_reference_id: "ignored-when-metadata-present",
        customer_email: "legacy@example.com",
      })
    ).toEqual({
      userId: "legacy-user",
      workspaceId: "legacy-ws",
      email: "legacy@example.com",
      missing: [],
    })
  })

  it("reports missing user_id and workspace_id", () => {
    expect(parseRivetCheckoutMetadata({ metadata: {} })).toEqual({
      userId: null,
      workspaceId: null,
      email: null,
      missing: ["user_id", "workspace_id"],
    })
  })
})

describe("checkout return URLs", () => {
  it("uses NEXT_PUBLIC_SITE_URL origin without trailing slash", () => {
    expect(rivetCheckoutSuccessUrl("https://rivet-tan.vercel.app/")).toBe(
      "https://rivet-tan.vercel.app/subscribe?billing=success&session_id={CHECKOUT_SESSION_ID}"
    )
    expect(rivetCheckoutCancelUrl("https://rivet-tan.vercel.app/")).toBe(
      "https://rivet-tan.vercel.app/subscribe?billing=canceled"
    )
  })
})
