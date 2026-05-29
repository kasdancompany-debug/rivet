import { describe, expect, it } from "vitest"

import { convertQuickCaptureHeuristic } from "./convert-heuristic"
import {
  draftNeedsHeuristicFallback,
  mergeQuickCaptureDraft,
  textEchoesInput,
  titleEchoesInput,
} from "./normalize-quick-capture-draft"
import { inferOperationalPlay } from "./infer-operational-meaning"

describe("textEchoesInput", () => {
  const raw = "Si keeps forgetting to load the freezer properly"

  it("detects verbatim echo", () => {
    expect(textEchoesInput(raw, raw)).toBe(true)
    expect(titleEchoesInput(raw, raw)).toBe(true)
  })

  it("allows professional title", () => {
    expect(textEchoesInput("Freezer loading and end-of-shift stocking", raw)).toBe(false)
  })
})

describe("mergeQuickCaptureDraft", () => {
  const raw = "Si keeps forgetting to load the freezer properly"
  const fallback = inferOperationalPlay({ rawText: raw })

  it("rejects echoed AI title in favor of heuristic", () => {
    const merged = mergeQuickCaptureDraft(
      {
        title: raw,
        category: "other",
        steps: [{ title: raw, instructions: raw }],
        operationalProblem: raw,
      },
      fallback,
      raw
    )
    expect(merged.title.toLowerCase()).toContain("freezer")
    expect(textEchoesInput(merged.title, raw)).toBe(false)
    expect(textEchoesInput(merged.operationalProblem, raw)).toBe(false)
  })
})

describe("convertQuickCaptureHeuristic — Si freezer", () => {
  const raw = "Si keeps forgetting to load the freezer properly"

  it("produces operationally aware draft without echo", () => {
    const draft = convertQuickCaptureHeuristic(raw)
    expect(draftNeedsHeuristicFallback(draft, raw)).toBe(false)
    expect(draft.hiddenDependencies.length).toBeGreaterThan(0)
    expect(draft.trainingGaps.length).toBeGreaterThan(0)
    expect(draft.steps.some((s) => s.proofRequirements?.photo || s.proofRequirements?.checklist)).toBe(
      true
    )
  })
})
