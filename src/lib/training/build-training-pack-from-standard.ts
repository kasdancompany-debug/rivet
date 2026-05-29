import type { SaveSopPayload } from "@/app/actions/sops"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { parseStepPlayMetadata } from "@/lib/sops/play-metadata"
import { generateTrainingPack, type PlayTrainingPack } from "@/lib/training/generate-training-pack"
import type { Json, Tables } from "@/types/database"

type StepRow = Pick<
  Tables<"standard_steps">,
  "title" | "instructions" | "verification" | "is_critical" | "play_metadata" | "media_url"
>

export function buildTrainingPackFromStandard(input: {
  title: string
  description: string | null
  category: string
  capture: StandardsCaptureV1 | null
  steps: StepRow[]
  existingPack?: PlayTrainingPack | null
  /** When true, marks the training pack published to crew (separate from play publish). */
  trainingPublish?: boolean
}): PlayTrainingPack {
  const capture = input.capture
  const hasWalkthrough =
    input.steps.some(
      (s) => s.title === "Watch: operator walkthrough" && Boolean(s.media_url?.trim())
    ) ||
    Boolean(capture?.walkthroughMediaId || capture?.videoUrl)

  const pack = generateTrainingPack({
    title: input.title,
    description: input.description,
    category: input.category,
    assignedRoles: capture?.assignedRoles ?? [],
    competencyMarkers: capture?.competencyMarkers ?? [],
    playInference: capture?.playInference,
    hasWalkthroughVideo: hasWalkthrough,
    walkthroughMediaId: capture?.walkthroughMediaId ?? null,
    photoMediaIds: capture?.photoMediaIds ?? [],
    operationalMemory: capture?.operationalMemory,
    steps: input.steps
      .filter((s) => s.title !== "Watch: operator walkthrough")
      .map((s) => ({
        title: s.title,
        instructions: s.instructions,
        verification: s.verification,
        is_critical: s.is_critical,
        playMetadata: parseStepPlayMetadata(s.play_metadata),
      })),
    publish: input.trainingPublish ?? false,
  })

  return {
    ...pack,
    moduleId: input.existingPack?.moduleId ?? pack.moduleId,
    status: input.trainingPublish ? "published" : input.existingPack?.status ?? "draft",
  }
}

export function buildTrainingPackForSavePayload(payload: SaveSopPayload): PlayTrainingPack {
  const capture = parseStandardsCapture(payload.standards_capture)
  return buildTrainingPackFromStandard({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    capture,
    steps: payload.steps.map((s) => ({
      title: s.title,
      instructions: s.instructions,
      verification: s.verification ?? null,
      is_critical: s.is_critical ?? false,
      play_metadata: (s.play_metadata ?? {}) as Json,
      media_url: s.media_url ?? null,
    })),
    existingPack: capture?.trainingPack ?? null,
    trainingPublish: false,
  })
}
