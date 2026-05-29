import { describe, expect, it } from "vitest"

import { buildAskRivetIntelligenceDashboard } from "@/lib/ask-rivet/intelligence-dashboard"
import { COPY } from "@/lib/interface-copy"

describe("buildAskRivetIntelligenceDashboard", () => {
  it("tracks asks, repeats, low confidence, prevented, and recommendations", () => {
    const now = new Date()
    const rows = [
      {
        question_text: "How do I close the freezer?",
        normalized_question: "close freezer",
        standard_id: "std-1",
        prevented_owner_interrupt: true,
        response: { confidence: "high", quickAnswer: "Lock and log temp.", mediaAttachments: [] },
        created_at: now.toISOString(),
      },
      {
        question_text: "How do I close the freezer?",
        normalized_question: "close freezer",
        standard_id: "std-1",
        prevented_owner_interrupt: true,
        response: { confidence: "high", quickAnswer: "Lock and log temp.", mediaAttachments: [] },
        created_at: now.toISOString(),
      },
      {
        question_text: "Where is the mop?",
        normalized_question: "where mop",
        standard_id: null,
        prevented_owner_interrupt: false,
        response: { confidence: "low", quickAnswer: COPY.askRivet.lowConfidenceAnswer, mediaAttachments: [] },
        created_at: now.toISOString(),
      },
    ]

    const view = buildAskRivetIntelligenceDashboard(rows, new Set())

    expect(view.questionsAskedThisMonth).toBe(3)
    expect(view.repeatedQuestionsCount).toBe(1)
    expect(view.lowConfidenceQuestionsCount).toBe(1)
    expect(view.questionsPreventedThisMonth).toBe(2)
    expect(view.ownerHoursReturnedThisMonth).toBeGreaterThan(0)
    expect(view.recommendations.some((r) => r.fixKind === "create_play")).toBe(true)
    expect(view.recommendations.some((r) => r.fixKind === "add_media")).toBe(true)
    expect(view.topStaffQuestions.length).toBeGreaterThan(0)
    expect(view.confusionAreas.length).toBeGreaterThan(0)
  })
})
