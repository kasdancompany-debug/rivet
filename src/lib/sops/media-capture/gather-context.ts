import "server-only"

import { isAudioMedia, isImageMedia, isVideoMedia } from "@/lib/standards/standard-media-display"
import { STANDARD_MEDIA_BUCKET } from "@/lib/standards/standard-media-constants"
import { assertStandardInBusiness, signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { transcribeAudioOpenAi } from "@/lib/sops/voice-capture/transcribe-openai"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

import type { MediaCaptureContext } from "./types"

export type GatherMediaContextInput = {
  businessId: string
  standardId: string
  textPrompt?: string
  walkthroughMediaId?: string | null
  audioExplanationMediaId?: string | null
  photoMediaIds?: string[]
  goodExampleMediaId?: string | null
  badExampleMediaId?: string | null
}

function filenameFromPath(storagePath: string): string {
  const base = storagePath.split("/").pop() ?? "media.bin"
  return base.includes(".") ? base : `${base}.webm`
}

async function downloadMediaBlob(storagePath: string): Promise<Blob | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(STANDARD_MEDIA_BUCKET).download(storagePath)
  if (error || !data) return null
  return data
}

async function transcribeStoredMedia(
  row: Tables<"standard_media">,
  label: string
): Promise<{ label: string; text: string } | null> {
  if (!row.storage_path) return null
  const blob = await downloadMediaBlob(row.storage_path)
  if (!blob || blob.size === 0) return null

  const file = new File([blob], filenameFromPath(row.storage_path), {
    type: blob.type || "application/octet-stream",
  })
  const text = await transcribeAudioOpenAi(file)
  if (!text || text.length < 4) return null
  return { label, text }
}

export async function gatherMediaCaptureContext(
  input: GatherMediaContextInput
): Promise<
  | { ok: true; context: MediaCaptureContext }
  | { ok: false; message: string }
> {
  const gate = await assertStandardInBusiness(input.standardId, input.businessId)
  if (!gate.ok) return gate

  const mediaIds = [
    input.walkthroughMediaId,
    input.audioExplanationMediaId,
    ...(input.photoMediaIds ?? []),
    input.goodExampleMediaId,
    input.badExampleMediaId,
  ].filter((id): id is string => Boolean(id?.trim()))

  if (mediaIds.length === 0 && !(input.textPrompt?.trim().length ?? 0)) {
    return {
      ok: false,
      message: "Upload a video, photos, or audio — or add a short description — before generating.",
    }
  }

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("standard_media")
    .select("*")
    .eq("standard_id", input.standardId)
    .eq("business_id", input.businessId)
    .in("id", mediaIds)

  if (error) {
    return { ok: false, message: "Could not load uploaded media for this play." }
  }

  const byId = new Map((rows ?? []).map((r) => [r.id, r]))
  const signed = await signStandardMediaRows(rows ?? [])
  const signedById = new Map(signed.map((r) => [r.id, r]))

  const transcripts: MediaCaptureContext["transcripts"] = []
  const images: MediaCaptureContext["images"] = []

  if (input.walkthroughMediaId) {
    const row = byId.get(input.walkthroughMediaId)
    if (row && isVideoMedia(row)) {
      const t = await transcribeStoredMedia(row, "Demonstration video narration")
      if (t) transcripts.push(t)
    }
  }

  if (input.audioExplanationMediaId) {
    const row = byId.get(input.audioExplanationMediaId)
    if (row && isAudioMedia(row)) {
      const t = await transcribeStoredMedia(row, "Owner audio explanation")
      if (t) transcripts.push(t)
    }
  }

  const addImage = (id: string | null | undefined, label: string) => {
    if (!id) return
    const row = signedById.get(id)
    if (!row?.signedUrl || !isImageMedia(row)) return
    images.push({ label, signedUrl: row.signedUrl })
  }

  for (const id of input.photoMediaIds ?? []) {
    addImage(id, "Reference photo")
  }
  addImage(input.goodExampleMediaId, "Good example (what success looks like)")
  addImage(input.badExampleMediaId, "Bad example (what to avoid)")

  const textPrompt = input.textPrompt?.trim() || undefined
  const fallbackParts: string[] = []
  if (textPrompt) fallbackParts.push(textPrompt)
  for (const t of transcripts) {
    fallbackParts.push(`${t.label}:\n${t.text}`)
  }
  if (images.length > 0) {
    fallbackParts.push(
      `Owner provided ${images.length} reference photo(s) showing floor layout, examples, or completion states.`
    )
  }

  const fallbackText = fallbackParts.join("\n\n").trim()
  if (!fallbackText && images.length === 0) {
    return {
      ok: false,
      message:
        "Could not read speech from the uploads. Narrate the steps in your video/audio, or add a short text description.",
    }
  }

  return {
    ok: true,
    context: {
      textPrompt,
      transcripts,
      images: images.slice(0, 6),
      fallbackText: fallbackText || "Infer operational standard from uploaded reference photos.",
    },
  }
}
