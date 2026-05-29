import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { estimateSopMinutes } from "@/lib/training/portal/estimate-time"
import { resolveQuizForStandard } from "@/lib/training/portal/quiz"
import { parseStepProofMap } from "@/lib/completion-proof/parse-proofs"
import type { StepProofState } from "@/lib/completion-proof/types"
import type {
  PortalModuleView,
  PortalSopProgress,
  PortalTrainingItem,
  ResolvedTrainingInvite,
  TrainingPhotoProof,
} from "@/lib/training/portal/types"
import type { StandardWithSteps, TrainingModuleDeep } from "@/lib/db/queries"
import type { Tables, TrainingProgressStatus } from "@/types/database"

function emptyProgress(): PortalSopProgress {
  return {
    stepChecklist: [],
    videoWatched: false,
    quizPassed: false,
    quizAnswers: {},
    photoProofs: [],
    stepProofByStepId: {},
    completed: false,
  }
}

function parsePhotoProofs(raw: unknown): TrainingPhotoProof[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null
      const r = row as Record<string, unknown>
      if (typeof r.stepId !== "string" || typeof r.mediaId !== "string") return null
      return {
        stepId: r.stepId,
        mediaId: r.mediaId,
        signedUrl: typeof r.signedUrl === "string" ? r.signedUrl : null,
      }
    })
    .filter(Boolean) as TrainingPhotoProof[]
}

function progressFromRow(
  row: Tables<"training_sop_progress"> | undefined,
  completed: boolean,
  quizPassedFromProfile: boolean
): PortalSopProgress {
  if (!row && !quizPassedFromProfile) return { ...emptyProgress(), completed }
  const checklist = Array.isArray(row?.step_checklist)
    ? row.step_checklist.filter((v): v is string => typeof v === "string")
    : []
  const quizAnswers =
    row?.quiz_answers && typeof row.quiz_answers === "object" && !Array.isArray(row.quiz_answers)
      ? (row.quiz_answers as Record<string, number>)
      : {}
  const quizPassed = quizPassedFromProfile || Boolean(row?.quiz_passed)
  const proofMap = parseStepProofMap({
    stepProofsRaw: row?.step_proofs,
    photoProofsRaw: row?.photo_proofs,
  })
  const stepProofByStepId: Record<string, StepProofState> = {}
  for (const [id, state] of proofMap) {
    stepProofByStepId[id] = state
  }
  const photoProofs = parsePhotoProofs(row?.photo_proofs)
  return {
    stepChecklist: checklist,
    videoWatched: Boolean(row?.video_watched_at),
    quizPassed,
    quizAnswers,
    photoProofs,
    stepProofByStepId,
    completed,
  }
}

function resolveWalkthrough(
  capture: ReturnType<typeof parseStandardsCapture>,
  signedMedia: StandardMediaRowSigned[]
): { videoUrl: string | null; walkthrough: StandardMediaRowSigned | null } {
  if (capture?.walkthroughMediaId) {
    const row = signedMedia.find((m) => m.id === capture.walkthroughMediaId) ?? null
    return { videoUrl: row?.signedUrl ?? null, walkthrough: row }
  }
  const external = capture?.videoUrl?.trim()
  if (external) return { videoUrl: external, walkthrough: null }
  const clip = signedMedia.find((m) => m.kind === "video") ?? null
  return { videoUrl: clip?.signedUrl ?? null, walkthrough: clip }
}

export function parseResolvedInvite(raw: unknown): ResolvedTrainingInvite {
  if (!raw || typeof raw !== "object") return { valid: false, reason: "not_found" }
  const r = raw as Record<string, unknown>
  if (r.valid !== true) {
    return {
      valid: false,
      reason: typeof r.reason === "string" ? r.reason : "not_found",
      moduleId: typeof r.moduleId === "string" ? r.moduleId : undefined,
    }
  }
  return {
    valid: true,
    inviteId: typeof r.inviteId === "string" ? r.inviteId : undefined,
    businessId: typeof r.businessId === "string" ? r.businessId : undefined,
    businessName: typeof r.businessName === "string" ? r.businessName : undefined,
    moduleId: typeof r.moduleId === "string" ? r.moduleId : undefined,
    moduleTitle: typeof r.moduleTitle === "string" ? r.moduleTitle : undefined,
    moduleDescription: typeof r.moduleDescription === "string" ? r.moduleDescription : null,
    employeeId: typeof r.employeeId === "string" ? r.employeeId : null,
    recipientEmail: typeof r.recipientEmail === "string" ? r.recipientEmail : null,
    recipientPhone: typeof r.recipientPhone === "string" ? r.recipientPhone : null,
  }
}

export async function buildPortalModuleView(input: {
  module: TrainingModuleDeep
  businessName: string
  assignment: Tables<"training_progress"> | null
  sopsById: Map<string, StandardWithSteps>
  progressRows: Tables<"training_sop_progress">[]
  completionIds: Set<string>
  passedQuizStandardIds?: Set<string>
  activeItemId?: string | null
}): Promise<PortalModuleView> {
  const items: PortalTrainingItem[] = []
  let done = 0
  let estimatedTotalMinutes = 0

  for (const item of input.module.training_items ?? []) {
    if (!item.required) continue
    const sop = input.sopsById.get(item.standard_id)
    if (!sop) continue

    const capture = parseStandardsCapture(sop.standards_capture)
    const signedMedia = await signStandardMediaRows(sop.standard_media ?? [])
    const { videoUrl, walkthrough } = resolveWalkthrough(capture, signedMedia)
    const steps = sop.standard_steps ?? []
    const estimatedMinutes = estimateSopMinutes(sop, steps)
    estimatedTotalMinutes += estimatedMinutes

    const completed = input.completionIds.has(item.id)
    if (completed) done += 1

    const progressRow = input.progressRows.find((p) => p.training_item_id === item.id)
    const quizPassedFromProfile = input.passedQuizStandardIds?.has(sop.id) ?? false

    items.push({
      trainingItemId: item.id,
      standardId: sop.id,
      title: sop.title,
      description: sop.description,
      required: item.required,
      estimatedMinutes,
      steps,
      capture,
      videoUrl,
      walkthroughMedia: walkthrough,
      quiz: resolveQuizForStandard(sop, steps, capture),
      progress: progressFromRow(progressRow, completed, quizPassedFromProfile),
    })
  }

  const total = items.length
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100)
  const status: TrainingProgressStatus =
    input.assignment?.status ??
    (progressPct === 100 ? "completed" : progressPct > 0 ? "in_progress" : "not_started")

  let activeItemIndex = 0
  if (input.activeItemId) {
    const idx = items.findIndex((i) => i.trainingItemId === input.activeItemId)
    if (idx >= 0) activeItemIndex = idx
  } else {
    const firstOpen = items.findIndex((i) => !i.progress.completed)
    activeItemIndex = firstOpen >= 0 ? firstOpen : 0
  }

  return {
    moduleId: input.module.id,
    title: input.module.title,
    description: input.module.description,
    businessName: input.businessName,
    status,
    progressPct,
    estimatedTotalMinutes,
    items,
    activeItemIndex,
  }
}
