import { describe, expect, it } from "vitest"

import { computeCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"

describe("computeCostEstimate", () => {
  const baseIssue = {
    title: "Drink remakes",
    category: "customer_complaint",
    severity: "medium",
    owner_required: false,
    status: "not_started" as const,
    created_at: "2026-05-18T12:00:00Z",
  }

  it("projects monthly cost from frequency and severity", () => {
    const history = [
      { title: "Drink remakes", created_at: "2026-05-01T12:00:00Z" },
      { title: "Drink remakes", created_at: "2026-05-10T12:00:00Z" },
      { title: "Drink remakes", created_at: "2026-05-18T12:00:00Z" },
    ]

    const result = computeCostEstimate({ issue: baseIssue, history })

    expect(result.drivers.incidentsPerMonth).toBe(3)
    expect(result.laborImpactUsd).toBeGreaterThan(0)
    expect(result.lostSalesUsd).toBeGreaterThan(0)
    expect(result.monthlyProjectionUsd).toBe(
      result.laborImpactUsd + result.lostSalesUsd + result.ownerTimeUsd
    )
  })

  it("increases owner time when owner is required", () => {
    const withOwner = computeCostEstimate({
      issue: { ...baseIssue, owner_required: true, severity: "high" },
    })
    const withoutOwner = computeCostEstimate({
      issue: { ...baseIssue, owner_required: false, severity: "high" },
    })

    expect(withOwner.ownerTimeUsd).toBeGreaterThan(withoutOwner.ownerTimeUsd)
  })

  it("dampens projection when resolved", () => {
    const open = computeCostEstimate({ issue: baseIssue })
    const resolved = computeCostEstimate({
      issue: { ...baseIssue, status: "resolved" },
    })

    expect(resolved.monthlyProjectionUsd).toBeLessThan(open.monthlyProjectionUsd)
    expect(resolved.ownerTimeUsd).toBe(0)
  })
})
