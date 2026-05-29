/** Persisted in `sops.standards_capture` (JSON). */

import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"

export const STANDARDS_CAPTURE_VERSION = 1 as const

export type ExampleAsset = {
  url: string
  caption?: string
}

export type OperationalMemory = {
  successLooksLike: string
  failureLooksLike: string
  newHireMistakes: string[]
  ifNobodyAsks: string
  ownerNote?: string
  faqs?: { question: string; answer: string }[]
  goodExampleMediaId?: string | null
  badExampleMediaId?: string | null
}

export type PlayInferenceMetadata = {
  operationalProblem: string
  priority: string
  successCriteria: string
  rootCauses: { title: string; description: string }[]
  estimatedRisk: string
  verificationMethods: string[]
  trainingRecommendations: string[]
  hiddenDependencies?: string[]
  trainingGaps?: string[]
  supplies?: string[]
  timingNotes?: string
}

export type StandardsCaptureV1 = {
  version: typeof STANDARDS_CAPTURE_VERSION
  onboarding?: {
    interrupts?: string
    headOnly?: string
    weekAway?: string
  }
  videoUrl?: string | null
  /** `standard_media.id` for an uploaded walkthrough clip (private bucket). */
  walkthroughMediaId?: string | null
  /** Reference photos / screenshots uploaded to Storage. */
  photoMediaIds?: string[]
  /** Legacy external photo URLs (deprecated — prefer `photoMediaIds`). */
  photoUrls: string[]
  /** Owner audio walkthrough for this play. */
  audioExplanationMediaId?: string | null
  /** PDFs and other supporting documents. */
  supportingDocumentMediaIds?: string[]
  /** Attached document/audio media ids (legacy aggregate — kept for backward compatibility). */
  attachmentMediaIds?: string[]
  playInference?: PlayInferenceMetadata
  /** Owner-authored operational memory for Ask Rivet + crew execution. */
  operationalMemory?: OperationalMemory
  /** Auto-generated crew training from this play (objectives, checklist, cert). */
  trainingPack?: PlayTrainingPack
  qualityStandards: string[]
  acceptableExamples: ExampleAsset[]
  unacceptableExamples: ExampleAsset[]
  assignedRoles: string[]
  competencyMarkers: string[]
}

export function emptyStandardsCapture(): StandardsCaptureV1 {
  return {
    version: STANDARDS_CAPTURE_VERSION,
    walkthroughMediaId: null,
    photoMediaIds: [],
    photoUrls: [],
    audioExplanationMediaId: null,
    supportingDocumentMediaIds: [],
    qualityStandards: [],
    acceptableExamples: [],
    unacceptableExamples: [],
    assignedRoles: [],
    competencyMarkers: [],
  }
}

export const COMPETENCY_QUICK_ADD = [
  "Food safety sign-off",
  "Cash handling cleared",
  "Opening without owner",
  "Closing without owner",
  "Guest recovery",
] as const
