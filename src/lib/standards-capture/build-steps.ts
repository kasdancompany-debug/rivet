import type { SopStepPayload } from "@/app/actions/sops"

export type CaptureChecklistRow = {
  text: string
  detail: string
  requiresPhoto: boolean
  requiresVideo?: boolean
  requiresManagerSignoff?: boolean
  requiresChecklist?: boolean
}

export function buildStepsFromCapture(
  videoUrl: string | null,
  rows: CaptureChecklistRow[]
): SopStepPayload[] {
  const steps: SopStepPayload[] = []
  const v = videoUrl?.trim()
  if (v) {
    steps.push({
      title: "Watch: operator walkthrough",
      instructions:
        "Use this recording for pacing, order of operations, and where things live on the line.",
      media_url: v,
      requires_photo_confirmation: false,
    })
  }
  for (const row of rows) {
    const t = row.text.trim()
    if (!t) continue
    const detail = row.detail.trim()
    const title = t.length > 200 ? `${t.slice(0, 197)}…` : t
    steps.push({
      title,
      instructions: detail,
      media_url: null,
      requires_photo_confirmation: row.requiresPhoto,
      requires_video_proof: Boolean(row.requiresVideo),
      requires_manager_signoff: Boolean(row.requiresManagerSignoff),
      requires_checklist_completion: row.requiresChecklist !== false,
    })
  }
  return steps
}
