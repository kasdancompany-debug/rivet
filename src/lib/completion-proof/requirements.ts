import type { StepProofRequirements } from "@/lib/completion-proof/types"

export type StepProofRequirementSource = {
  requires_photo_confirmation: boolean
  requires_video_proof?: boolean
  requires_manager_signoff?: boolean
  requires_checklist_completion?: boolean
}

export function stepProofRequirementsFromRow(step: StepProofRequirementSource): StepProofRequirements {
  return {
    photo: Boolean(step.requires_photo_confirmation),
    video: Boolean(step.requires_video_proof),
    checklist: step.requires_checklist_completion !== false,
    manager_signoff: Boolean(step.requires_manager_signoff),
  }
}

export function stepHasAnyProofRequirement(req: StepProofRequirements): boolean {
  return req.photo || req.video || req.checklist || req.manager_signoff
}

export function defaultStepProofRequirements(): StepProofRequirements {
  return {
    photo: false,
    video: false,
    checklist: true,
    manager_signoff: false,
  }
}
