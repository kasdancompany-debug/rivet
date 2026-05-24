import { describe, expect, it } from "vitest"

import { computeSopImpactIfMissing } from "./sop-impact-if-missing"

describe("computeSopImpactIfMissing", () => {
  it("returns opening-specific consequences for cafe-style opening SOPs", () => {
    const impacts = computeSopImpactIfMissing({
      category: "opening",
      importance_level: 5,
      owner_dependency_level: 4,
      status: "active",
    })

    expect(impacts.length).toBeGreaterThanOrEqual(2)
    expect(impacts.length).toBeLessThanOrEqual(4)
    expect(impacts.some((line) => line.toLowerCase().includes("line speed"))).toBe(true)
    expect(impacts.some((line) => line.toLowerCase().includes("routed back"))).toBe(true)
  })

  it("falls back to generic operational impacts for unknown categories", () => {
    const impacts = computeSopImpactIfMissing({
      category: "other",
      importance_level: 3,
      owner_dependency_level: 3,
      status: "active",
    })

    expect(impacts.length).toBeGreaterThanOrEqual(2)
    expect(impacts.some((line) => line.toLowerCase().includes("improv"))).toBe(true)
  })
})
