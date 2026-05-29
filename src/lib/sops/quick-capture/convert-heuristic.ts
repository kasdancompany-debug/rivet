import { inferOperationalPlay } from "./infer-operational-meaning"
import { normalizeQuickCaptureDraft } from "./normalize-quick-capture-draft"
import type { QuickCaptureDraft } from "./types"

/** Offline conversion when OpenAI is unavailable. */
export function convertQuickCaptureHeuristic(rawText: string): QuickCaptureDraft {
  const inferred = inferOperationalPlay({ rawText })
  return normalizeQuickCaptureDraft(inferred, rawText)
}

/** Workflow demonstration — transcript from video/audio narration. */
export function convertWorkflowDemonstration(transcript: string): QuickCaptureDraft {
  const inferred = inferOperationalPlay({ rawText: transcript, fromWorkflow: true })
  return normalizeQuickCaptureDraft(
    {
      ...inferred,
      timingNotes: inferred.timingNotes ?? "Extracted from workflow demonstration",
      operationalProblem:
        inferred.operationalProblem ||
        "The demonstrated workflow is not yet a written standard the team can repeat without the owner.",
    },
    transcript
  )
}
