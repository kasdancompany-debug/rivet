import {
  legacyPhotoProofsFromMap,
  parseStepProofMap,
  stepProofMapToJson,
} from "@/lib/completion-proof/parse-proofs"
import type { StepProofState } from "@/lib/completion-proof/types"
import type { TypedSupabaseClient } from "@/types/database"

export async function loadPortalStepProofState(
  supabase: TypedSupabaseClient,
  params: { employeeId: string; trainingItemId: string }
): Promise<{
  stepProofByStepId: Record<string, StepProofState>
  checklistStepIds: string[]
}> {
  const { data: row } = await supabase
    .from("training_sop_progress")
    .select("step_checklist, photo_proofs, step_proofs")
    .eq("employee_id", params.employeeId)
    .eq("training_item_id", params.trainingItemId)
    .maybeSingle()

  const checklistStepIds = Array.isArray(row?.step_checklist)
    ? row.step_checklist.filter((v): v is string => typeof v === "string")
    : []

  const map = parseStepProofMap({
    stepProofsRaw: row?.step_proofs,
    photoProofsRaw: row?.photo_proofs,
  })

  const stepProofByStepId: Record<string, StepProofState> = {}
  for (const [id, state] of map) {
    stepProofByStepId[id] = state
  }

  return { stepProofByStepId, checklistStepIds }
}

export function mergeStepProofUpdate(
  current: Record<string, StepProofState>,
  stepId: string,
  patch: Partial<StepProofState>
): Record<string, StepProofState> {
  const existing = current[stepId] ?? {
    stepId,
    photo: null,
    video: null,
    managerSignoff: null,
  }
  return {
    ...current,
    [stepId]: {
      ...existing,
      ...patch,
      stepId,
    },
  }
}

export function stepProofRecordsToDbPayload(stepProofByStepId: Record<string, StepProofState>) {
  const map = new Map(Object.entries(stepProofByStepId))
  return {
    step_proofs: stepProofMapToJson(map),
    photo_proofs: legacyPhotoProofsFromMap(map),
  }
}
