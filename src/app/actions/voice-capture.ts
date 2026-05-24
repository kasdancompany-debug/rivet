"use server"

import { transcribeAudioOpenAi } from "@/lib/sops/voice-capture/transcribe-openai"
import { createClient } from "@/lib/supabase/server"

export async function transcribeVoiceCapture(
  formData: FormData
): Promise<{ ok: true; transcript: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const file = formData.get("audio")
    if (!(file instanceof Blob) || file.size === 0) {
      return { ok: false, message: "No audio was recorded." }
    }

    if (file.size > 25 * 1024 * 1024) {
      return { ok: false, message: "Recording is too long. Keep it under two minutes." }
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return {
        ok: false,
        message: "Voice capture needs OPENAI_API_KEY for transcription.",
      }
    }

    const transcript = await transcribeAudioOpenAi(file)
    if (!transcript) {
      return { ok: false, message: "Could not transcribe that recording. Try again." }
    }

    if (transcript.length < 8) {
      return { ok: false, message: "Say a bit more—we need at least a short sentence." }
    }

    return { ok: true, transcript }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
