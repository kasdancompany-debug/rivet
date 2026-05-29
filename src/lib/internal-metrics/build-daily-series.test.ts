import { describe, expect, it } from "vitest"

import { convertQuickCaptureHeuristic } from "@/lib/sops/quick-capture/convert-heuristic"
import type { CaseStudyRawContext } from "@/lib/internal-metrics/compute-period-snapshot"
import { buildPilotDailySeries } from "@/lib/internal-metrics/build-daily-series"
import { eachUtcDayInRange, pilotComparisonPeriods, rollingWindowRange } from "@/lib/internal-metrics/period"

function emptyContext(): CaseStudyRawContext {
  return {
    interruptions: [],
    askQueries: [],
    standards: [],
    trainingProgress: [],
    trainingModules: [],
    certifications: [],
    scoreSnapshots: [],
    standardIdsWithMedia: new Set(),
  }
}

describe("pilotComparisonPeriods", () => {
  it("builds equal prior and current 7-day windows", () => {
    const { baseline, current, windowDays } = pilotComparisonPeriods(7, new Date("2026-05-25T12:00:00Z"))
    expect(windowDays).toBe(7)
    expect(current.end).toBe("2026-05-25")
    expect(current.start).toBe("2026-05-19")
    expect(baseline.end).toBe("2026-05-18")
    expect(baseline.start).toBe("2026-05-12")
  })

  it("rollingWindowRange is inclusive", () => {
    const range = rollingWindowRange(7, new Date("2026-05-25T12:00:00Z"))
    expect(eachUtcDayInRange(range)).toHaveLength(7)
  })
})

describe("buildPilotDailySeries", () => {
  it("counts interruptions and ask usage by UTC day", () => {
    const range = { start: "2026-05-20", end: "2026-05-22" }
    const ctx = emptyContext()
    ctx.interruptions = [
      {
        id: "1",
        business_id: "b",
        occurred_at: "2026-05-20T15:00:00.000Z",
        summary: "test",
        estimated_minutes: 5,
      } as CaseStudyRawContext["interruptions"][number],
      {
        id: "2",
        business_id: "b",
        occurred_at: "2026-05-20T16:00:00.000Z",
        summary: "test2",
        estimated_minutes: 3,
      } as CaseStudyRawContext["interruptions"][number],
    ]
    ctx.askQueries = [
      {
        question_text: "How do I stock?",
        normalized_question: "how do i stock",
        standard_id: null,
        prevented_owner_interrupt: true,
        response: {},
        created_at: "2026-05-21T10:00:00.000Z",
      },
    ]

    const series = buildPilotDailySeries(range, ctx)
    expect(series.interruptions.find((p) => p.date === "2026-05-20")?.value).toBe(2)
    expect(series.askRivetUsage.find((p) => p.date === "2026-05-21")?.value).toBe(1)
    expect(series.questionsPrevented.find((p) => p.date === "2026-05-21")?.value).toBe(1)
    expect(series.playsCreated.every((p) => p.value === 0)).toBe(true)
  })
})

describe("buildPilotDailySeries plays", () => {
  it("counts plays created on created_at day", () => {
    const draft = convertQuickCaptureHeuristic("Ashley keeps forgetting freezer stocking.")
    const range = { start: "2026-05-25", end: "2026-05-25" }
    const ctx = emptyContext()
    ctx.standards = [
      {
        id: "s1",
        business_id: "b",
        title: draft.title,
        created_at: "2026-05-25T08:00:00.000Z",
        status: "draft",
      } as CaseStudyRawContext["standards"][number],
    ]
    const series = buildPilotDailySeries(range, ctx)
    expect(series.playsCreated[0]?.value).toBe(1)
  })
})
