import { describe, expect, it } from "vitest"

import {
  buildScanDiagnosis,
  computeHoursLeakage,
  computeScanConfidence,
} from "@/lib/operational-scan/build-scan-diagnosis"
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

describe("buildScanDiagnosis", () => {
  it("returns 3–5 diagnostic cards for typical high-dependency answers", () => {
    const result = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "31+",
      ownerTextsCallsPerWeek: "16-30",
    })
    const view = buildScanDiagnosis(result, {
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "31+",
      ownerTextsCallsPerWeek: "16-30",
    })

    expect(view.diagnosticCards.length).toBeGreaterThanOrEqual(3)
    expect(view.diagnosticCards.length).toBeLessThanOrEqual(5)
    expect(view.diagnosticCards.some((c) => c.id === "knowledge_trapped")).toBe(true)
    expect(view.diagnosticCards.some((c) => c.id === "owner_interruptions")).toBe(true)
  })

  it("returns three prioritized recommendations with outcome fields", () => {
    const result = computeOperationalScanScores(base)
    const view = buildScanDiagnosis(result, base)

    expect(view.recommendations).toHaveLength(3)
    for (const rec of view.recommendations) {
      expect(rec.title.length).toBeGreaterThan(0)
      expect(rec.estimatedEffort.length).toBeGreaterThan(0)
      expect(rec.expectedReadinessGain).toMatch(/Escape Readiness/)
      expect(rec.expectedInterruptionReduction.length).toBeGreaterThan(0)
    }
  })

  it("computes hours leakage from weekly interrupts", () => {
    const result = computeOperationalScanScores(base)
    const leakage = computeHoursLeakage(result, base)

    expect(leakage.interruptionsPerWeek).toBeGreaterThan(0)
    expect(leakage.minutesPerInterruption).toBeGreaterThan(0)
    expect(leakage.hoursPerYear).toBeGreaterThan(0)
    expect(leakage.estimatedDollarValue).toBeGreaterThan(0)
  })

  it("returns confidence between 64 and 96", () => {
    const result = computeOperationalScanScores(base)
    const confidence = computeScanConfidence(result)
    expect(confidence).toBeGreaterThanOrEqual(64)
    expect(confidence).toBeLessThanOrEqual(96)
  })

  it("builds narrative diagnosis fields without relying on headline percentages", () => {
    const result = computeOperationalScanScores({
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "31+",
    })
    const view = buildScanDiagnosis(result, {
      ...base,
      staffCanOpenWithoutOwner: "no",
      undocumentedProcedures: "31+",
    })

    expect(view.biggestRisks.length).toBeGreaterThan(0)
    expect(view.whyRivetBelieves.length).toBeGreaterThan(0)
    expect(view.fastestPath).not.toBeNull()
    expect(view.impact.hoursTrappedAnnually).toBeGreaterThan(0)
    expect(view.impact.interruptionsPreventedAnnually).toBeGreaterThan(0)
    expect(view.ownerFreeCapacityLabel.length).toBeGreaterThan(0)
    expect(view.ownerDependencyNarrative.length).toBeGreaterThan(10)
  })
})
