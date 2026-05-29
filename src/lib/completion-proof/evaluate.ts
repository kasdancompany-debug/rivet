import type { StepProofCompletionBlocker, StepProofRequirements, StepProofState } from "@/lib/completion-proof/types"

export function getStepProofBlockers(
  requirements: StepProofRequirements,
  state: StepProofState | undefined,
  checklistDone: boolean
): StepProofCompletionBlocker[] {
  const blockers: StepProofCompletionBlocker[] = []

  if (requirements.checklist && !checklistDone) {
    blockers.push({
      kind: "checklist",
      message: "Check off this step on the play checklist.",
    })
  }

  if (requirements.photo && !state?.photo?.mediaId) {
    blockers.push({
      kind: "photo",
      message: "Upload photo proof for this step.",
    })
  }

  if (requirements.video && !state?.video?.mediaId) {
    blockers.push({
      kind: "video",
      message: "Upload video proof for this step.",
    })
  }

  if (requirements.manager_signoff && !state?.managerSignoff?.signedOffBy) {
    blockers.push({
      kind: "manager_signoff",
      message: "Waiting for manager sign-off on this step.",
    })
  }

  return blockers
}

export function isStepProofComplete(
  requirements: StepProofRequirements,
  state: StepProofState | undefined,
  checklistDone: boolean
): boolean {
  return getStepProofBlockers(requirements, state, checklistDone).length === 0
}
