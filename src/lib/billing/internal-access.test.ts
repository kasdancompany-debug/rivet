import { describe, expect, it, afterEach, vi } from "vitest"

import { canAccessInternalBillingDiagnostics } from "@/lib/billing/internal-access"

describe("canAccessInternalBillingDiagnostics", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("allows any email in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(canAccessInternalBillingDiagnostics("anyone@example.com")).toBe(true)
  })

  it("denies production when no admin list is configured", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.RIVET_INTERNAL_ADMIN_EMAILS
    expect(canAccessInternalBillingDiagnostics("owner@example.com")).toBe(false)
  })

  it("allows listed admin email in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("RIVET_INTERNAL_ADMIN_EMAILS", "Owner@Example.com, other@test.com")
    expect(canAccessInternalBillingDiagnostics("owner@example.com")).toBe(true)
    expect(canAccessInternalBillingDiagnostics("other@test.com")).toBe(true)
    expect(canAccessInternalBillingDiagnostics("stranger@test.com")).toBe(false)
  })
})
