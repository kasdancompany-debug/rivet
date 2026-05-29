import { describe, expect, it } from "vitest"

import { certificationDisplayName, evaluateCertificationProgress } from "@/lib/training/certifications/evaluate"

describe("evaluateCertificationProgress", () => {
  it("certifies when module, quiz, proof, and sign-off are complete", () => {
    const result = evaluateCertificationProgress({
      moduleCompleted: true,
      quizRequiredStandardIds: ["s1", "s2"],
      passedQuizStandardIds: new Set(["s1", "s2"]),
      proofRequired: true,
      proofUploaded: true,
      managerSignedOff: true,
    })
    expect(result.certified).toBe(true)
  })

  it("does not certify without manager sign-off", () => {
    const result = evaluateCertificationProgress({
      moduleCompleted: true,
      quizRequiredStandardIds: ["s1"],
      passedQuizStandardIds: new Set(["s1"]),
      proofRequired: false,
      proofUploaded: true,
      managerSignedOff: false,
    })
    expect(result.certified).toBe(false)
    expect(result.quizzesPassed).toBe(true)
  })

  it("does not certify without proof when proof is required", () => {
    const result = evaluateCertificationProgress({
      moduleCompleted: true,
      quizRequiredStandardIds: [],
      passedQuizStandardIds: new Set(),
      proofRequired: true,
      proofUploaded: false,
      managerSignedOff: true,
    })
    expect(result.certified).toBe(false)
    expect(result.proofUploaded).toBe(false)
  })

  it("skips proof gate when no photo steps exist", () => {
    const result = evaluateCertificationProgress({
      moduleCompleted: true,
      quizRequiredStandardIds: [],
      passedQuizStandardIds: new Set(),
      proofRequired: false,
      proofUploaded: false,
      managerSignedOff: true,
    })
    expect(result.proofUploaded).toBe(true)
    expect(result.certified).toBe(true)
  })
})

describe("certificationDisplayName", () => {
  it("appends Certified to module titles", () => {
    expect(certificationDisplayName("Opening")).toBe("Opening Certified")
    expect(certificationDisplayName("Freezer Loading")).toBe("Freezer Loading Certified")
  })

  it("does not duplicate Certified suffix", () => {
    expect(certificationDisplayName("Closing Certified")).toBe("Closing Certified")
  })
})
