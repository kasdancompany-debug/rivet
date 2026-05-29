import { describe, expect, it } from "vitest"

import { buildHighFrictionAlerts } from "@/lib/high-friction-alerts/build-alerts"
import type { Tables } from "@/types/database"

describe("buildHighFrictionAlerts", () => {
  it("builds ask, interruption, quiz, and view alerts with recommendations", () => {
    const standards = [
      {
        id: "std-opening",
        title: "Opening checklist",
        quiz_questions: {
          version: 1,
          generatedAt: "2026-01-01",
          questions: [
            {
              id: "q-open",
              type: "multiple_choice",
              prompt: "First step at open?",
              options: ["Unlock", "Count drawer", "Call owner"],
              correctIndex: 0,
            },
          ],
        },
      },
      {
        id: "std-freezer",
        title: "Freezer loading",
        quiz_questions: { version: 1, generatedAt: "2026-01-01", questions: [] },
      },
    ] as unknown as Tables<"standards">[]

    const alerts = buildHighFrictionAlerts({
      askRows: [
        {
          question_text: "What is the refund policy?",
          normalized_question: "what is the refund policy",
          standard_id: null,
          created_at: "2026-05-10T10:00:00Z",
        },
        {
          question_text: "Refund policy for comps?",
          normalized_question: "what is the refund policy",
          standard_id: null,
          created_at: "2026-05-11T10:00:00Z",
        },
        {
          question_text: "Refund limits?",
          normalized_question: "what is the refund policy",
          standard_id: null,
          created_at: "2026-05-12T10:00:00Z",
        },
      ],
      interruptions: [
        { summary: "Freezer loading question", kind: "staff_ping" },
        { summary: "Freezer loading question", kind: "staff_ping" },
      ] as Tables<"owner_interruptions">[],
      standards,
      quizCompletions: [
        {
          standard_id: "std-opening",
          employee_id: "e1",
          score: 40,
          passed: false,
          answers: { "q-open": 2 },
        },
        {
          standard_id: "std-opening",
          employee_id: "e2",
          score: 30,
          passed: false,
          answers: { "q-open": 1 },
        },
      ] as unknown as Tables<"employee_standard_quiz_completions">[],
      playViews: Array.from({ length: 6 }, (_, i) => ({
        standard_id: "std-opening",
        viewed_by: `u${i}`,
        created_at: "2026-05-15T10:00:00Z",
      })) as Pick<Tables<"standard_play_views">, "standard_id" | "viewed_by" | "created_at">[],
    })

    expect(alerts.some((a) => a.source === "ask_rivet_repeat")).toBe(true)
    expect(alerts.some((a) => a.source === "interruption_repeat")).toBe(true)
    expect(alerts.some((a) => a.source === "quiz_question_fail")).toBe(true)
    expect(alerts.some((a) => a.source === "high_views_low_training")).toBe(true)

    const refund = alerts.find((a) => a.headline.toLowerCase().includes("refund"))
    expect(refund?.recommendations.some((r) => r.kind === "create_new_play")).toBe(true)

    const opening = alerts.find((a) => a.standardId === "std-opening")
    expect(opening?.recommendations.length).toBeGreaterThanOrEqual(3)
  })
})
