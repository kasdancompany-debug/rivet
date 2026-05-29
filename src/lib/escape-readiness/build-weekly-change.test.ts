import { describe, expect, it } from "vitest"

import { buildWeeklyChange } from "@/lib/escape-readiness/build-weekly-change"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"

const AS_OF = "2026-05-16"

describe("buildWeeklyChange", () => {
  it("computes score and absence deltas vs seven days ago", () => {
    const change = buildWeeklyChange(
      [
        { date: "2026-05-01", score: 58 },
        { date: "2026-05-07", score: 65 },
        { date: "2026-05-13", score: 71 },
        { date: "2026-05-16", score: 73 },
      ],
      73,
      AS_OF
    )

    expect(change).not.toBeNull()
    expect(change!.items).toHaveLength(2)
    expect(change!.items[0]!.metric).toBe("Escape readiness score")
    expect(change!.items[0]!.direction).toBe("up")
    expect(change!.items[0]!.differenceLabel).toBe("+8 pts")
    expect(change!.items[0]!.explanation.length).toBeGreaterThan(0)
    expect(change!.items[1]!.metric).toBe("Owner absence capacity")
  })

  it("returns null when there is not enough history", () => {
    expect(buildWeeklyChange([{ date: "2026-05-16", score: 73 }], 73, AS_OF)).toBeNull()
  })

  it("is attached on the escape readiness view", () => {
    const view = finalizeEscapeReadinessView({
      score: 73,
      progress: [
        { date: "2026-05-07", score: 65 },
        { date: "2026-05-16", score: 73 },
      ],
      factors: [{ id: "sop_coverage", label: "Play coverage", percent: 52, hint: "" }],
    })

    expect(view.weeklyChange).not.toBeNull()
  })
})
