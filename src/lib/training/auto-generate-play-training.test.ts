import { describe, expect, it } from "vitest"

import { shouldAutoGenerateTrainingPack } from "@/lib/training/auto-generate-play-training"
import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"

const draftPack = {
  version: 1,
  generatedAt: "2026-01-01T00:00:00.000Z",
  status: "draft",
  learningObjectives: ["A"],
  lessonSections: [],
  videoSections: [],
  scenarioQuestions: [],
  quizQuestions: [],
  visualQuizzes: [],
  completionChecklist: [],
  requiresManagerSignOff: true,
  certificationBadge: { title: "T", description: "D" },
} satisfies PlayTrainingPack

describe("shouldAutoGenerateTrainingPack", () => {
  it("generates on first publish", () => {
    expect(
      shouldAutoGenerateTrainingPack({ playJustPublished: true, existingPack: null })
    ).toBe(true)
  })

  it("generates when no pack exists on update", () => {
    expect(
      shouldAutoGenerateTrainingPack({ playJustPublished: false, existingPack: null })
    ).toBe(true)
  })

  it("skips when draft exists and play was already published", () => {
    expect(
      shouldAutoGenerateTrainingPack({
        playJustPublished: false,
        existingPack: draftPack,
      })
    ).toBe(false)
  })

  it("regenerates when forced", () => {
    expect(
      shouldAutoGenerateTrainingPack({
        playJustPublished: false,
        existingPack: draftPack,
        forceRegenerate: true,
      })
    ).toBe(true)
  })
})
