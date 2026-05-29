import { convertQuickCaptureHeuristic, convertWorkflowDemonstration } from "./convert-heuristic"
import { convertQuickCaptureOpenAi } from "./convert-openai"
import type { QuickCaptureDraft, QuickCaptureSource } from "./types"

export type QuickCaptureResult = {
  draft: QuickCaptureDraft
  source: QuickCaptureSource
}

const MIN_INPUT_LENGTH = 8

export async function convertQuickCaptureText(
  rawText: string,
  opts?: { fromWorkflow?: boolean }
): Promise<QuickCaptureResult | null> {
  const text = rawText.trim()
  if (text.length < MIN_INPUT_LENGTH) return null

  const aiDraft = await convertQuickCaptureOpenAi(text, opts)
  if (aiDraft) {
    return { draft: aiDraft, source: opts?.fromWorkflow ? "workflow" : "openai" }
  }

  const heuristic = opts?.fromWorkflow
    ? convertWorkflowDemonstration(text)
    : convertQuickCaptureHeuristic(text)

  return { draft: heuristic, source: opts?.fromWorkflow ? "workflow" : "heuristic" }
}
