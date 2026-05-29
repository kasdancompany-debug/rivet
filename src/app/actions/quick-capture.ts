"use server"

import { revalidatePath } from "next/cache"

import { saveSop } from "@/app/actions/sops"
import { convertQuickCaptureText } from "@/lib/sops/quick-capture/convert"
import {
  buildPlaySystemPreview,
  type PlaySystemPreview,
} from "@/lib/sops/quick-capture/build-play-system-preview"
import { savePayloadFromDraft } from "@/lib/sops/quick-capture/payload-from-draft"
import type { QuickCaptureDraft, QuickCaptureSource } from "@/lib/sops/quick-capture/types"
import { createClient } from "@/lib/supabase/server"

export async function convertQuickCapture(
  text: string
): Promise<
  | { ok: true; draft: QuickCaptureDraft; source: QuickCaptureSource }
  | { ok: false; message: string }
> {
  return convertQuickCaptureTextAction(text)
}

/** @deprecated Use convertQuickCapture — kept for clarity at call sites. */
export const generatePlayFromDescription = convertQuickCapture

export async function previewPlaySystemFromText(
  text: string
): Promise<
  | { ok: true; preview: PlaySystemPreview; source: QuickCaptureSource }
  | { ok: false; message: string }
> {
  const converted = await convertQuickCaptureTextAction(text)
  if (!converted.ok) return converted

  return {
    ok: true,
    preview: buildPlaySystemPreview(converted.draft, text.trim()),
    source: converted.source,
  }
}

async function convertQuickCaptureTextAction(
  text: string
): Promise<
  | { ok: true; draft: QuickCaptureDraft; source: QuickCaptureSource }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const trimmed = text.trim()
    if (trimmed.length < 8) {
      return { ok: false, message: "Describe what keeps happening in a few words first." }
    }

    const result = await convertQuickCaptureText(trimmed)
    if (!result) {
      return { ok: false, message: "Could not convert that description." }
    }

    return { ok: true, draft: result.draft, source: result.source }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function quickCaptureAndSaveDraft(payload: {
  businessId: string
  text: string
  sopId?: string
}): Promise<
  | { ok: true; id: string; draft: QuickCaptureDraft; source: QuickCaptureSource }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const trimmed = payload.text.trim()
    if (trimmed.length < 8) {
      return { ok: false, message: "Describe what keeps happening in a few words first." }
    }

    const result = await convertQuickCaptureText(trimmed)
    if (!result) {
      return { ok: false, message: "Could not convert that description." }
    }

    const preview = buildPlaySystemPreview(result.draft, trimmed)
    const saveResult = await saveSop(
      savePayloadFromDraft(
        payload.businessId,
        result.draft,
        payload.sopId,
        {
          successLooksLike: result.draft.successCriteria || result.draft.purpose,
          failureLooksLike:
            result.draft.rootCauses.find((c) =>
              c.title.toLowerCase().includes("visual")
            )?.description ?? result.draft.operationalProblem,
          newHireMistakes: preview.commonMistakes.slice(0, 5),
          ifNobodyAsks: preview.askRivet.escalation,
          faqs: [
            {
              question: preview.askRivet.sampleQuestion,
              answer: preview.askRivet.quickAnswer,
            },
          ],
          goodExampleMediaId: null,
          badExampleMediaId: null,
        }
      )
    )
    if (!saveResult.ok) {
      return { ok: false, message: saveResult.message }
    }

    revalidatePath("/sops")
    revalidatePath("/sops/capture")

    return {
      ok: true,
      id: saveResult.id,
      draft: result.draft,
      source: result.source,
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
