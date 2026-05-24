import { describe, expect, it } from "vitest"

import {
  BIGGEST_RISK_TITLE,
  buildBiggestRisk,
  estimateAbsenceInterruptions,
  formatInterruptionFutureLine,
} from "@/lib/escape-readiness/build-biggest-risk"
import type { EscapeReadinessFactorInput } from "@/lib/escape-readiness/types"

const demoFactors: EscapeReadinessFactorInput[] = [
  { id: "sop_coverage", label: "SOP coverage", percent: 52, hint: "" },
  { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
  { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
  { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
  { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
]

describe("buildBiggestRisk", () => {
  it("builds a future-state risk card from weakest factor", () => {
    const risk = buildBiggestRisk(demoFactors, { ownerInterruptionsThisWeekCount: 12 })

    expect(risk).not.toBeNull()
    expect(risk!.factorId).toBe("owner_interruptions")
    expect(risk!.title).toBe(BIGGEST_RISK_TITLE)
    expect(risk!.futureStateLines).toHaveLength(4)
    expect(risk!.futureStateLines[0]).toMatch(/Texts and walk-ups|Questions route/)
    expect(risk!.futureStateLines[2]).toMatch(/interruptions expected within 48 hours/)
    expect(risk!.futureStateLines[3]).toMatch(/floor stalls|Customer-facing/)
    expect(risk!.severity).toBe("high")
    expect(risk!.estimatedInterruptions.count).toBeGreaterThan(0)
  })

  it("uses sop future-state copy when SOP coverage is weakest", () => {
    const factors: EscapeReadinessFactorInput[] = [
      { id: "sop_coverage", label: "SOP coverage", percent: 28, hint: "" },
      { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
      { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
      { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
      { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
    ]
    const risk = buildBiggestRisk(factors)

    expect(risk!.factorId).toBe("sop_coverage")
    expect(risk!.futureStateLines[0]).toBe("Opening runs from memory")
    expect(risk!.futureStateLines[1]).toBe("Questions route back to staff phones")
    expect(risk!.futureStateLines[3]).toBe("Customer-facing mistakes become likely")
  })

  it("estimates absence interruptions from weekly pulls", () => {
    const estimate = estimateAbsenceInterruptions(12, 32)
    expect(estimate.label).toMatch(/interruptions expected within 48 hours/)
    expect(estimate.low).toBeLessThanOrEqual(estimate.high)
  })

  it("formats interruption future line", () => {
    expect(formatInterruptionFutureLine(14, 19)).toBe("14–19 interruptions expected within 48 hours")
    expect(formatInterruptionFutureLine(5, 5)).toBe("5 interruptions expected within 48 hours")
  })
})
