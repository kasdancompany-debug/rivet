import { describe, expect, it } from "vitest"

import { computeDependencyBreakdown, totalDependencyRaw } from "./dependency-breakdown"
import { computeDependencyIndex } from "./generate-dependency-report"
import { defaultOwnerOnboardingAnswers } from "./owner-intake"

describe("computeDependencyBreakdown", () => {
  it("category contributions sum to the dependency index", () => {
    const answers = {
      ...defaultOwnerOnboardingAnswers(),
      daysPerWeek: "5-6" as const,
      openWithoutYou: "no" as const,
      closeWithoutYou: "sometimes" as const,
      staffInterrupts: "daily" as const,
      avoidedTimeOff: "yes" as const,
      standardsMode: "verbal" as const,
      qualityOnOnePerson: "yes" as const,
    }

    const breakdown = computeDependencyBreakdown(answers)
    const sum = breakdown.categories.reduce((n, c) => n + c.contributionPoints, 0)
    const index = computeDependencyIndex(answers)

    expect(sum).toBe(index)
    expect(breakdown.categories).toHaveLength(5)
    expect(breakdown.highestLeverage.estimatedPointReduction).toBeGreaterThan(0)
  })

  it("surfaces opening/closing leverage when bookends are weakest", () => {
    const answers = {
      ...defaultOwnerOnboardingAnswers(),
      daysPerWeek: "0-2" as const,
      openWithoutYou: "no" as const,
      closeWithoutYou: "no" as const,
      staffInterrupts: "rarely" as const,
      avoidedTimeOff: "no" as const,
      standardsMode: "documented" as const,
      qualityOnOnePerson: "no" as const,
    }

    const breakdown = computeDependencyBreakdown(answers)
    expect(breakdown.highestLeverage.categoryId).toBe("opening_closing")
    expect(breakdown.highestLeverage.label).toContain("opening")
  })

  it("matches total raw stress used by dependency index", () => {
    const answers = {
      ...defaultOwnerOnboardingAnswers(),
      openWithoutYou: "sometimes" as const,
      closeWithoutYou: "yes" as const,
      staffInterrupts: "weekly" as const,
      standardsMode: "mixed" as const,
      qualityOnOnePerson: "unsure" as const,
      daysPerWeek: "3-4" as const,
      avoidedTimeOff: "prefer_not" as const,
    }

    const raw = totalDependencyRaw(answers)
    const index = computeDependencyIndex(answers)
    expect(index).toBe(Math.round(Math.min(100, Math.max(0, (raw / 162) * 100))))
  })
})
