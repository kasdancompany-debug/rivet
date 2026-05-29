import type { SopStepPayload } from "@/app/actions/sops"
import {
  stepPlayMetadataToJson,
  type StepPlayMetadata,
} from "@/lib/sops/play-metadata"

export type CaptureStepFields = {
  estimatedMinutes: string
  isCritical: boolean
  verification: string
  requiresPhoto: boolean
  requiresVideo: boolean
  requiresManagerSignoff: boolean
  requiresChecklist: boolean
  notes: string
  visualTarget: string
  commonMistakes: string
  goodExampleCaption: string
  badExampleCaption: string
  goodExampleMediaId: string | null
  badExampleMediaId: string | null
  mediaIds: string[]
}

export function emptyCaptureStepFields(): CaptureStepFields {
  return {
    estimatedMinutes: "",
    isCritical: false,
    verification: "",
    requiresPhoto: false,
    requiresVideo: false,
    requiresManagerSignoff: false,
    requiresChecklist: true,
    notes: "",
    visualTarget: "",
    commonMistakes: "",
    goodExampleCaption: "",
    badExampleCaption: "",
    goodExampleMediaId: null,
    badExampleMediaId: null,
    mediaIds: [],
  }
}

function stepExampleRef(
  caption: string,
  mediaId: string | null
): StepPlayMetadata["goodExample"] {
  const text = caption.trim()
  if (!text && !mediaId) return undefined
  return {
    caption: text || undefined,
    mediaId: mediaId ?? undefined,
  }
}

export function parseStepEstimatedMinutes(raw: string): number | null {
  const n = Number(raw.trim())
  if (raw.trim() === "" || Number.isNaN(n)) return null
  return Math.max(0, Math.round(n))
}

export function captureFieldsToPlayMetadata(fields: CaptureStepFields): StepPlayMetadata {
  const mistakes = fields.commonMistakes
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 5)

  const goodExample = stepExampleRef(fields.goodExampleCaption, fields.goodExampleMediaId)
  const badExample = stepExampleRef(fields.badExampleCaption, fields.badExampleMediaId)

  const mediaIdSet = new Set(fields.mediaIds)
  if (fields.goodExampleMediaId) mediaIdSet.add(fields.goodExampleMediaId)
  if (fields.badExampleMediaId) mediaIdSet.add(fields.badExampleMediaId)

  return {
    visualTarget: fields.visualTarget.trim() || undefined,
    commonMistakes: mistakes.length ? mistakes : undefined,
    goodExample,
    badExample,
    mediaIds: mediaIdSet.size ? [...mediaIdSet] : undefined,
  }
}

export function playMetadataToCaptureFields(meta: StepPlayMetadata): Partial<CaptureStepFields> {
  return {
    visualTarget: meta.visualTarget ?? "",
    commonMistakes: (meta.commonMistakes ?? []).join("\n"),
    goodExampleCaption: meta.goodExample?.caption ?? "",
    badExampleCaption: meta.badExample?.caption ?? "",
    goodExampleMediaId: meta.goodExample?.mediaId ?? null,
    badExampleMediaId: meta.badExample?.mediaId ?? null,
    mediaIds: meta.mediaIds ?? [],
  }
}

export function stepPayloadExtras(fields: CaptureStepFields): Pick<
  SopStepPayload,
  "estimated_time_minutes" | "is_critical" | "verification" | "notes" | "play_metadata"
> {
  return {
    estimated_time_minutes: parseStepEstimatedMinutes(fields.estimatedMinutes),
    is_critical: fields.isCritical,
    verification: fields.verification.trim() === "" ? null : fields.verification.trim(),
    notes: fields.notes.trim() === "" ? null : fields.notes.trim(),
    play_metadata: stepPlayMetadataToJson(captureFieldsToPlayMetadata(fields)),
  }
}

export function walkthroughStepPayload(): SopStepPayload {
  return {
    title: "Watch: operator walkthrough",
    instructions:
      "Use this recording for pacing, order of operations, and where things live on the line.",
    media_url: null,
    requires_photo_confirmation: false,
    requires_video_proof: false,
    requires_manager_signoff: false,
    requires_checklist_completion: true,
    estimated_time_minutes: null,
    is_critical: false,
    verification: null,
    notes: null,
    play_metadata: {},
  }
}
