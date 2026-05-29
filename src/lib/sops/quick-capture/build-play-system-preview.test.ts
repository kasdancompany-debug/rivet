import { describe, expect, it } from "vitest"

import { convertQuickCaptureHeuristic } from "@/lib/sops/quick-capture/convert-heuristic"
import {
  buildPlaySystemPreview,
  inferCrewQuestion,
} from "@/lib/sops/quick-capture/build-play-system-preview"

describe("buildPlaySystemPreview", () => {
  it("builds a full system from a staff failure complaint", () => {
    const raw = "Ashley keeps forgetting freezer stocking."
    const draft = convertQuickCaptureHeuristic(raw)
    const preview = buildPlaySystemPreview(draft, raw)

    expect(preview.draft.title.length).toBeGreaterThan(10)
    expect(preview.categoryLabel.length).toBeGreaterThan(0)
    expect(preview.draft.steps.length).toBeGreaterThanOrEqual(3)
    expect(preview.commonMistakes.length).toBeGreaterThan(0)
    expect(preview.verificationRequirements.length).toBeGreaterThan(0)
    expect(preview.trainingPack.learningObjectives.length).toBeGreaterThan(0)
    expect(preview.trainingPack.lessonSections.length).toBeGreaterThan(0)
    expect(preview.quizQuestions.length).toBeGreaterThanOrEqual(3)
    expect(preview.askRivet.sampleQuestion.toLowerCase()).toContain("freezer")
    expect(preview.askRivet.quickAnswer.length).toBeGreaterThan(20)
  })
})

describe("inferCrewQuestion", () => {
  it("turns owner complaint into a crew question", () => {
    const draft = convertQuickCaptureHeuristic("Ashley keeps forgetting freezer stocking.")
    expect(inferCrewQuestion("Ashley keeps forgetting freezer stocking.", draft)).toMatch(
      /how do i/i
    )
  })
})
