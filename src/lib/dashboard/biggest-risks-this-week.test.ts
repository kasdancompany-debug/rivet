import { describe, expect, it } from "vitest"

import { buildBiggestRisksThisWeek } from "./biggest-risks-this-week"
import type { BiggestRisksThisWeekInput } from "./biggest-risks-this-week"

const baseSop = {
  id: "sop-open",
  business_id: "biz",
  title: "Morning Open",
  category: "opening",
  description: "Open the cafe safely.",
  importance_level: 5,
  owner_dependency_level: 5,
  estimated_time_minutes: 30,
  status: "active" as const,
  standards_capture: {},
  quiz_questions: [],
  created_by: "user",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function emptyInput(overrides: Partial<BiggestRisksThisWeekInput> = {}): BiggestRisksThisWeekInput {
  return {
    standards: [baseSop],
    stepRollupBySopId: new Map([["sop-open", { stepCount: 1, hasStepMediaOrEvidence: false }]]),
    mediaCountBySopId: new Map(),
    trainingProgressPercent: 40,
    trainingIncompleteCount: 2,
    totalTrainingAssignments: 3,
    canTrainOthersCount: 0,
    teamProfileCount: 3,
    ownerInterruptionsThisWeekCount: 4,
    ownerInterruptionsThisWeekMinutes: 60,
    trainingItemsBySopId: new Map([["sop-open", 1]]),
    modules: [{ id: "mod-1", title: "Opening path" }],
    moduleCompletionPercent: new Map([["mod-1", 30]]),
    ...overrides,
  }
}

describe("buildBiggestRisksThisWeek", () => {
  it("returns top 3 ranked risks with dependency and training examples", () => {
    const risks = buildBiggestRisksThisWeek(emptyInput())

    expect(risks.length).toBeLessThanOrEqual(3)
    expect(risks[0]?.rank).toBe(1)
    expect(risks.some((r) => r.label.toLowerCase().includes("opening"))).toBe(true)
    expect(risks.some((r) => r.label.toLowerCase().includes("backup trainer"))).toBe(true)
  })
})
