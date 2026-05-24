import { describe, expect, it } from "vitest"

import { buildFreedomPath } from "@/lib/escape-readiness/build-freedom-path"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessFactorInput } from "@/lib/escape-readiness/types"

const demoFactors: EscapeReadinessFactorInput[] = [
  { id: "sop_coverage", label: "SOP coverage", percent: 52, hint: "" },
  { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
  { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
  { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
  { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
]

describe("buildFreedomPath", () => {
  it("returns three ranked actions with score and effort metadata", () => {
    const path = buildFreedomPath(demoFactors, 73)

    expect(path).toHaveLength(3)
    expect(path[0]!.factorId).toBe("owner_interruptions")
    expect(path[0]!.estimatedScoreGain).toBeGreaterThan(0)
    expect(path[0]!.potentialResultingScore).toBeGreaterThan(73)
    expect(path[0]!.timeRequired.length).toBeGreaterThan(0)
    expect(["low", "medium", "high"]).toContain(path[0]!.effort)
  })

  it("is exposed on the escape readiness view", () => {
    const view = finalizeEscapeReadinessView({ score: 73, factors: demoFactors })
    expect(view.fastestPathToFreedom[0]!.title).toContain("Log what still routes back to you")
  })
})
