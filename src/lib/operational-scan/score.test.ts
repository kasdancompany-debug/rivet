import { describe, expect, it } from "vitest"

import {
  computeOperationalScanScores,
  formatCurrencyCad,
  formatSeverityLabel,
  textsCallsBandToLeadCadence,
  type OperationalScanAnswers,
} from "@/lib/operational-scan/score"

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

describe("operational scan v3 scoring", () => {
  it("higher staff questions increases dependency score", () => {
    const low = computeOperationalScanScores({ ...base, staffQuestionsPerWeek: "0-5" })
    const high = computeOperationalScanScores({ ...base, staffQuestionsPerWeek: "51+" })
    expect(high.ownerDependencyScore).toBeGreaterThan(low.ownerDependencyScore)
  })

  it("higher owner texts/calls increases dependency score", () => {
    const low = computeOperationalScanScores({ ...base, ownerTextsCallsPerWeek: "0-5" })
    const high = computeOperationalScanScores({ ...base, ownerTextsCallsPerWeek: "51+" })
    expect(high.ownerDependencyScore).toBeGreaterThan(low.ownerDependencyScore)
  })

  it("cannot open/close without owner worsens score", () => {
    const ok = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "yes",
      staffCanCloseWithoutOwner: "yes",
    })
    const bad = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      staffCanCloseWithoutOwner: "no",
    })
    expect(bad.ownerDependencyScore).toBeGreaterThan(ok.ownerDependencyScore)
  })

  it("inconsistent training worsens score", () => {
    const ok = computeOperationalScanScores({ ...base, trainingConsistency: "consistent" })
    const bad = computeOperationalScanScores({ ...base, trainingConsistency: "none" })
    expect(bad.ownerDependencyScore).toBeGreaterThan(ok.ownerDependencyScore)
  })

  it("maps severity bands from score", () => {
    const low = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "0-5",
      ownerTextsCallsPerWeek: "0-5",
      staffCanOpenWithoutOwner: "yes",
      staffCanCloseWithoutOwner: "yes",
      undocumentedProcedures: "0",
      canRunFiveDaysWithoutOwner: "yes",
      trainingConsistency: "consistent",
      repeatedMistakesIssues: "rarely",
    })
    expect(low.severity).toBe("LOW")
    expect(formatSeverityLabel(low.severity)).toBe("Low")

    const critical = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "51+",
      ownerTextsCallsPerWeek: "51+",
      staffCanOpenWithoutOwner: "no",
      staffCanCloseWithoutOwner: "no",
      undocumentedProcedures: "31+",
      canRunFiveDaysWithoutOwner: "no",
      trainingConsistency: "none",
      repeatedMistakesIssues: "daily",
    })
    expect(critical.severity).toBe("CRITICAL")
    expect(critical.ownerDependencyScore).toBeGreaterThanOrEqual(75)
  })

  it("estimates cost metrics increase with worse answers", () => {
    const mild = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "0-5",
      ownerTextsCallsPerWeek: "0-5",
      repeatedMistakesIssues: "rarely",
    })
    const heavy = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "51+",
      ownerTextsCallsPerWeek: "51+",
      repeatedMistakesIssues: "daily",
    })
    expect(heavy.estimatedInterruptionsPerMonth).toBeGreaterThan(mild.estimatedInterruptionsPerMonth)
    expect(heavy.estimatedOwnerHoursLostPerMonth).toBeGreaterThan(mild.estimatedOwnerHoursLostPerMonth)
    expect(heavy.estimatedAnnualCost).toBeGreaterThan(mild.estimatedAnnualCost)
  })

  it("maps texts/calls band to lead cadence", () => {
    expect(textsCallsBandToLeadCadence("0-5")).toBe("rarely")
    expect(textsCallsBandToLeadCadence("51+")).toBe("constantly")
  })

  it("formatCurrencyCad renders CAD", () => {
    expect(formatCurrencyCad(12000)).toMatch(/\$/)
  })
})
