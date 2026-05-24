import { describe, expect, it } from "vitest"

import { computeTrendDayIntensity } from "@/lib/owner-interruptions/trend/compute-trend-day-intensity"

describe("computeTrendDayIntensity", () => {
  it("returns none when no interruptions", () => {
    expect(
      computeTrendDayIntensity({ count: 0, minutes: 0, maxCount: 5, maxMinutes: 60 })
    ).toBe("none")
  })

  it("classifies relative load into low, medium, and high", () => {
    const max = { maxCount: 6, maxMinutes: 90 }

    expect(computeTrendDayIntensity({ count: 1, minutes: 10, ...max })).toBe("low")
    expect(computeTrendDayIntensity({ count: 3, minutes: 30, ...max })).toBe("medium")
    expect(computeTrendDayIntensity({ count: 6, minutes: 90, ...max })).toBe("high")
  })
})
