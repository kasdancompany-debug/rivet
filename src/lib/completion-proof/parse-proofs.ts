import type {
  StepManagerSignoffProof,
  StepPhotoProof,
  StepProofState,
  StepVideoProof,
} from "@/lib/completion-proof/types"

type LegacyPhotoRow = {
  stepId?: string
  mediaId?: string
  signedUrl?: string | null
}

type StoredStepProofRow = {
  stepId?: string
  photo?: StepPhotoProof | null
  video?: StepVideoProof | null
  managerSignoff?: StepManagerSignoffProof | null
}

function parsePhoto(raw: unknown): StepPhotoProof | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  if (typeof r.mediaId !== "string") return null
  return {
    mediaId: r.mediaId,
    signedUrl: typeof r.signedUrl === "string" ? r.signedUrl : null,
  }
}

function parseVideo(raw: unknown): StepVideoProof | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  if (typeof r.mediaId !== "string") return null
  return {
    mediaId: r.mediaId,
    signedUrl: typeof r.signedUrl === "string" ? r.signedUrl : null,
  }
}

function parseSignoff(raw: unknown): StepManagerSignoffProof | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  if (typeof r.signedOffBy !== "string" || typeof r.signedOffAt !== "string") return null
  return {
    signedOffBy: r.signedOffBy,
    signedOffAt: r.signedOffAt,
    signedOffName: typeof r.signedOffName === "string" ? r.signedOffName : null,
  }
}

function emptyState(stepId: string): StepProofState {
  return {
    stepId,
    photo: null,
    video: null,
    managerSignoff: null,
  }
}

/** Build per-step media/sign-off proof map (checklist uses `step_checklist` ids separately). */
export function parseStepProofMap(input: {
  stepProofsRaw: unknown
  photoProofsRaw?: unknown
}): Map<string, StepProofState> {
  const map = new Map<string, StepProofState>()

  if (Array.isArray(input.stepProofsRaw)) {
    for (const row of input.stepProofsRaw) {
      if (!row || typeof row !== "object") continue
      const r = row as StoredStepProofRow
      if (typeof r.stepId !== "string") continue
      map.set(r.stepId, {
        stepId: r.stepId,
        photo: parsePhoto(r.photo),
        video: parseVideo(r.video),
        managerSignoff: parseSignoff(r.managerSignoff),
      })
    }
  }

  if (Array.isArray(input.photoProofsRaw)) {
    for (const row of input.photoProofsRaw) {
      if (!row || typeof row !== "object") continue
      const r = row as LegacyPhotoRow
      if (typeof r.stepId !== "string") continue
      const existing = map.get(r.stepId) ?? emptyState(r.stepId)
      const photo = parsePhoto(r)
      if (photo) existing.photo = photo
      map.set(r.stepId, existing)
    }
  }

  return map
}

export function stepProofMapToJson(map: Map<string, StepProofState>): StoredStepProofRow[] {
  return [...map.values()].map((s) => ({
    stepId: s.stepId,
    photo: s.photo,
    video: s.video,
    managerSignoff: s.managerSignoff,
  }))
}

export function legacyPhotoProofsFromMap(map: Map<string, StepProofState>) {
  return [...map.values()]
    .filter((s) => s.photo)
    .map((s) => ({
      stepId: s.stepId,
      mediaId: s.photo!.mediaId,
      signedUrl: s.photo!.signedUrl,
    }))
}
