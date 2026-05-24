import { describe, expect, it } from "vitest"

import {
  computeSopDocumentationPercent,
  computeSopOwnershipPercent,
  computeSopPlayCompletion,
  computeSopTrainingPercent,
} from "./sop-play-completion"
import type { SopPlayCompletionContext } from "./sop-play-completion"

const baseSop = {
  id: "sop-1",
  title: "Morning open",
  description: "Run the open sequence before guests arrive.",
  status: "active" as const,
  updated_at: new Date().toISOString(),
  standards_capture: {
    version: 1 as const,
    assignedRoles: ["opener", "shift_lead"],
    photoUrls: [],
    qualityStandards: ["Line ready by 7:00"],
    acceptableExamples: [],
    unacceptableExamples: [],
    competencyMarkers: [],
  },
  owner_dependency_level: 2,
}

const baseContext: SopPlayCompletionContext = {
  stepRollupBySopId: new Map([["sop-1", { stepCount: 3, hasStepMediaOrEvidence: true }]]),
  mediaCountBySopId: new Map([["sop-1", 1]]),
  trainingItemsBySopId: new Map([
    ["sop-1", [{ id: "item-1", moduleId: "mod-1" }]],
  ]),
  assignedEmployeesByModuleId: new Map([["mod-1", new Set(["emp-1", "emp-2"])]]),
  completionKeys: new Set(["emp-1:item-1"]),
}

describe("computeSopPlayCompletion", () => {
  it("computes documentation, training, ownership, and overall percentages", () => {
    const completion = computeSopPlayCompletion(baseSop, baseContext)

    expect(completion.documentation).toBeGreaterThanOrEqual(75)
    expect(completion.training).toBe(50)
    expect(completion.ownership).toBe(90)
    expect(completion.overall).toBe(Math.round((completion.documentation + 50 + 90) / 3))
  })

  it("returns zero training when the play is not linked to a module", () => {
    expect(
      computeSopTrainingPercent("sop-1", {
        trainingItemsBySopId: new Map(),
        assignedEmployeesByModuleId: new Map(),
        completionKeys: new Set(),
      })
    ).toBe(0)
  })

  it("scores ownership from roles and owner dependency", () => {
    expect(
      computeSopOwnershipPercent({
        owner_dependency_level: 5,
        standards_capture: { version: 1, assignedRoles: [], photoUrls: [], qualityStandards: [], acceptableExamples: [], unacceptableExamples: [], competencyMarkers: [] },
      })
    ).toBe(10)

    expect(
      computeSopDocumentationPercent(
        {
          title: "Open",
          description: null,
          status: "draft",
          updated_at: new Date().toISOString(),
          standards_capture: null,
        },
        { stepCount: 0, hasStepMediaOrEvidence: false },
        0
      )
    ).toBeLessThan(40)
  })
})
