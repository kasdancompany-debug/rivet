import { parseStandardQuiz } from "@/lib/sops/generate-standard-quiz"

export type CertificationRequirements = {
  moduleCompleted: boolean
  quizzesPassed: boolean
  proofUploaded: boolean
  managerSignedOff: boolean
}

export type CertificationProgress = CertificationRequirements & {
  certified: boolean
  proofRequired: boolean
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
  proofRequired: boolean
  proofUploaded: boolean
  managerSignedOff: boolean
}): CertificationProgress {
  const quizzesPassed =
    input.quizRequiredStandardIds.length === 0 ||
    input.quizRequiredStandardIds.every((id) => input.passedQuizStandardIds.has(id))

  const proofUploaded = input.proofRequired ? input.proofUploaded : true

  const requirements: CertificationRequirements = {
    moduleCompleted: input.moduleCompleted,
    quizzesPassed,
    proofUploaded,
    managerSignedOff: input.managerSignedOff,
  }

  return {
    ...requirements,
    proofRequired: input.proofRequired,
    certified:
      requirements.moduleCompleted &&
      requirements.quizzesPassed &&
      requirements.proofUploaded &&
      requirements.managerSignedOff,
    quizStandardIds: input.quizRequiredStandardIds,
    quizRequiredStandardIds: input.quizRequiredStandardIds,
  }
}

/** Full certificate title, e.g. "Opening Certified". */
export function certificationDisplayName(moduleTitle: string): string {
  const trimmed = moduleTitle.trim()
  if (/certified$/i.test(trimmed)) return trimmed
  return `${trimmed} Certified`
}

/** Compact badge label for chips. */
export function certificationBadgeLabel(moduleTitle: string): string {
  const name = certificationDisplayName(moduleTitle)
  if (name.length <= 32) return name
  return `${name.slice(0, 31)}…`
}
