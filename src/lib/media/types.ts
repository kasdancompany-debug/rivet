import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"

export type OperationalUploadPhase = "preparing" | "uploading" | "finalizing" | "error"

export type OperationalUploadJob = {
  id: string
  fileName: string
  progress: number
  phase: OperationalUploadPhase
  /** UI slot id (e.g. walkthrough, reference-photo) for per-zone progress. */
  slot?: string
  errorMessage?: string
  retry?: () => void
}

export type OperationalMediaUploadResult = {
  row: StandardMediaRowSigned
}

export type OperationalMediaSlotValidator = (input: {
  contentType: string
  byteSize: number
  kind: "image" | "video" | "file"
}) => string | null

export type { StandardMediaRowSigned }
