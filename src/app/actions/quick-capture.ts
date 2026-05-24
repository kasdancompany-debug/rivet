"use server"

import { saveSop, type SaveSopPayload } from "@/app/actions/sops"
import { convertQuickCaptureText } from "@/lib/sops/quick-capture/convert"
import type { QuickCaptureDraft, QuickCaptureSource } from "@/lib/sops/quick-capture/types"
import { STANDARDS_CAPTURE_VERSION } from "@/lib/standards-capture/types"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

function buildCaptureFromDraft(draft: QuickCaptureDraft): Json {
  return {
    version: STANDARDS_CAPTURE_VERSION,
    photoUrls: [],
    videoUrl: null,
    walkthroughMediaId: null,
    qualityStandards: [],
    acceptableExamples: [],
    unacceptableExamples: [],
    assignedRoles: draft.assignedRoles,
    competencyMarkers: draft.trainingCheckpoints,
  } satisfies Json
}

function savePayloadFromDraft(
  businessId: string,
  draft: QuickCaptureDraft,
  sopId?: string
): SaveSopPayload {
  return {
    sopId,
    businessId,
    title: draft.title,
    description: draft.purpose,
    category: draft.category,
    importance_level: draft.importanceLevel,
    owner_dependency_level: draft.ownerDependencyLevel,
    estimated_time_minutes: draft.estimatedTimeMinutes,
    status: "draft",
    steps: draft.steps.map((step) => ({
      title: step.title,
      instructions: step.instructions,
      media_url: null,
      requires_photo_confirmation: false,
    })),
    standards_capture: buildCaptureFromDraft(draft),
  }
}

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

    const saveResult = await saveSop(savePayloadFromDraft(payload.businessId, result.draft, payload.sopId))
    if (!saveResult.ok) {
      return { ok: false, message: saveResult.message }
    }

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
