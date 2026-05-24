import { convertQuickCaptureHeuristic } from "./convert-heuristic"
import { convertQuickCaptureOpenAi } from "./convert-openai"
import type { QuickCaptureDraft, QuickCaptureSource } from "./types"

export type QuickCaptureResult = {
  draft: QuickCaptureDraft
  source: QuickCaptureSource
}

const MIN_INPUT_LENGTH = 8

export async function convertQuickCaptureText(rawText: string): Promise<QuickCaptureResult | null> {
  const text = rawText.trim()
  if (text.length < MIN_INPUT_LENGTH) return null

  const aiDraft = await convertQuickCaptureOpenAi(text)
  if (aiDraft) {
    return { draft: aiDraft, source: "openai" }
  }

  return { draft: convertQuickCaptureHeuristic(text), source: "heuristic" }
}
