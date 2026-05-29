import { formatSopCategory } from "@/lib/sops/categories"
import {
  generateStandardQuiz,
  type StandardQuizQuestion,
} from "@/lib/sops/generate-standard-quiz"
import { parseStaffFailureComplaint } from "@/lib/sops/quick-capture/infer-operational-meaning"
import {
  inferOperationalMemoryFromDraft,
  savePayloadFromDraft,
} from "@/lib/sops/quick-capture/payload-from-draft"
import type { QuickCaptureDraft } from "@/lib/sops/quick-capture/types"
import { buildDraftTrainingPackFromSavePayload } from "@/lib/training/auto-generate-play-training"
import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"

export type AskRivetPreview = {
  sampleQuestion: string
  quickAnswer: string
  commonMistakes: string[]
  escalation: string
}

export type PlaySystemPreview = {
  originalPrompt: string
  draft: QuickCaptureDraft
  categoryLabel: string
  commonMistakes: string[]
  verificationRequirements: string[]
  trainingPack: PlayTrainingPack
  quizQuestions: StandardQuizQuestion[]
  askRivet: AskRivetPreview
}

function collectCommonMistakes(draft: QuickCaptureDraft): string[] {
  const fromSteps = draft.steps.flatMap((s) => s.commonMistakes ?? [])
  const combined = [...fromSteps, ...draft.trainingGaps.slice(0, 2)]
  return [...new Set(combined.map((m) => m.trim()).filter(Boolean))].slice(0, 8)
}

function collectVerificationRequirements(draft: QuickCaptureDraft): string[] {
  const fromSteps = draft.steps
    .map((s) => s.verification?.trim())
    .filter((v): v is string => Boolean(v))
  const combined = [...draft.verificationMethods, ...fromSteps]
  return [...new Set(combined.map((v) => v.trim()).filter(Boolean))].slice(0, 8)
}

export function inferCrewQuestion(originalPrompt: string, draft: QuickCaptureDraft): string {
  const parsed = parseStaffFailureComplaint(originalPrompt)
  if (parsed?.taskRaw) {
    const task = parsed.taskRaw.replace(/[.!?]+$/, "").trim()
    return `How do I ${task.toLowerCase()} properly?`
  }
  const title = draft.title.replace(/^(standard|play|procedure):\s*/i, "").trim()
  if (title.length >= 8) return `What's the right way to ${title.toLowerCase()}?`
  return `How should we handle ${draft.operationalProblem.toLowerCase()}?`
}

export function buildAskRivetPreview(
  draft: QuickCaptureDraft,
  originalPrompt: string
): AskRivetPreview {
  const sampleQuestion = inferCrewQuestion(originalPrompt, draft)
  const leadStep = draft.steps[0]
  const stepLead = leadStep
    ? `${leadStep.title}: ${leadStep.instructions.split(/[.!?]/)[0]?.trim()}.`
    : ""
  const quickAnswer = [draft.successCriteria, stepLead].filter(Boolean).join(" ").trim()
  const commonMistakes = collectCommonMistakes(draft)
  const escalation =
    draft.trainingRecommendations[0] ??
    draft.trainingCheckpoints[0] ??
    "If you are unsure, ask the shift lead before marking complete."

  return {
    sampleQuestion,
    quickAnswer,
    commonMistakes,
    escalation,
  }
}

export function buildPlaySystemPreview(
  draft: QuickCaptureDraft,
  originalPrompt: string
): PlaySystemPreview {
  const askRivet = buildAskRivetPreview(draft, originalPrompt)
  const memory = inferOperationalMemoryFromDraft(
    draft,
    askRivet.sampleQuestion,
    askRivet.quickAnswer
  )
  const payload = savePayloadFromDraft("preview", draft, undefined, memory)
  const trainingPack = buildDraftTrainingPackFromSavePayload(payload)
  const quiz = generateStandardQuiz({
    title: draft.title,
    description: draft.purpose,
    category: draft.category,
    steps: draft.steps.map((s) => ({
      title: s.title,
      instructions: s.instructions,
      is_critical: s.isCritical,
      verification: s.verification ?? null,
    })),
    competencyMarkers: [
      ...draft.trainingCheckpoints,
      ...draft.trainingQuestions.slice(0, 2),
    ],
  })

  return {
    originalPrompt,
    draft,
    categoryLabel: formatSopCategory(draft.category),
    commonMistakes: collectCommonMistakes(draft),
    verificationRequirements: collectVerificationRequirements(draft),
    trainingPack,
    quizQuestions: quiz.questions,
    askRivet,
  }
}
