import { describe, expect, it } from "vitest"

import { buildBiggestRisk, estimateAbsenceInterruptions } from "@/lib/escape-readiness/build-biggest-risk"
import type { EscapeReadinessFactorInput } from "@/lib/escape-readiness/types"

const demoFactors: EscapeReadinessFactorInput[] = [
  { id: "sop_coverage", label: "SOP coverage", percent: 52, hint: "" },
  { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
  { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
  { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
  { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
]

describe("buildBiggestRisk", () => {
  it("builds a rich risk card from weakest factor", () => {
    const risk = buildBiggestRisk(demoFactors, { ownerInterruptionsThisWeekCount: 12 })

    expect(risk).not.toBeNull()
    expect(risk!.factorId).toBe("owner_interruptions")
    expect(risk!.title).toBe("Too much still routes back to you")
    expect(risk!.disappearingTomorrow).toContain("If you disappeared tomorrow")
    expect(risk!.predictedBreakdowns).toHaveLength(3)
    expect(risk!.severity).toBe("high")
    expect(risk!.estimatedInterruptions.count).toBeGreaterThan(0)
  })

  it("estimates absence interruptions from weekly pulls", () => {
    const estimate = estimateAbsenceInterruptions(12, 32)
    expect(estimate.label).toMatch(/pulls · first 48 hours/)
    expect(estimate.low).toBeLessThanOrEqual(estimate.high)
  })
})
