import { describe, expect, it } from "vitest"

import { computeDependencyBreakdown } from "./dependency-breakdown"
import { generateRivetInterpretation } from "./rivet-interpretation"
import { computeDependencyIndex } from "./generate-dependency-report"
import { defaultOwnerOnboardingAnswers } from "./owner-intake"

describe("generateRivetInterpretation", () => {
  it("returns four diagnostic fields without quoting user answers", () => {
    const answers = {
      ...defaultOwnerOnboardingAnswers(),
      daysPerWeek: "5-6" as const,
      openWithoutYou: "no" as const,
      closeWithoutYou: "no" as const,
      staffInterrupts: "daily" as const,
      avoidedTimeOff: "yes" as const,
      standardsMode: "verbal" as const,
      qualityOnOnePerson: "yes" as const,
      breaksWhenYouLeave: "Quality drops and people text me about refunds",
    }

    const breakdown = computeDependencyBreakdown(answers)
    const index = computeDependencyIndex(answers)
    const band = index >= 72 ? "critical" : index >= 44 ? "strained" : "contained"
    const interpretation = generateRivetInterpretation(answers, breakdown, band, index)

    expect(interpretation.criticalDependency.length).toBeGreaterThan(20)
    expect(interpretation.hiddenRisk.length).toBeGreaterThan(20)
    expect(interpretation.predictedOutcome.length).toBeGreaterThan(20)
    expect(interpretation.suggestedFirstAction.length).toBeGreaterThan(10)
    expect(interpretation.criticalDependency).not.toMatch(/you said/i)
    expect(interpretation.hiddenRisk).not.toContain("Quality drops")
    expect(interpretation.hiddenRisk).not.toContain("refunds")
  })

  it("prioritizes opening/closing diagnosis when bookends are weakest", () => {
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
    const interpretation = generateRivetInterpretation(answers, breakdown, "strained", 35)

    expect(interpretation.criticalDependency.toLowerCase()).toMatch(/open|close|bookend/)
  })
})
