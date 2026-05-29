import { isAudioMedia, standardMediaApiPath } from "@/lib/standards/standard-media-display"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { stepProofRequirementsFromRow } from "@/lib/completion-proof/requirements"
import {
  enrichStepPlayMetadata,
  parseStepPlayMetadata,
  type StepPlayMetadata,
} from "@/lib/sops/play-metadata"
import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"
import type { Tables } from "@/types/database"
import type { PlayStepView } from "@/components/plays/play-step-card"

export type PlayViewModel = {
  standardId: string
  title: string
  category: string
  description: string | null
  status: string
  estimatedMinutes: number | null
  assignedRoles: string[]
  riskLabel: string
  riskLevel: "low" | "medium" | "high" | "critical"
  progressPct: number
  progressLabel: string
  operationalProblem: string | null
  successCriteria: string | null
  steps: PlayStepView[]
  trainingPack: PlayTrainingPack | null
  globalGoodExamples: { url: string; caption?: string; mediaId?: string }[]
  globalBadExamples: { url: string; caption?: string; mediaId?: string }[]
  walkthroughMediaId: string | null
  photoMediaIds: string[]
  audioExplanationMediaId: string | null
  supportingDocumentMediaIds: string[]
  signedMedia: StandardMediaRowSigned[]
  trainingModuleId: string | null
  updatedAt: string | null
}

function priorityToRisk(priority?: string): { level: PlayViewModel["riskLevel"]; label: string } {
  const p = (priority ?? "medium").toLowerCase()
  if (p === "critical") return { level: "critical", label: "Critical — stop-the-line if missed" }
  if (p === "high") return { level: "high", label: "High — quality or safety at stake" }
  if (p === "low") return { level: "low", label: "Low — routine with light impact" }
  return { level: "medium", label: "Medium — repeat misses pull owner back in" }
}

function computePlayReadiness(
  steps: { instructions: string; verification: string | null; playMetadata: StepPlayMetadata }[]
): { pct: number; label: string } {
  if (steps.length === 0) return { pct: 0, label: "Add steps to run this play" }
  let score = 0
  const max = steps.length * 3.3
  for (const s of steps) {
    if (s.instructions.trim().length >= 4) score += 1
    if (s.verification?.trim()) score += 1
    if (s.playMetadata.visualTarget?.trim()) score += 1
  }
  const pct = Math.round((score / max) * 100)
  if (pct >= 90) return { pct, label: "Ready for crew under pressure" }
  if (pct >= 60) return { pct, label: "Runnable — add visual targets where gaps remain" }
  return { pct, label: "Draft — verification and visuals still thin" }
}

export function buildPlayViewModel(input: {
  sop: Tables<"standards"> & { standard_steps: Tables<"standard_steps">[] }
  capture: StandardsCaptureV1 | null
  signedMedia: StandardMediaRowSigned[]
}): PlayViewModel {
  const capture = input.capture
  const inference = capture?.playInference
  const risk = priorityToRisk(inference?.priority)
  if (inference?.estimatedRisk?.trim()) {
    risk.label = inference.estimatedRisk.trim()
  }

  const mediaById = new Map(input.signedMedia.map((m) => [m.id, m]))
  const ordered = [...input.sop.standard_steps].sort((a, b) => a.step_order - b.step_order)

  const steps: PlayStepView[] = ordered
    .filter((st) => st.title !== "Watch: operator walkthrough")
    .map((st, index) => {
      const rawMeta = parseStepPlayMetadata(st.play_metadata)
      const playMetadata = enrichStepPlayMetadata(rawMeta, {
        title: st.title,
        instructions: st.instructions,
        verification: st.verification,
        isCritical: st.is_critical,
      })
      const ids = new Set(playMetadata.mediaIds ?? [])
      if (playMetadata.goodExample?.mediaId) ids.add(playMetadata.goodExample.mediaId)
      if (playMetadata.badExample?.mediaId) ids.add(playMetadata.badExample.mediaId)
      const attachedMedia = [...ids]
        .map((id) => mediaById.get(id))
        .filter((m): m is StandardMediaRowSigned => m != null)

      return {
        id: st.id,
        index,
        title: st.title,
        instructions: st.instructions,
        verification: st.verification,
        estimatedMinutes: st.estimated_time_minutes,
        isCritical: st.is_critical,
        requiresPhoto: st.requires_photo_confirmation,
        proofRequirements: stepProofRequirementsFromRow(st),
        mediaUrl: st.media_url,
        playMetadata,
        attachedMedia,
      }
    })

  const readiness = computePlayReadiness(steps)

  const trainingPack = capture?.trainingPack ?? null
  const goodMediaId = capture?.operationalMemory?.goodExampleMediaId ?? null
  const badMediaId = capture?.operationalMemory?.badExampleMediaId ?? null

  let photoMediaIds = capture?.photoMediaIds?.length ? [...capture.photoMediaIds] : []
  let audioExplanationMediaId = capture?.audioExplanationMediaId ?? null
  let supportingDocumentMediaIds = capture?.supportingDocumentMediaIds?.length
    ? [...capture.supportingDocumentMediaIds]
    : []

  if (
    !audioExplanationMediaId &&
    supportingDocumentMediaIds.length === 0 &&
    (capture?.attachmentMediaIds?.length ?? 0) > 0
  ) {
    for (const id of capture!.attachmentMediaIds!) {
      const row = mediaById.get(id)
      if (isAudioMedia(row) && !audioExplanationMediaId) {
        audioExplanationMediaId = id
      } else {
        supportingDocumentMediaIds.push(id)
      }
    }
  }

  return {
    standardId: input.sop.id,
    title: input.sop.title,
    category: input.sop.category,
    description: input.sop.description,
    status: input.sop.status,
    estimatedMinutes: input.sop.estimated_time_minutes,
    assignedRoles: capture?.assignedRoles ?? [],
    riskLabel: risk.label,
    riskLevel: risk.level,
    progressPct: readiness.pct,
    progressLabel: readiness.label,
    operationalProblem: inference?.operationalProblem ?? null,
    successCriteria: inference?.successCriteria ?? input.sop.description,
    steps,
    trainingPack,
    globalGoodExamples: goodMediaId
      ? [{ url: standardMediaApiPath(goodMediaId), mediaId: goodMediaId, caption: "Good example" }]
      : (capture?.acceptableExamples ?? []),
    globalBadExamples: badMediaId
      ? [{ url: standardMediaApiPath(badMediaId), mediaId: badMediaId, caption: "Bad example" }]
      : (capture?.unacceptableExamples ?? []),
    walkthroughMediaId: capture?.walkthroughMediaId ?? null,
    photoMediaIds,
    audioExplanationMediaId,
    supportingDocumentMediaIds,
    signedMedia: input.signedMedia,
    trainingModuleId: trainingPack?.moduleId ?? null,
    updatedAt: input.sop.updated_at ?? null,
  }
}
