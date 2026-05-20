import { describe, expect, it } from "vitest"

import { computeEscapeReadiness } from "@/lib/escape-readiness/compute"
import { computeEscapeReadinessFromScan } from "@/lib/escape-readiness/compute-from-scan"
import type { RivetIndexComputeContext } from "@/lib/rivet-score/compute"
import type { OperationalScanAnswers } from "@/lib/operational-scan/score"

const emptyRunStats = {
  completedRunIds: [],
  abandonedCount: 0,
  itemsCompleted: 0,
  itemsTotal: 0,
  recentRunCount: 0,
}

function baseCtx(overrides: Partial<RivetIndexComputeContext> = {}): RivetIndexComputeContext {
  return {
    standards: [],
    stepCountBySopId: new Map(),
    bottlenecks: [],
    trainingProgressPercent: null,
    staffReadinessPercent: null,
    standardsDepthPercent: null,
    scanDependencyPercent: null,
    runStats: emptyRunStats,
    readinessRows: [],
    teamProfileCount: 1,
    trainingIncompleteCount: 0,
    totalAssignments: 0,
    ownerInterruptionsThisWeekCount: 0,
    ...overrides,
  }
}

describe("computeEscapeReadiness", () => {
  it("returns null score when no signal exists", () => {
    const view = computeEscapeReadiness(baseCtx())
    expect(view.score).toBeNull()
    expect(view.factors).toHaveLength(4)
  })

  it("averages four factor inputs into escape readiness score", () => {
    const view = computeEscapeReadiness(
      baseCtx({
        standardsDepthPercent: 80,
        trainingProgressPercent: 70,
        standards: [{ id: "1", status: "active", owner_dependency_level: 2 } as never],
        stepCountBySopId: new Map([["1", 3]]),
        readinessRows: [{ open_alone: "fully_ready" } as never],
        teamProfileCount: 3,
      })
    )
    expect(view.score).not.toBeNull()
    expect(view.score).toBeGreaterThan(50)
    expect(view.headlineQuestion).toContain("disappear for a week")
  })
})

describe("computeEscapeReadinessFromScan", () => {
  const answers: OperationalScanAnswers = {
    businessName: "Test Cafe",
    website: "",
    industry: "cafe",
    email: "a@b.com",
    staffQuestionsPerWeek: "16-30",
    staffCanOpenWithoutOwner: "partial",
    staffCanCloseWithoutOwner: "no",
    undocumentedProcedures: "6-15",
    canRunFiveDaysWithoutOwner: "no",
    trainingProcessExists: false,
    ownerInterruptions: "daily",
  }

  it("produces four factors and a composite score", () => {
    const view = computeEscapeReadinessFromScan(answers)
    expect(view.score).toBeGreaterThan(0)
    expect(view.score).toBeLessThan(100)
    expect(view.factors.map((f) => f.id)).toEqual([
      "procedures",
      "training",
      "owner_dependencies",
      "staffing",
    ])
  })
})
