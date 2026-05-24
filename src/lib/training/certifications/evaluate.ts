import { parseStandardQuiz } from "@/lib/sops/generate-standard-quiz"

export type CertificationRequirements = {
  moduleCompleted: boolean
  quizzesPassed: boolean
  managerSignedOff: boolean
}

export type CertificationProgress = CertificationRequirements & {
  certified: boolean
  quizStandardIds: string[]
  quizRequiredStandardIds: string[]
}

export function standardRequiresQuiz(quizQuestionsJson: unknown): boolean {
  const quiz = parseStandardQuiz(quizQuestionsJson)
  return (quiz?.questions.length ?? 0) > 0
}

export function evaluateCertificationProgress(input: {
  moduleCompleted: boolean
  quizRequiredStandardIds: string[]
  passedQuizStandardIds: Set<string>
  managerSignedOff: boolean
}): CertificationProgress {
  const quizzesPassed =
    input.quizRequiredStandardIds.length === 0 ||
    input.quizRequiredStandardIds.every((id) => input.passedQuizStandardIds.has(id))

  const requirements: CertificationRequirements = {
    moduleCompleted: input.moduleCompleted,
    quizzesPassed,
    managerSignedOff: input.managerSignedOff,
  }

  return {
    ...requirements,
    certified:
      requirements.moduleCompleted && requirements.quizzesPassed && requirements.managerSignedOff,
    quizStandardIds: input.quizRequiredStandardIds,
    quizRequiredStandardIds: input.quizRequiredStandardIds,
  }
}

export function certificationBadgeLabel(moduleTitle: string): string {
  const trimmed = moduleTitle.trim()
  if (trimmed.length <= 28) return trimmed
  return `${trimmed.slice(0, 27)}…`
}
