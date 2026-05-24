import { describe, expect, it } from "vitest"

import { evaluateCertificationProgress } from "@/lib/training/certifications/evaluate"

describe("evaluateCertificationProgress", () => {
  it("certifies when module, quiz, and sign-off are complete", () => {
    const result = evaluateCertificationProgress({
      moduleCompleted: true,
      quizRequiredStandardIds: ["s1", "s2"],
      passedQuizStandardIds: new Set(["s1", "s2"]),
      managerSignedOff: true,
    })
    expect(result.certified).toBe(true)
  })

  it("does not certify without manager sign-off", () => {
    const result = evaluateCertificationProgress({
      moduleCompleted: true,
      quizRequiredStandardIds: ["s1"],
      passedQuizStandardIds: new Set(["s1"]),
      managerSignedOff: false,
    })
    expect(result.certified).toBe(false)
    expect(result.quizzesPassed).toBe(true)
  })
})
