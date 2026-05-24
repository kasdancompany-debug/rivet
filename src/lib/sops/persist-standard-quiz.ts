import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import {
  generateStandardQuiz,
  type StandardQuizInput,
  type StandardQuizV1,
} from "@/lib/sops/generate-standard-quiz"
import type { SaveSopPayload } from "@/app/actions/sops"

export function buildQuizInputFromSavePayload(payload: SaveSopPayload): StandardQuizInput {
  const capture = parseStandardsCapture(payload.standards_capture ?? null)
  return {
    title: payload.title.trim(),
    description: payload.description,
    category: payload.category,
    steps: payload.steps.map((s) => ({
      title: s.title,
      instructions: s.instructions,
      is_critical: s.is_critical,
      verification: s.verification,
    })),
    competencyMarkers: capture?.competencyMarkers ?? [],
  }
}

export function quizJsonFromSavePayload(payload: SaveSopPayload): StandardQuizV1 {
  return generateStandardQuiz(buildQuizInputFromSavePayload(payload))
}
