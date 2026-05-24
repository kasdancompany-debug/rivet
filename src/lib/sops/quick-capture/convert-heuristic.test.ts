import { describe, expect, it } from "vitest"

import { convertQuickCaptureHeuristic } from "./convert-heuristic"

describe("convertQuickCaptureHeuristic", () => {
  it("converts a natural closing prompt into a structured draft", () => {
    const draft = convertQuickCaptureHeuristic(
      "How I close the cafe\n\n1. Lock the front door and turn off open sign\n2. Count the drawer and drop the deposit\n3. Wipe counters and set the alarm"
    )

    expect(draft.title.toLowerCase()).toContain("close")
    expect(draft.category).toBe("closing")
    expect(draft.steps.length).toBeGreaterThanOrEqual(2)
    expect(draft.trainingCheckpoints.some((c) => c.toLowerCase().includes("closing"))).toBe(true)
    expect(draft.estimatedTimeMinutes).toBeGreaterThan(0)
    expect(draft.ownerDependencyLevel).toBeGreaterThanOrEqual(1)
    expect(draft.ownerDependencyLevel).toBeLessThanOrEqual(5)
  })

  it("parses incident-style prompts like Ashley forgets freezer lock at close", () => {
    const draft = convertQuickCaptureHeuristic("Ashley forgets freezer lock at close")

    expect(draft.title.toLowerCase()).toMatch(/freezer|lock|close/)
    expect(draft.category).toBe("closing")
    expect(draft.steps.length).toBeGreaterThanOrEqual(1)
    expect(draft.assignedRoles.length).toBeGreaterThanOrEqual(0)
  })
})
