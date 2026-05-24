import type { SopStepPayload } from "@/app/actions/sops"

export type CaptureStepFields = {
  estimatedMinutes: string
  isCritical: boolean
  verification: string
  requiresPhoto: boolean
  notes: string
}

export function emptyCaptureStepFields(): CaptureStepFields {
  return {
    estimatedMinutes: "",
    isCritical: false,
    verification: "",
    requiresPhoto: false,
    notes: "",
  }
}

export function parseStepEstimatedMinutes(raw: string): number | null {
  const n = Number(raw.trim())
  if (raw.trim() === "" || Number.isNaN(n)) return null
  return Math.max(0, Math.round(n))
}

export function stepPayloadExtras(fields: CaptureStepFields): Pick<
  SopStepPayload,
  "estimated_time_minutes" | "is_critical" | "verification" | "notes"
> {
  return {
    estimated_time_minutes: parseStepEstimatedMinutes(fields.estimatedMinutes),
    is_critical: fields.isCritical,
    verification: fields.verification.trim() === "" ? null : fields.verification.trim(),
    notes: fields.notes.trim() === "" ? null : fields.notes.trim(),
  }
}

export function walkthroughStepPayload(): SopStepPayload {
  return {
    title: "Watch: operator walkthrough",
    instructions:
      "Use this recording for pacing, order of operations, and where things live on the line.",
    media_url: null,
    requires_photo_confirmation: false,
    estimated_time_minutes: null,
    is_critical: false,
    verification: null,
    notes: null,
  }
}
