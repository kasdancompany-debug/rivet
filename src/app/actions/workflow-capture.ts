"use server"

import { convertQuickCaptureText } from "@/lib/sops/quick-capture/convert"
import { transcribeAudioOpenAi } from "@/lib/sops/voice-capture/transcribe-openai"
import { createClient } from "@/lib/supabase/server"
import type { QuickCaptureDraft, QuickCaptureSource } from "@/lib/sops/quick-capture/types"

export async function convertWorkflowDemonstration(
  formData: FormData
): Promise<
  | { ok: true; draft: QuickCaptureDraft; source: QuickCaptureSource; transcript: string }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const file = formData.get("video")
    if (!(file instanceof Blob) || file.size === 0) {
      return { ok: false, message: "No workflow video was recorded." }
    }

    if (file.size > 25 * 1024 * 1024) {
      return { ok: false, message: "Recording is too long. Keep it under two minutes." }
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return {
        ok: false,
        message: "Workflow capture needs OPENAI_API_KEY for transcription and analysis.",
      }
    }

    const transcript = await transcribeAudioOpenAi(file)
    if (!transcript || transcript.length < 8) {
      return {
        ok: false,
        message: "Could not extract speech from that recording. Narrate the steps as you work.",
      }
    }

    const result = await convertQuickCaptureText(transcript, { fromWorkflow: true })
    if (!result) {
      return { ok: false, message: "Could not build a play from that demonstration." }
    }

    return { ok: true, draft: result.draft, source: result.source, transcript }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
