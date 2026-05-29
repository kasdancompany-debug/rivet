import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import type { SaveSopPayload } from "@/app/actions/sops"
import { buildTrainingPackForSavePayload } from "@/lib/training/build-training-pack-from-standard"
import type { Json } from "@/types/database"

export function buildTrainingPackForSave(payload: SaveSopPayload): StandardsCaptureV1["trainingPack"] {
  return buildTrainingPackForSavePayload(payload)
}

export function mergeTrainingPackIntoCapture(
  capture: Json | undefined,
  pack: StandardsCaptureV1["trainingPack"],
  moduleId: string | null
): Json {
  const base =
    capture && typeof capture === "object" && !Array.isArray(capture)
      ? { ...(capture as Record<string, unknown>) }
      : { version: 1 }

  return {
    ...base,
    trainingPack: pack ? { ...pack, moduleId: moduleId ?? pack.moduleId } : undefined,
  } as Json
}
