import { convertQuickCaptureHeuristic, convertWorkflowDemonstration } from "@/lib/sops/quick-capture/convert-heuristic"
import type { QuickCaptureResult } from "@/lib/sops/quick-capture/convert"

import { convertMediaCaptureOpenAi } from "./convert-media-openai"
import type { MediaCaptureContext } from "./types"

const MIN_FALLBACK_LENGTH = 8

export async function convertMediaCaptureContext(
  context: MediaCaptureContext
): Promise<QuickCaptureResult | null> {
  const fromWorkflow = context.transcripts.some((t) =>
    t.label.toLowerCase().includes("demonstration")
  )

  const aiDraft = await convertMediaCaptureOpenAi(context)
  if (aiDraft) {
    return { draft: aiDraft, source: "media" }
  }

  const text = context.fallbackText.trim()
  if (text.length < MIN_FALLBACK_LENGTH) return null

  const heuristic = fromWorkflow
    ? convertWorkflowDemonstration(text)
    : convertQuickCaptureHeuristic(text)

  return { draft: heuristic, source: "media" }
}
