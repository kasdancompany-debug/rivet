import { describe, expect, it } from "vitest"

import { scoreSearchMatch } from "@/lib/universal-search/score"

describe("scoreSearchMatch", () => {
  it("scores token overlap", () => {
    expect(scoreSearchMatch("Opening checklist temp log", "temp opening")).toBeGreaterThan(0)
  })

  it("returns zero for unrelated text", () => {
    expect(scoreSearchMatch("Payroll export", "espresso grind")).toBe(0)
  })
})
