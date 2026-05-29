import { fetchTrainingModuleWithItems } from "@/lib/db/queries"
import { getStepProofBlockers } from "@/lib/completion-proof/evaluate"
import { stepProofRequirementsFromRow } from "@/lib/completion-proof/requirements"
import { parseStepProofMap } from "@/lib/completion-proof/parse-proofs"
import type { TypedSupabaseClient } from "@/types/database"

export type StepProofRequirement = {
  trainingItemId: string
  stepId: string
}

function parseChecklistStepIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

/** All required proofs across required module items are satisfied. */
export async function evaluateModuleProofUploaded(
  supabase: TypedSupabaseClient,
  params: { employeeId: string; moduleId: string }
): Promise<{ proofRequired: boolean; proofUploaded: boolean }> {
  const mod = await fetchTrainingModuleWithItems(params.moduleId, supabase)
  if (!mod) return { proofRequired: false, proofUploaded: true }

  const items = (mod.training_items ?? []).filter((i) => i.required !== false)
  if (items.length === 0) {
    return { proofRequired: false, proofUploaded: true }
  }

  const standardIds = [...new Set(items.map((i) => i.standard_id))]
  const { data: steps } = await supabase
    .from("standard_steps")
    .select(
      "id, standard_id, requires_photo_confirmation, requires_video_proof, requires_manager_signoff, requires_checklist_completion"
    )
    .in("standard_id", standardIds)

  const requirements: StepProofRequirement[] = []
  for (const item of items) {
    for (const step of steps ?? []) {
      if (step.standard_id !== item.standard_id) continue
      const req = stepProofRequirementsFromRow(step)
      if (req.photo || req.video || req.checklist || req.manager_signoff) {
        requirements.push({ trainingItemId: item.id, stepId: step.id })
      }
    }
  }

  if (requirements.length === 0) {
    return { proofRequired: false, proofUploaded: true }
  }

  const itemIds = [...new Set(requirements.map((r) => r.trainingItemId))]
  const { data: progressRows } = await supabase
    .from("training_sop_progress")
    .select("training_item_id, step_checklist, photo_proofs, step_proofs")
    .eq("employee_id", params.employeeId)
    .in("training_item_id", itemIds)

  const progressByItem = new Map(
    (progressRows ?? []).map((row) => [
      row.training_item_id,
      {
        checklist: parseChecklistStepIds(row.step_checklist),
        proofMap: parseStepProofMap({
          stepProofsRaw: row.step_proofs,
          photoProofsRaw: row.photo_proofs,
        }),
      },
    ])
  )

  const proofUploaded = requirements.every((req) => {
    const progress = progressByItem.get(req.trainingItemId)
    const step = (steps ?? []).find((s) => s.id === req.stepId)
    if (!step) return false
    const stepReq = stepProofRequirementsFromRow(step)
    const checklistDone = progress?.checklist.includes(req.stepId) ?? false
    const state = progress?.proofMap.get(req.stepId)
    return getStepProofBlockers(stepReq, state, checklistDone).length === 0
  })

  return { proofRequired: true, proofUploaded }
}
