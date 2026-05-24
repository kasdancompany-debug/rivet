import {
  generateStandardQuiz,
  gradeStandardQuiz,
  parseStandardQuiz,
  type StandardQuizQuestion,
  type StandardQuizQuestionType,
  type StandardQuizV1,
  STANDARD_QUIZ_TYPE_LABELS,
} from "@/lib/sops/generate-standard-quiz"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import type { Tables } from "@/types/database"

export type PortalQuizQuestion = StandardQuizQuestion

export {
  generateStandardQuiz,
  gradeStandardQuiz,
  parseStandardQuiz,
  STANDARD_QUIZ_TYPE_LABELS,
  type StandardQuizQuestion,
  type StandardQuizQuestionType,
  type StandardQuizV1,
}

/** Stored quiz on the standard, or generate on the fly for older SOPs. */
export function resolveQuizForStandard(
  sop: Pick<Tables<"standards">, "title" | "description" | "category" | "quiz_questions">,
  steps: Tables<"standard_steps">[],
  capture: StandardsCaptureV1 | null
): StandardQuizQuestion[] {
  const stored = parseStandardQuiz(sop.quiz_questions)
  if (stored && stored.questions.length >= 3) {
    return stored.questions
  }

  const generated = generateStandardQuiz({
    title: sop.title,
    description: sop.description,
    category: sop.category,
    steps: steps.map((s) => ({
      id: s.id,
      title: s.title,
      instructions: s.instructions,
      is_critical: s.is_critical,
      verification: s.verification,
    })),
    competencyMarkers: capture?.competencyMarkers ?? [],
  })
  return generated.questions
}

/** @deprecated Use gradeStandardQuiz */
export function gradePortalQuiz(
  questions: StandardQuizQuestion[],
  answers: Record<string, number>
): { passed: boolean; score: number } {
  return gradeStandardQuiz({ version: 1, generatedAt: "", questions }, answers)
}
