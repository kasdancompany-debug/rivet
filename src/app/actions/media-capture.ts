"use server"

import { convertMediaCaptureContext } from "@/lib/sops/media-capture/convert"
import { gatherMediaCaptureContext } from "@/lib/sops/media-capture/gather-context"
import type { QuickCaptureDraft, QuickCaptureSource } from "@/lib/sops/quick-capture/types"

export async function generatePlayFromMedia(payload: {
  businessId: string
  standardId: string
  textPrompt?: string
  walkthroughMediaId?: string | null
  audioExplanationMediaId?: string | null
  photoMediaIds?: string[]
  goodExampleMediaId?: string | null
  badExampleMediaId?: string | null
}): Promise<
  | {
      ok: true
      draft: QuickCaptureDraft
      source: QuickCaptureSource
      contextSummary: string
    }
  | { ok: false; message: string }
> {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return {
        ok: false,
        message: "Media inference needs OPENAI_API_KEY configured on the server.",
      }
    }

    const gathered = await gatherMediaCaptureContext(payload)
    if (!gathered.ok) return gathered

    const result = await convertMediaCaptureContext(gathered.context)
    if (!result) {
      return {
        ok: false,
        message: "Could not infer a play from those uploads. Add narration or a short description and try again.",
      }
    }

    const parts: string[] = []
    if (gathered.context.transcripts.length) {
      parts.push(`${gathered.context.transcripts.length} transcript(s)`)
    }
    if (gathered.context.images.length) {
      parts.push(`${gathered.context.images.length} photo(s)`)
    }
    if (gathered.context.textPrompt) {
      parts.push("owner description")
    }

    return {
      ok: true,
      draft: result.draft,
      source: result.source,
      contextSummary: parts.length ? parts.join(" · ") : "uploaded media",
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
