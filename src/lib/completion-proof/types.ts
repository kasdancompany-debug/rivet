/** Completion proof kinds for play steps. */
export const STEP_PROOF_KINDS = [
  "photo",
  "video",
  "checklist",
  "manager_signoff",
] as const

export type StepProofKind = (typeof STEP_PROOF_KINDS)[number]

export type StepProofRequirements = {
  photo: boolean
  video: boolean
  checklist: boolean
  manager_signoff: boolean
}

export type StepPhotoProof = {
  mediaId: string
  signedUrl: string | null
}

export type StepVideoProof = {
  mediaId: string
  signedUrl: string | null
}

export type StepManagerSignoffProof = {
  signedOffBy: string
  signedOffAt: string
  signedOffName: string | null
}

/** Parsed media/sign-off proof for one step (checklist tracked via step id list). */
export type StepProofState = {
  stepId: string
  photo: StepPhotoProof | null
  video: StepVideoProof | null
  managerSignoff: StepManagerSignoffProof | null
}

export type StepProofCompletionBlocker = {
  kind: StepProofKind
  message: string
}
