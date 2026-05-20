import { describe, expect, it } from "vitest"

import { recommendedNextSteps } from "@/lib/operational-scan/recommended-next-steps"
import { computeOperationalScanScores, type OperationalScanAnswers } from "@/lib/operational-scan/score"

const base: OperationalScanAnswers = {
  businessName: "Test",
  website: "",
  industry: "Retail",
  email: "a@b.co",
  staffQuestionsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "no",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  canRunFiveDaysWithoutOwner: "no",
  trainingProcessExists: false,
  ownerInterruptions: "daily",
}

describe("recommendedNextSteps v2", () => {
  it("returns actionable steps", () => {
    const result = computeOperationalScanScores(base)
    const steps = recommendedNextSteps(result, base)
    expect(steps.length).toBeGreaterThanOrEqual(2)
    expect(steps.some((s) => s.toLowerCase().includes("open") || s.toLowerCase().includes("training"))).toBe(true)
  })
})
