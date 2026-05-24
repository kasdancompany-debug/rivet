import { describe, expect, it } from "vitest"

import { generateStandardQuiz, gradeStandardQuiz } from "@/lib/sops/generate-standard-quiz"

describe("generateStandardQuiz", () => {
  it("generates 3–5 questions with mixed types", () => {
    const quiz = generateStandardQuiz({
      title: "Morning Open",
      description: "Open the cafe safely before guests arrive.",
      category: "opening",
      steps: [
        { title: "Unlock front door", instructions: "Use manager key and disable alarm within 60 seconds." },
        { title: "Start espresso", instructions: "Purge lines and pull first test shot.", is_critical: true },
        { title: "Turn on open sign", instructions: "Flip sign and verify hours on door." },
      ],
      competencyMarkers: ["Opening without owner"],
    })

    expect(quiz.questions.length).toBeGreaterThanOrEqual(3)
    expect(quiz.questions.length).toBeLessThanOrEqual(5)
    expect(quiz.questions.some((q) => q.type === "multiple_choice")).toBe(true)
    expect(quiz.questions.some((q) => q.type === "true_false")).toBe(true)
    expect(quiz.questions.some((q) => q.type === "scenario")).toBe(true)
  })

  it("grades all-or-nothing pass at 100%", () => {
    const quiz = generateStandardQuiz({
      title: "Close",
      description: null,
      category: "closing",
      steps: [{ title: "Lock up", instructions: "Set alarm and lock both doors." }],
    })
    const answers = Object.fromEntries(
      quiz.questions.map((q) => [q.id, q.correctIndex])
    )
    expect(gradeStandardQuiz(quiz, answers)).toEqual({ passed: true, score: 100 })
  })
})
