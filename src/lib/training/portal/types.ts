import type { PortalQuizQuestion } from "@/lib/training/portal/quiz"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import type { Tables, TrainingProgressStatus } from "@/types/database"

export type TrainingPhotoProof = {
  stepId: string
  mediaId: string
  signedUrl: string | null
}

export type PortalSopProgress = {
  stepChecklist: string[]
  videoWatched: boolean
  quizPassed: boolean
  quizAnswers: Record<string, number>
  photoProofs: TrainingPhotoProof[]
  completed: boolean
}

export type PortalTrainingItem = {
  trainingItemId: string
  standardId: string
  title: string
  description: string | null
  required: boolean
  estimatedMinutes: number
  steps: Tables<"standard_steps">[]
  capture: StandardsCaptureV1 | null
  videoUrl: string | null
  walkthroughMedia: StandardMediaRowSigned | null
  quiz: PortalQuizQuestion[]
  photoRequiredStepIds: string[]
  progress: PortalSopProgress
}

export type PortalModuleView = {
  moduleId: string
  title: string
  description: string | null
  businessName: string
  status: TrainingProgressStatus
  progressPct: number
  estimatedTotalMinutes: number
  items: PortalTrainingItem[]
  activeItemIndex: number
}

export type ResolvedTrainingInvite = {
  valid: boolean
  reason?: string
  inviteId?: string
  businessId?: string
  businessName?: string
  moduleId?: string
  moduleTitle?: string
  moduleDescription?: string | null
  employeeId?: string | null
  recipientEmail?: string | null
  recipientPhone?: string | null
}
