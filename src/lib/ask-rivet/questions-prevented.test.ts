import { describe, expect, it } from "vitest"

import { buildQuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import { COPY } from "@/lib/interface-copy"

describe("buildQuestionsPreventedMetrics", () => {
  it("aggregates prevented counts and surfaces most asked", () => {
    const now = new Date()
    const rows = [
      {
        question_text: "How do I close the freezer?",
        normalized_question: "close freezer",
        standard_id: "std-1",
        prevented_owner_interrupt: true,
        response: { confidence: "high", quickAnswer: "Lock and log temp.", mediaAttachments: [{ url: "x" }] },
        created_at: now.toISOString(),
      },
      {
        question_text: "How do I close the freezer?",
        normalized_question: "close freezer",
        standard_id: "std-1",
        prevented_owner_interrupt: true,
        response: { confidence: "high", quickAnswer: "Lock and log temp.", mediaAttachments: [{ url: "x" }] },
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

    const metrics = buildQuestionsPreventedMetrics(rows, new Set(["std-1"]))

    expect(metrics.questionsAnsweredThisWeek).toBe(3)
    expect(metrics.questionsPreventedThisMonth).toBe(2)
    expect(metrics.mostAsked?.question).toBe("How do I close the freezer?")
    expect(metrics.unverifiedQuestions.length).toBeGreaterThan(0)
    expect(metrics.repeatedWithFixes.some((r) => r.normalizedQuestion === "close freezer")).toBe(true)
    expect(metrics.topStaffQuestions.length).toBeGreaterThan(0)
    expect(metrics.confusionAreas.some((a) => a.question.includes("mop"))).toBe(true)
    expect(metrics.questionsAnsweredThisMonth).toBe(3)
  })
})
