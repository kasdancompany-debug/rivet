import { describe, expect, it } from "vitest"

import { recommendedFirstFixes, recommendedNextSteps } from "@/lib/operational-scan/recommended-next-steps"
import { computeOperationalScanScores, type OperationalScanAnswers } from "@/lib/operational-scan/score"

const base: OperationalScanAnswers = {
  firstName: "Test",
  businessName: "Test",
  website: "",
  industry: "Retail",
  email: "a@b.co",
  phone: "",
  staffQuestionsPerWeek: "16-30",
  ownerTextsCallsPerWeek: "31-50",
  staffCanOpenWithoutOwner: "no",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  trainingConsistency: "none",
  canRunFiveDaysWithoutOwner: "no",
  repeatedMistakesIssues: "daily",
}

describe("recommendedFirstFixes v3", () => {
  it("returns exactly three actionable fixes", () => {
    const result = computeOperationalScanScores(base)
    const fixes = recommendedFirstFixes(result, base)
    expect(fixes).toHaveLength(3)
    expect(fixes.every((s) => s.length > 20)).toBe(true)
  })

  it("recommendedNextSteps matches first fixes", () => {
    const result = computeOperationalScanScores(base)
    expect(recommendedNextSteps(result, base)).toEqual(recommendedFirstFixes(result, base))
  })
})
