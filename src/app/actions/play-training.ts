"use server"

import { revalidatePath } from "next/cache"

import { fetchSopWithSteps } from "@/lib/db/queries"
import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import {
  autoGeneratePlayTraining,
  persistPlayTrainingPack,
  type PlayTrainingSopRow,
} from "@/lib/training/auto-generate-play-training"
import { ensurePlayTrainingModule } from "@/lib/training/ensure-play-training-module"
import { parseTrainingPack, type PlayTrainingPack } from "@/lib/training/generate-training-pack"
import { syncTrainingModuleFromPack } from "@/lib/training/sync-training-module-from-pack"
import { createClient } from "@/lib/supabase/server"

async function requireOwnerForStandard(standardId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "You need to be signed in." }

  const gate = await requireWorkspacePermission(supabase, "manage_training_modules")
  if (!gate.ok) return gate

  const sop = await fetchSopWithSteps(standardId, supabase)
  if (!sop || sop.business_id !== gate.business.id) {
    return { ok: false as const, message: "Play not found." }
  }
  return { ok: true as const, supabase, business: gate.business, sop }
}

function sopRowFromFetched(sop: NonNullable<Awaited<ReturnType<typeof fetchSopWithSteps>>>): PlayTrainingSopRow {
  return {
    id: sop.id,
    business_id: sop.business_id,
    title: sop.title,
    description: sop.description,
    category: sop.category,
    status: sop.status,
    standards_capture: sop.standards_capture,
    standard_steps: (sop.standard_steps ?? []).map((s) => ({
      title: s.title,
      instructions: s.instructions,
      verification: s.verification,
      is_critical: s.is_critical,
      play_metadata: s.play_metadata,
      media_url: s.media_url,
    })),
  }
}

export async function generateTrainingFromPlay(
  standardId: string
): Promise<
  | { ok: true; moduleId: string; editHref: string; pack: PlayTrainingPack }
  | { ok: false; message: string }
> {
  try {
    const gate = await requireOwnerForStandard(standardId)
    if (!gate.ok) return gate
    const { supabase, sop } = gate

    if (sop.status !== "active") {
      return { ok: false, message: "Publish the play first—training is generated when the play goes live." }
    }

    const result = await autoGeneratePlayTraining(supabase, {
      sop: sopRowFromFetched(sop),
      standardsCaptureForMerge: sop.standards_capture ?? undefined,
      playJustPublished: true,
      forceRegenerate: true,
    })

    if (!result) {
      return { ok: false, message: "Could not generate training from this play." }
    }

    revalidatePath(`/sops/${standardId}`)
    revalidatePath(`/sops/${standardId}/training`)
    revalidatePath("/training")
    revalidatePath(`/training/modules/${result.moduleId}`)

    return {
      ok: true,
      moduleId: result.moduleId,
      editHref: `/sops/${standardId}/training`,
      pack: result.pack,
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function regenerateTrainingFromPlay(
  standardId: string
): Promise<{ ok: true; pack: PlayTrainingPack } | { ok: false; message: string }> {
  const res = await generateTrainingFromPlay(standardId)
  if (!res.ok) return res
  return { ok: true, pack: res.pack }
}

export async function saveTrainingPackDraft(
  standardId: string,
  pack: PlayTrainingPack
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const gate = await requireOwnerForStandard(standardId)
    if (!gate.ok) return gate
    const { supabase, sop } = gate

    const parsed = parseTrainingPack(pack)
    if (!parsed) return { ok: false, message: "Invalid training pack." }

    const moduleId =
      parsed.moduleId ??
      parseStandardsCapture(sop.standards_capture)?.trainingPack?.moduleId ??
      null

    const draftPack: PlayTrainingPack = { ...parsed, status: "draft", moduleId: moduleId ?? undefined }
    await persistPlayTrainingPack(supabase, {
      standardId,
      standardsCapture: sop.standards_capture,
      pack: draftPack,
      moduleId,
    })

    if (moduleId) {
      const capture = parseStandardsCapture(sop.standards_capture)
      await syncTrainingModuleFromPack(supabase, {
        moduleId,
        playTitle: sop.title,
        pack: draftPack,
        assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
      })
    }

    revalidatePath(`/sops/${standardId}`)
    revalidatePath(`/sops/${standardId}/training`)
    revalidatePath("/training")
    if (moduleId) revalidatePath(`/training/modules/${moduleId}`)

    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function publishTrainingFromPlay(
  standardId: string
): Promise<{ ok: true; moduleId: string } | { ok: false; message: string }> {
  try {
    const gate = await requireOwnerForStandard(standardId)
    if (!gate.ok) return gate
    const { supabase, sop } = gate

    const capture = parseStandardsCapture(sop.standards_capture)
    const existing = capture?.trainingPack ?? null
    if (!existing) {
      return { ok: false, message: "Training draft not found—publish the play or regenerate training first." }
    }

    const parsed = parseTrainingPack(existing) ?? existing

    const moduleId = await ensurePlayTrainingModule(supabase, {
      businessId: sop.business_id,
      standardId,
      playTitle: sop.title,
      assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
      existingModuleId: parsed.moduleId ?? null,
    })

    if (!moduleId) {
      return { ok: false, message: "Could not link the training module." }
    }

    const publishedPack: PlayTrainingPack = { ...parsed, moduleId, status: "published" }
    await persistPlayTrainingPack(supabase, {
      standardId,
      standardsCapture: sop.standards_capture,
      pack: publishedPack,
      moduleId,
    })

    await syncTrainingModuleFromPack(supabase, {
      moduleId,
      playTitle: sop.title,
      pack: publishedPack,
      assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
    })

    revalidatePath(`/sops/${standardId}`)
    revalidatePath(`/sops/${standardId}/training`)
    revalidatePath("/training")
    revalidatePath(`/training/modules/${moduleId}`)

    return { ok: true, moduleId }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
