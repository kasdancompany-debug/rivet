import type { SopCategoryValue } from "@/lib/sops/categories"

export type QuickCapturePriority = "low" | "medium" | "high" | "critical"

export type QuickCaptureRootCause = {
  title: string
  description: string
}

/** Per-step completion proof the capture form can apply. */
export type QuickCaptureStepProof = {
  photo?: boolean
  video?: boolean
  checklist?: boolean
  managerSignoff?: boolean
}

export type QuickCaptureStep = {
  title: string
  instructions: string
  estimatedMinutes?: number
  verification?: string
  supplies?: string[]
  isCritical?: boolean
  visualTarget?: string
  commonMistakes?: string[]
  proofRequirements?: QuickCaptureStepProof
}

export type QuickCaptureDraft = {
  title: string
  category: SopCategoryValue
  /** Why this play exists — success state in plain language. */
  purpose: string
  /** Underlying operational problem Rivet inferred (not the user's complaint verbatim). */
  operationalProblem: string
  priority: QuickCapturePriority
  successCriteria: string
  rootCauses: QuickCaptureRootCause[]
  estimatedRisk: string
  verificationMethods: string[]
  trainingRecommendations: string[]
  /** Dependencies that fail silently when this step is skipped. */
  hiddenDependencies: string[]
  /** Skills or habits the team likely lacks before this play will hold. */
  trainingGaps: string[]
  supplies?: string[]
  timingNotes?: string
  steps: QuickCaptureStep[]
  trainingCheckpoints: string[]
  /** Quiz-style questions to verify training comprehension. */
  trainingQuestions: string[]
  assignedRoles: string[]
  estimatedTimeMinutes: number
  ownerDependencyLevel: number
  importanceLevel: number
}

export type QuickCaptureSource = "openai" | "heuristic" | "workflow" | "media"
