import { describe, expect, it } from "vitest"

import { defaultCaseStudyPeriods, eachUtcDayInRange, isoDateInRange, parseMetricsDateRange, pilotComparisonPeriods } from "@/lib/internal-metrics/period"

describe("internal metrics period", () => {
  it("defaults to two consecutive 14-day windows", () => {
    const { baseline, current } = defaultCaseStudyPeriods(new Date("2026-05-25T12:00:00Z"))
    expect(baseline.end < current.start).toBe(true)
    expect(isoDateInRange("2026-05-20T10:00:00Z", current)).toBe(true)
    expect(isoDateInRange("2026-04-01T10:00:00Z", current)).toBe(false)
  })

  it("parses baseline_current query shape", () => {
    const range = parseMetricsDateRange("2026-04-01_2026-04-14", {
      start: "2026-01-01",
      end: "2026-01-07",
    })
    expect(range).toEqual({ start: "2026-04-01", end: "2026-04-14" })
  })

  it("builds 30-day pilot comparison windows", () => {
    const { current, baseline } = pilotComparisonPeriods(30, new Date("2026-05-25T12:00:00Z"))
    expect(eachUtcDayInRange(current)).toHaveLength(30)
    expect(eachUtcDayInRange(baseline)).toHaveLength(30)
    expect(baseline.end < current.start).toBe(true)
  })
})
