import { describe, expect, it } from "vitest"

import {
  computeManagerObservationSignalScore,
  countObservations,
} from "@/lib/training/observations/score-signal"

describe("computeManagerObservationSignalScore", () => {
  it("falls back to shift runs when no observations exist", () => {
    expect(computeManagerObservationSignalScore([], 0)).toBe(0)
    expect(computeManagerObservationSignalScore([], 5)).toBe(100)
  })

  it("rewards positive observations", () => {
    const score = computeManagerObservationSignalScore(
      [{ observation_type: "positive", observed_at: new Date().toISOString() }],
      0
    )
    expect(score).toBeGreaterThan(40)
  })

  it("caps score when a recent critical issue exists", () => {
    const score = computeManagerObservationSignalScore(
      [
        { observation_type: "positive", observed_at: new Date().toISOString() },
        { observation_type: "positive", observed_at: new Date().toISOString() },
        { observation_type: "positive", observed_at: new Date().toISOString() },
        { observation_type: "critical", observed_at: new Date().toISOString() },
      ],
      5
    )
    expect(score).toBeLessThanOrEqual(50)
  })

  it("counts observation types", () => {
    expect(
      countObservations([
        { observation_type: "positive", observed_at: "" },
        { observation_type: "improvement", observed_at: "" },
        { observation_type: "critical", observed_at: "" },
      ])
    ).toEqual({ positive: 1, improvement: 1, critical: 1 })
  })
})
