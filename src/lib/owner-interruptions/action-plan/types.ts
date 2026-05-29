import type { InterruptionFixType } from "@/lib/owner-interruptions/fix-suggestions/types"
import type {
  InterruptionFixImpact,
  InterruptionOutcomeItem,
} from "@/lib/owner-interruptions/outcomes/types"
import type { InterruptionActionFixType, InterruptionActionPlanStatus } from "@/types/database"

export type AffectedPerson = {
  profileId: string
  name: string
  role: string
  reason: string
}

export type RelatedStandardRef = {
  id: string
  title: string
  status: string
}

export type RelatedModuleRef = {
  id: string
  title: string
  assignedRole: string | null
}

export type InterruptionFixAnalysis = {
  fixType: InterruptionFixType
  rootCause: string
  suggestedTitle: string
  suggestedDescription: string
  capturePrompt: string
  repeatCount: number
  inferredRoles: string[]
}

export type InterruptionActionPlanView = {
  id: string
  interruptionId: string
  status: InterruptionActionPlanStatus
  fixType: InterruptionActionFixType
  rootCause: string
  suggestedTitle: string
  suggestedDescription: string | null
  relatedStandard: RelatedStandardRef | null
  relatedModule: RelatedModuleRef | null
  draftStandardId: string | null
  draftModuleId: string | null
  draftEditHref: string | null
  affectedPeople: AffectedPerson[]
  isOwner: boolean
  canApprove: boolean
  canPublish: boolean
  canDismiss: boolean
  repeatCount: number
  recommendations: {
    suggestNewPlay: boolean
    suggestTraining: boolean
    suggestMedia: boolean
    suggestAskRivet: boolean
  }
  outcomes: InterruptionOutcomeItem[]
  impact: InterruptionFixImpact | null
  askMatchCount: number
}
