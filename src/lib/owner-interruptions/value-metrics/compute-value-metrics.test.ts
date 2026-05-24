import { describe, expect, it } from "vitest"

import { computeOwnerValueMetrics } from "@/lib/owner-interruptions/value-metrics/compute-value-metrics"

describe("computeOwnerValueMetrics", () => {
  it("uses week-over-week improvement when pulls drop", () => {
    const metrics = computeOwnerValueMetrics({
      minutesThisWeek: 30,
      minutesPriorWeek: 90,
      fixSuggestions: [],
      ownerHourlyValueCad: 100,
    })
    expect(metrics.hoursReturnedThisWeek).toBe(1)
    expect(metrics.estimatedBusinessValueCad).toBe(100)
    expect(metrics.source).toBe("actual_improvement")
  })

  it("projects from fix suggestions when no improvement yet", () => {
    const metrics = computeOwnerValueMetrics({
      minutesThisWeek: 60,
      minutesPriorWeek: 60,
      fixSuggestions: [{ estimatedOwnerMinutesRecovered: 300 } as never],
      ownerHourlyValueCad: 80,
    })
    expect(metrics.hoursReturnedThisWeek).toBeGreaterThan(0)
    expect(metrics.source).toBe("projected_fixes")
  })
})
