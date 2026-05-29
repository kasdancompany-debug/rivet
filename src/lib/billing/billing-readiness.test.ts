import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"

import {
  getBillingReadiness,
  isBillingIntentStarted,
  missingBillingEnvVars,
  shouldEnforceBillingGate,
} from "@/lib/billing/billing-readiness"
import { isBillingEnforced } from "@/lib/billing/config"

const KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_RIVET_ONE_TIME_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "RIVET_BILLING_DISABLED",
] as const

describe("billing readiness", () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development")
    for (const k of KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  it("reports off when no billing vars are set", () => {
    expect(getBillingReadiness().status).toBe("off")
    expect(isBillingEnforced()).toBe(false)
    expect(shouldEnforceBillingGate()).toBe(false)
  })

  it("disables paywall and checkout when RIVET_BILLING_DISABLED is set", () => {
    for (const k of KEYS) {
      process.env[k] = "set"
    }
    process.env.RIVET_BILLING_DISABLED = "true"
    expect(getBillingReadiness().status).toBe("off")
    expect(isBillingEnforced()).toBe(false)
    expect(shouldEnforceBillingGate()).toBe(false)
    expect(getBillingReadiness().message).toContain("RIVET_BILLING_DISABLED")
  })

  it("reports misconfigured when only some vars are set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x"
    process.env.STRIPE_RIVET_ONE_TIME_PRICE_ID = "price_x"
    expect(isBillingIntentStarted()).toBe(true)
    expect(getBillingReadiness().status).toBe("misconfigured")
    expect(missingBillingEnvVars()).toContain("STRIPE_WEBHOOK_SECRET")
    expect(shouldEnforceBillingGate()).toBe(false)
    expect(isBillingEnforced()).toBe(false)
  })

  it("reports ready when all vars are set", () => {
    for (const k of KEYS) {
      process.env[k] = "set"
    }
    expect(getBillingReadiness().status).toBe("ready")
    expect(isBillingEnforced()).toBe(true)
    expect(shouldEnforceBillingGate()).toBe(true)
    expect(getBillingReadiness().message).toBeNull()
  })

  it("includes missing var names in development message", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x"
    const msg = getBillingReadiness().message
    expect(msg).toContain("STRIPE_WEBHOOK_SECRET")
  })
})
