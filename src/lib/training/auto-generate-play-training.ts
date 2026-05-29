import type { SaveSopPayload } from "@/app/actions/sops"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { buildTrainingPackFromStandard } from "@/lib/training/build-training-pack-from-standard"
import { ensurePlayTrainingModule } from "@/lib/training/ensure-play-training-module"
import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"
import { mergeTrainingPackIntoCapture } from "@/lib/training/attach-training-pack-on-publish"
import { syncTrainingModuleFromPack } from "@/lib/training/sync-training-module-from-pack"
import type { TypedSupabaseClient } from "@/types/database"
import type { Json } from "@/types/database"

export type AutoGenerateTrainingResult = {
  pack: PlayTrainingPack
  moduleId: string
  skipped: boolean
  reason?: string
}

export type PlayTrainingSopRow = {
  id: string
  business_id: string
  title: string
  description: string | null
  category: string
  status: string
  standards_capture: Json | null
  standard_steps: {
    title: string
    instructions: string
    verification?: string | null
    is_critical?: boolean
    play_metadata?: Json
    media_url?: string | null
  }[]
}

function quizJsonFromPack(pack: PlayTrainingPack): Json {
  return {
    version: pack.version,
    generatedAt: pack.generatedAt,
    questions: pack.quizQuestions,
  } as Json
}

export function shouldAutoGenerateTrainingPack(input: {
  playJustPublished: boolean
  existingPack: StandardsCaptureV1["trainingPack"] | null | undefined
  forceRegenerate?: boolean
}): boolean {
  if (input.forceRegenerate) return true
  if (input.playJustPublished) return true
  if (!input.existingPack) return true
  return false
}

export function buildDraftTrainingPackFromSop(
  sop: PlayTrainingSopRow,
  existingPack?: PlayTrainingPack | null
): PlayTrainingPack {
  const capture = parseStandardsCapture(sop.standards_capture)
  return buildTrainingPackFromStandard({
    title: sop.title,
    description: sop.description,
    category: sop.category,
    capture,
    steps: (sop.standard_steps ?? []).map((s) => ({
      title: s.title,
      instructions: s.instructions,
      verification: s.verification ?? null,
      is_critical: s.is_critical ?? false,
      play_metadata: s.play_metadata ?? {},
      media_url: s.media_url ?? null,
    })),
    existingPack: existingPack ?? capture?.trainingPack ?? null,
    trainingPublish: false,
  })
}

export function buildDraftTrainingPackFromSavePayload(
  payload: SaveSopPayload,
  existingPack?: PlayTrainingPack | null
): PlayTrainingPack {
  const capture = parseStandardsCapture(payload.standards_capture)
  return buildTrainingPackFromStandard({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    capture,
    steps: payload.steps.map((s) => ({
      title: s.title,
      instructions: s.instructions,
      verification: s.verification ?? null,
      is_critical: s.is_critical ?? false,
      play_metadata: (s.play_metadata ?? {}) as Json,
      media_url: s.media_url ?? null,
    })),
    existingPack: existingPack ?? capture?.trainingPack ?? null,
    trainingPublish: false,
  })
}

export async function persistPlayTrainingPack(
  supabase: TypedSupabaseClient,
  input: {
    standardId: string
    standardsCapture: Json | null | undefined
    pack: PlayTrainingPack
    moduleId: string | null
  }
): Promise<void> {
  const merged = mergeTrainingPackIntoCapture(input.standardsCapture ?? undefined, input.pack, input.moduleId)
  await supabase
    .from("standards")
    .update({
      standards_capture: merged,
      quiz_questions: quizJsonFromPack(input.pack),
    })
    .eq("id", input.standardId)
}

export async function autoGeneratePlayTraining(
  supabase: TypedSupabaseClient,
  input: {
    sop: PlayTrainingSopRow
    standardsCaptureForMerge: Json | undefined
    playJustPublished: boolean
    forceRegenerate?: boolean
  }
): Promise<AutoGenerateTrainingResult | null> {
  if (input.sop.status !== "active") return null

  const capture = parseStandardsCapture(input.standardsCaptureForMerge ?? input.sop.standards_capture)
  const existingPack = capture?.trainingPack ?? null

  if (existingPack?.status === "published" && !input.forceRegenerate) {
    const moduleId = await ensurePlayTrainingModule(supabase, {
      businessId: input.sop.business_id,
      standardId: input.sop.id,
      playTitle: input.sop.title,
      assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
      existingModuleId: existingPack.moduleId ?? null,
    })
    if (!moduleId) return null
    return {
      pack: existingPack,
      moduleId,
      skipped: true,
      reason: "Training already published — link preserved.",
    }
  }

  if (
    !shouldAutoGenerateTrainingPack({
      playJustPublished: input.playJustPublished,
      existingPack,
      forceRegenerate: input.forceRegenerate,
    })
  ) {
    const moduleId = existingPack?.moduleId
      ? existingPack.moduleId
      : await ensurePlayTrainingModule(supabase, {
          businessId: input.sop.business_id,
          standardId: input.sop.id,
          playTitle: input.sop.title,
          assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
          existingModuleId: null,
        })
    if (!moduleId || !existingPack) return null
    return {
      pack: existingPack,
      moduleId,
      skipped: true,
      reason: "Draft training kept — your edits were preserved.",
    }
  }

  const pack = buildDraftTrainingPackFromSop(input.sop, existingPack)
  const moduleId = await ensurePlayTrainingModule(supabase, {
    businessId: input.sop.business_id,
    standardId: input.sop.id,
    playTitle: input.sop.title,
    assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
    existingModuleId: pack.moduleId ?? existingPack?.moduleId ?? null,
  })
  if (!moduleId) return null

  const finalPack: PlayTrainingPack = {
    ...pack,
    moduleId,
    status: "draft",
  }

  await persistPlayTrainingPack(supabase, {
    standardId: input.sop.id,
    standardsCapture: input.standardsCaptureForMerge ?? input.sop.standards_capture,
    pack: finalPack,
    moduleId,
  })

  await syncTrainingModuleFromPack(supabase, {
    moduleId,
    playTitle: input.sop.title,
    pack: finalPack,
    assignedRole: capture?.assignedRoles?.[0]?.trim() ?? null,
  })

  return { pack: finalPack, moduleId, skipped: false }
}
