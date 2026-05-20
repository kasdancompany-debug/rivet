import { describe, expect, it } from "vitest"

import {
  computeOperationalScanScores,
  formatCurrencyCad,
  type OperationalScanAnswers,
} from "@/lib/operational-scan/score"

const base: OperationalScanAnswers = {
  businessName: "Test Co",
  website: "",
  industry: "Retail",
  email: "a@b.co",
  staffQuestionsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "partial",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  canRunFiveDaysWithoutOwner: "partial",
  trainingProcessExists: false,
  ownerInterruptions: "weekly",
}

describe("operational scan v2 scoring", () => {
  it("higher staff questions increases dependency score", () => {
    const low = computeOperationalScanScores({ ...base, staffQuestionsPerWeek: "0-5" })
    const high = computeOperationalScanScores({ ...base, staffQuestionsPerWeek: "51+" })
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

  it("no training process worsens score", () => {
    const yes = computeOperationalScanScores({ ...base, trainingProcessExists: true })
    const no = computeOperationalScanScores({ ...base, trainingProcessExists: false })
    expect(no.ownerDependencyScore).toBeGreaterThan(yes.ownerDependencyScore)
  })

  it("maps severity bands from score", () => {
    const low = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "0-5",
      staffCanOpenWithoutOwner: "yes",
      staffCanCloseWithoutOwner: "yes",
      undocumentedProcedures: "0",
      canRunFiveDaysWithoutOwner: "yes",
      trainingProcessExists: true,
      ownerInterruptions: "rarely",
    })
    expect(low.severity).toBe("LOW")

    const critical = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "51+",
      staffCanOpenWithoutOwner: "no",
      staffCanCloseWithoutOwner: "no",
      undocumentedProcedures: "31+",
      canRunFiveDaysWithoutOwner: "no",
      trainingProcessExists: false,
      ownerInterruptions: "constantly",
    })
    expect(critical.severity).toBe("CRITICAL")
    expect(critical.ownerDependencyScore).toBeGreaterThanOrEqual(75)
  })

  it("estimates cost metrics increase with worse answers", () => {
    const mild = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "0-5",
      ownerInterruptions: "rarely",
    })
    const heavy = computeOperationalScanScores({
      ...base,
      staffQuestionsPerWeek: "51+",
      ownerInterruptions: "constantly",
    })
    expect(heavy.estimatedInterruptionsPerMonth).toBeGreaterThan(mild.estimatedInterruptionsPerMonth)
    expect(heavy.estimatedOwnerHoursLostPerMonth).toBeGreaterThan(mild.estimatedOwnerHoursLostPerMonth)
    expect(heavy.estimatedAnnualCost).toBeGreaterThan(mild.estimatedAnnualCost)
  })

  it("returns three pain drivers", () => {
    const r = computeOperationalScanScores(base)
    expect(r.painDrivers).toHaveLength(3)
    expect(r.painDrivers.every((s) => s.length > 15)).toBe(true)
  })

  it("formatCurrencyCad renders CAD", () => {
    expect(formatCurrencyCad(12000)).toMatch(/\$/)
  })
})
