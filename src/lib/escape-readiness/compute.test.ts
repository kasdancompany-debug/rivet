import { describe, expect, it } from "vitest"

import { computeEscapeReadiness } from "@/lib/escape-readiness/compute"
import { computeEscapeReadinessFromScan } from "@/lib/escape-readiness/compute-from-scan"
import { ESCAPE_READINESS_HEADLINE } from "@/lib/escape-readiness/copy"
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
    expect(view.factors).toHaveLength(5)
    expect(view.fastestPathToFreedom).toHaveLength(3)
  })

  it("averages five factor inputs into escape readiness score", () => {
    const view = computeEscapeReadiness(
      baseCtx({
        standardsDepthPercent: 80,
        trainingProgressPercent: 70,
        standards: [{ id: "1", status: "active", owner_dependency_level: 2 } as never],
        stepCountBySopId: new Map([["1", 3]]),
        ownerInterruptionsThisWeekCount: 0,
      })
    )
    expect(view.score).not.toBeNull()
    expect(view.score).toBeGreaterThan(50)
    expect(view.headlineQuestion).toBe(ESCAPE_READINESS_HEADLINE)
    expect(view.biggestRisk).not.toBeNull()
  })
})

describe("computeEscapeReadinessFromScan", () => {
  const answers: OperationalScanAnswers = {
    firstName: "Test",
    businessName: "Test Cafe",
    website: "",
    industry: "cafe",
    email: "a@b.com",
    phone: "",
    staffQuestionsPerWeek: "16-30",
    ownerTextsCallsPerWeek: "16-30",
    staffCanOpenWithoutOwner: "partial",
    staffCanCloseWithoutOwner: "no",
    undocumentedProcedures: "6-15",
    trainingConsistency: "rarely",
    canRunFiveDaysWithoutOwner: "no",
    repeatedMistakesIssues: "weekly",
  }

  it("produces five factors, composite score, and top fixes", () => {
    const view = computeEscapeReadinessFromScan(answers)
    expect(view.score).toBeGreaterThan(0)
    expect(view.score).toBeLessThan(100)
    expect(view.factors.map((f) => f.id)).toEqual([
      "sop_coverage",
      "training_coverage",
      "unresolved_issues",
      "owner_interruptions",
      "undocumented_procedures",
    ])
    expect(view.fastestPathToFreedom).toHaveLength(3)
    expect(view.tagline).toContain("run without everything going through you")
  })
})
