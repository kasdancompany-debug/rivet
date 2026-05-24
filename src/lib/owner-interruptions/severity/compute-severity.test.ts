import { describe, expect, it } from "vitest"

import {
  computeInterruptionSeverity,
  countSimilarPullsInWindow,
  scoreFrequency,
  scoreTimeSpent,
  scoreUrgency,
} from "@/lib/owner-interruptions/severity/compute-severity"

describe("computeInterruptionSeverity", () => {
  it("scores a quick can-wait ping as small pull", () => {
    const result = computeInterruptionSeverity({
      estimatedMinutes: 5,
      urgency: "can_wait",
      frequencyCount: 1,
    })
    expect(result.severity).toBe("small_pull")
    expect(result.drivers.timeSpent.minutes).toBe(5)
    expect(result.drivers.frequency.count).toBe(1)
  })

  it("escalates repeat right-now pulls with long time spent", () => {
    const result = computeInterruptionSeverity({
      estimatedMinutes: 90,
      urgency: "right_now",
      frequencyCount: 6,
    })
    expect(result.severity).toBe("emergency")
  })

  it("weights time, urgency, and frequency into impact score", () => {
    const result = computeInterruptionSeverity({
      estimatedMinutes: 30,
      urgency: "time_sensitive",
      frequencyCount: 3,
    })
    expect(result.impactScore).toBe(
      Math.round(scoreTimeSpent(30) * 0.4 + scoreUrgency("time_sensitive") * 0.35 + scoreFrequency(3) * 0.25)
    )
    expect(["medium_pull", "heavy_pull"]).toContain(result.severity)
  })
})

describe("countSimilarPullsInWindow", () => {
  it("counts matching summaries inside the 14-day window", () => {
    const rows = [
      { summary: "Approve comp for call-out", occurred_at: "2026-04-20T12:00:00Z" },
      { summary: "Approve comp for call-out", occurred_at: "2026-05-10T12:00:00Z" },
      { summary: "Approve comp for call-out", occurred_at: "2026-05-12T12:00:00Z" },
      { summary: "Other issue", occurred_at: "2026-05-11T12:00:00Z" },
    ]

    const count = countSimilarPullsInWindow(rows, {
      summary: "Approve comp for call-out",
      occurred_at: "2026-05-12T12:00:00Z",
    })

    expect(count).toBe(2)
  })
})
