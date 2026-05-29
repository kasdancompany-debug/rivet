import type { SaveSopPayload } from "@/app/actions/sops"
import type { OperationalMemory } from "@/lib/standards-capture/types"
import { STANDARDS_CAPTURE_VERSION } from "@/lib/standards-capture/types"
import type { QuickCaptureDraft } from "@/lib/sops/quick-capture/types"
import type { Json } from "@/types/database"

function priorityToImportance(priority: QuickCaptureDraft["priority"]): number {
  switch (priority) {
    case "critical":
      return 5
    case "high":
      return 4
    case "medium":
      return 3
    default:
      return 2
  }
}

export function inferOperationalMemoryFromDraft(
  draft: QuickCaptureDraft,
  sampleQuestion?: string,
  sampleAnswer?: string
): OperationalMemory {
  const stepMistakes = [
    ...new Set(draft.steps.flatMap((s) => s.commonMistakes ?? []).filter(Boolean)),
  ]
  const failureFromRoot =
    draft.rootCauses.find((c) => c.title.toLowerCase().includes("visual"))?.description ??
    draft.operationalProblem

  return {
    successLooksLike: draft.successCriteria || draft.purpose,
    failureLooksLike: failureFromRoot,
    newHireMistakes:
      stepMistakes.length > 0
        ? stepMistakes
        : draft.trainingGaps.slice(0, 3).length > 0
          ? draft.trainingGaps.slice(0, 3)
          : ["Skipping verification before marking complete"],
    ifNobodyAsks:
      draft.trainingRecommendations[0] ??
      draft.trainingCheckpoints[0] ??
      "Escalate to the shift lead before guessing—do not leave the task half-done.",
    ownerNote: draft.timingNotes?.trim() || undefined,
    faqs:
      sampleQuestion && sampleAnswer
        ? [{ question: sampleQuestion, answer: sampleAnswer }]
        : undefined,
    goodExampleMediaId: null,
    badExampleMediaId: null,
  }
}

export function buildCaptureFromDraft(
  draft: QuickCaptureDraft,
  operationalMemory?: OperationalMemory
): Json {
  return {
    version: STANDARDS_CAPTURE_VERSION,
    photoUrls: [],
    videoUrl: null,
    walkthroughMediaId: null,
    attachmentMediaIds: [],
    playInference: {
      operationalProblem: draft.operationalProblem,
      priority: draft.priority,
      successCriteria: draft.successCriteria,
      rootCauses: draft.rootCauses,
      estimatedRisk: draft.estimatedRisk,
      verificationMethods: draft.verificationMethods,
      trainingRecommendations: draft.trainingRecommendations,
      hiddenDependencies: draft.hiddenDependencies,
      trainingGaps: draft.trainingGaps,
      supplies: draft.supplies,
      timingNotes: draft.timingNotes,
    },
    operationalMemory: operationalMemory ?? inferOperationalMemoryFromDraft(draft),
    qualityStandards: [],
    acceptableExamples: [],
    unacceptableExamples: [],
    assignedRoles: draft.assignedRoles,
    competencyMarkers: draft.trainingCheckpoints,
  } satisfies Json
}

export function savePayloadFromDraft(
  businessId: string,
  draft: QuickCaptureDraft,
  sopId?: string,
  operationalMemory?: OperationalMemory
): SaveSopPayload {
  const memory = operationalMemory ?? inferOperationalMemoryFromDraft(draft)

  return {
    sopId,
    businessId,
    title: draft.title,
    description: draft.purpose,
    category: draft.category,
    importance_level: Math.max(draft.importanceLevel, priorityToImportance(draft.priority)),
    owner_dependency_level: draft.ownerDependencyLevel,
    estimated_time_minutes: draft.estimatedTimeMinutes,
    status: "draft",
    steps: draft.steps.map((step) => {
      const proof = step.proofRequirements
      const verification = step.verification?.toLowerCase() ?? ""
      return {
        title: step.title,
        instructions: step.instructions,
        media_url: null,
        requires_photo_confirmation: proof?.photo ?? verification.includes("photo"),
        requires_video_proof: proof?.video ?? verification.includes("video"),
        requires_manager_signoff:
          proof?.managerSignoff ??
          (verification.includes("manager") ||
            verification.includes("lead") ||
            verification.includes("sign-off") ||
            verification.includes("sign off")),
        requires_checklist_completion: proof?.checklist !== false,
        estimated_time_minutes: step.estimatedMinutes ?? null,
        is_critical: step.isCritical ?? false,
        verification: step.verification ?? null,
        play_metadata: {
          visualTarget: step.visualTarget ?? null,
          commonMistakes: step.commonMistakes ?? [],
        } as Json,
      }
    }),
    standards_capture: buildCaptureFromDraft(draft, memory),
  }
}
