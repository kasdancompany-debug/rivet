import { describe, expect, it } from "vitest"

import {
  ESCALATION_BONUS,
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

describe("operational scan weighted risk scoring", () => {
  it("higher owner texts/calls increases risk score", () => {
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

  it("maps risk level bands from score", () => {
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

  it("applies +15 escalation when cannot open and 31+ knowledge items", () => {
    const withoutEscalation = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "16-30",
    })
    const withEscalation = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "31+",
    })
    expect(withEscalation.escalationBonus).toBe(ESCALATION_BONUS)
    expect(withoutEscalation.escalationBonus).toBe(0)
    expect(withEscalation.ownerDependencyScore - withoutEscalation.ownerDependencyScore).toBeGreaterThanOrEqual(
      ESCALATION_BONUS
    )
  })

  it("builds breakdown lines with weighted point contributions", () => {
    const result = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      staffCanCloseWithoutOwner: "no",
      undocumentedProcedures: "31+",
      ownerTextsCallsPerWeek: "16-30",
      trainingConsistency: "rarely",
      canRunFiveDaysWithoutOwner: "partial",
      repeatedMistakesIssues: "rarely",
    })

    const openLine = result.scoreBreakdown.find((item) => item.key === "open_close")
    const knowledgeLine = result.scoreBreakdown.find((item) => item.key === "knowledge")
    const interruptLine = result.scoreBreakdown.find((item) => item.key === "interruptions")
    const trainingLine = result.scoreBreakdown.find((item) => item.key === "training")
    const sopLine = result.scoreBreakdown.find((item) => item.key === "sop_coverage")

    expect(openLine?.label).toBe("Business cannot open without owner")
    expect(openLine?.points).toBeGreaterThanOrEqual(26)
    expect(knowledgeLine?.label).toBe("31+ undocumented decisions")
    expect(knowledgeLine?.points).toBe(24)
    expect(interruptLine?.label).toBe("22 interruptions/week")
    expect(interruptLine?.points).toBe(14)
    expect(trainingLine?.label).toBe("Training gaps")
    expect(trainingLine?.points).toBe(6)
    expect(sopLine?.label).toBe("Play gaps")
    expect(sopLine?.points).toBe(5)
  })

  it("derives lower owner-free capacity as risk increases", () => {
    const lowRisk = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "yes",
      staffCanCloseWithoutOwner: "yes",
      undocumentedProcedures: "0",
      ownerTextsCallsPerWeek: "0-5",
      trainingConsistency: "consistent",
      canRunFiveDaysWithoutOwner: "yes",
      repeatedMistakesIssues: "rarely",
    })
    const highRisk = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      staffCanCloseWithoutOwner: "no",
      undocumentedProcedures: "31+",
      ownerTextsCallsPerWeek: "51+",
      trainingConsistency: "none",
      canRunFiveDaysWithoutOwner: "no",
      repeatedMistakesIssues: "daily",
    })
    expect(highRisk.estimatedOwnerFreeDays).toBeLessThan(lowRisk.estimatedOwnerFreeDays)
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
