import { describe, expect, it } from "vitest"

import { buildScanScoringExplanation } from "@/lib/operational-scan/build-scoring-explanation"
import { computeOperationalScanScores, type OperationalScanAnswers } from "@/lib/operational-scan/score"

const base: OperationalScanAnswers = {
  firstName: "Test",
  businessName: "Test Co",
  website: "",
  industry: "Retail",
  email: "a@b.co",
  phone: "",
  staffQuestionsPerWeek: "16-30",
  ownerTextsCallsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "partial",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  trainingConsistency: "sometimes",
  canRunFiveDaysWithoutOwner: "partial",
  repeatedMistakesIssues: "weekly",
}

describe("buildScanScoringExplanation", () => {
  it("lists weighted factors that sum to the headline score directionally", () => {
    const result = computeOperationalScanScores(base)
    const explanation = buildScanScoringExplanation(result)

    expect(explanation.ownerDependencyScore).toBe(result.ownerDependencyScore)
    expect(explanation.factors.length).toBeGreaterThan(0)
    expect(explanation.factors.every((f) => f.points > 0)).toBe(true)
    expect(explanation.caveats.length).toBeGreaterThanOrEqual(3)
  })

  it("includes escalation factor when bonus applies", () => {
    const result = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "31+",
    })
    const explanation = buildScanScoringExplanation(result)
    expect(explanation.factors.some((f) => f.key === "escalation")).toBe(true)
  })
})
