import { describe, expect, it } from "vitest"

import {
  buildScoreGain,
  humanScoreGainExplanation,
} from "@/lib/escape-readiness/build-score-gain"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"

const AS_OF = "2026-05-16"

describe("buildScoreGain", () => {
  it("builds animated gain payload when score improved week over week", () => {
    const gain = buildScoreGain(
      [
        { date: "2026-05-01", score: 58 },
        { date: "2026-05-07", score: 65 },
        { date: "2026-05-13", score: 71 },
        { date: "2026-05-16", score: 73 },
      ],
      73,
      AS_OF
    )

    expect(gain).not.toBeNull()
    expect(gain!.previousScore).toBe(65)
    expect(gain!.currentScore).toBe(73)
    expect(gain!.pointsGained).toBe(8)
    expect(gain!.gainLabel).toBe("+8 gained")
    expect(gain!.humanExplanation.length).toBeGreaterThan(0)
  })

  it("returns null when score did not improve", () => {
    expect(
      buildScoreGain(
        [
          { date: "2026-05-07", score: 73 },
          { date: "2026-05-16", score: 70 },
        ],
        70,
        AS_OF
      )
    ).toBeNull()
  })

  it("explains half-day absence gains in human language", () => {
    const explanation = humanScoreGainExplanation(4, 50, 54)
    expect(explanation).toMatch(/half-day away|full day away|runway|progress/i)
  })

  it("is attached on the escape readiness view", () => {
    const view = finalizeEscapeReadinessView({
      score: 73,
      progress: [
        { date: "2026-05-07", score: 65 },
        { date: "2026-05-16", score: 73 },
      ],
      factors: [{ id: "sop_coverage", label: "SOP coverage", percent: 52, hint: "" }],
    })

    expect(view.scoreGain).not.toBeNull()
    expect(view.scoreGain!.gainLabel).toBe("+8 gained")
  })
})
