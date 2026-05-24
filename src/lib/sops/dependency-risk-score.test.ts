import { describe, expect, it } from "vitest"

import { computeSopDependencyRisk, dependencyRiskBand } from "./dependency-risk-score"

describe("computeSopDependencyRisk", () => {
  it("maps owner dependency level to 0–100 score", () => {
    const risk = computeSopDependencyRisk({
      category: "opening",
      status: "active",
      importance_level: 5,
      owner_dependency_level: 4,
      estimated_time_minutes: 30,
    })
    expect(risk.score).toBe(80)
    expect(risk.band).toBe("high")
    expect(risk.bandLabel).toBe("High")
  })

  it("returns 2–4 causes without repeating verbatim user fields", () => {
    const risk = computeSopDependencyRisk(
      {
        category: "closing",
        status: "draft",
        importance_level: 5,
        owner_dependency_level: 5,
        estimated_time_minutes: 45,
      },
      1
    )
    expect(risk.causes.length).toBeGreaterThanOrEqual(2)
    expect(risk.causes.length).toBeLessThanOrEqual(4)
    expect(risk.causes.some((c) => c.toLowerCase().includes("closer") || c.includes("Owner"))).toBe(true)
  })

  it("labels low scores green band", () => {
    expect(dependencyRiskBand(20).band).toBe("low")
    expect(dependencyRiskBand(60).band).toBe("medium")
    expect(dependencyRiskBand(80).band).toBe("high")
  })

  it("raises risk when play completion is low", () => {
    const risk = computeSopDependencyRisk(
      {
        category: "opening",
        status: "active",
        importance_level: 4,
        owner_dependency_level: 3,
        estimated_time_minutes: 30,
      },
      3,
      { documentation: 30, training: 20, ownership: 25, overall: 25 }
    )

    expect(risk.score).toBeGreaterThan(60)
    expect(risk.causes.some((c) => c.toLowerCase().includes("completion") || c.toLowerCase().includes("training"))).toBe(
      true
    )
  })
})
