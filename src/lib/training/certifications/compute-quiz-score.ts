import type { Tables } from "@/types/database"
import type { TrainingModuleDeep } from "@/lib/db/queries"
import { standardRequiresQuiz } from "@/lib/training/certifications/evaluate"

/** Average quiz score (0–100) across standards in the module that require a quiz. */
export function computeModuleQuizScorePct(
  module: TrainingModuleDeep,
  quizRows: Pick<Tables<"employee_standard_quiz_completions">, "standard_id" | "score" | "passed">[],
  standardsQuizJson: Map<string, unknown>
): number | null {
  const standardIds = [
    ...new Set(
      (module.training_items ?? [])
        .filter((i) => i.required !== false)
        .map((i) => i.standard_id)
    ),
  ]

  const quizRequired = standardIds.filter((id) =>
    standardRequiresQuiz(standardsQuizJson.get(id))
  )
  if (quizRequired.length === 0) return null

  const scores = quizRequired
    .map((id) => quizRows.find((r) => r.standard_id === id && r.passed))
    .filter(Boolean)
    .map((r) => r!.score)

  if (scores.length === 0) return null
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return Math.round(avg)
}
