import { describe, expect, it } from "vitest"

import { convertQuickCaptureHeuristic } from "./convert-heuristic"
import { parseStaffFailureComplaint } from "./infer-operational-meaning"
import { titleEchoesInput } from "./normalize-quick-capture-draft"

describe("parseStaffFailureComplaint", () => {
  it("parses 'Si keeps forgetting to load the freezer properly'", () => {
    const parsed = parseStaffFailureComplaint("Si keeps forgetting to load the freezer properly")
    expect(parsed).not.toBeNull()
    expect(parsed!.personName).toBe("Si")
    expect(parsed!.taskRaw.toLowerCase()).toContain("freezer")
  })
})

describe("convertQuickCaptureHeuristic", () => {
  it("does not echo complaint as title for staff failure prompts", () => {
    const raw = "Si keeps forgetting to load the freezer properly"
    const draft = convertQuickCaptureHeuristic(raw)

    expect(titleEchoesInput(draft.title, raw)).toBe(false)
    expect(draft.title.toLowerCase()).not.toBe(raw.toLowerCase())
    expect(draft.steps.some((s) => s.title.toLowerCase() === "run the routine")).toBe(false)
    expect(draft.rootCauses.length).toBeGreaterThanOrEqual(2)
    expect(draft.successCriteria.length).toBeGreaterThan(10)
    expect(draft.verificationMethods.length).toBeGreaterThan(0)
    expect(draft.steps.length).toBeGreaterThanOrEqual(3)
    expect(draft.steps.some((s) => s.title.toLowerCase().includes("stock"))).toBe(true)
    expect(draft.trainingQuestions.length).toBeGreaterThan(0)
    expect(draft.rootCauses.some((c) => c.title.toLowerCase().includes("visual"))).toBe(true)
    expect(draft.hiddenDependencies.length).toBeGreaterThan(0)
    expect(draft.trainingGaps.length).toBeGreaterThan(0)
  })

  it("converts a natural closing prompt into a structured draft", () => {
    const draft = convertQuickCaptureHeuristic(
      "How I close the cafe\n\n1. Lock the front door and turn off open sign\n2. Count the drawer and drop the deposit\n3. Wipe counters and set the alarm"
    )

    expect(draft.title.toLowerCase()).toMatch(/close|closing/)
    expect(draft.category).toBe("closing")
    expect(draft.steps.length).toBeGreaterThanOrEqual(2)
    expect(draft.trainingCheckpoints.some((c) => c.toLowerCase().includes("closing"))).toBe(true)
  })

  it("parses incident-style prompts like Ashley forgets freezer lock at close", () => {
    const draft = convertQuickCaptureHeuristic("Ashley forgets freezer lock at close")

    expect(draft.title.toLowerCase()).toMatch(/freezer|lock|close/)
    expect(draft.category).toBe("closing")
    expect(draft.steps.length).toBeGreaterThanOrEqual(3)
  })
})
