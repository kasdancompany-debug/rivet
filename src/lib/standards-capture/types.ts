/** Persisted in `sops.standards_capture` (JSON). */

export const STANDARDS_CAPTURE_VERSION = 1 as const

export type ExampleAsset = {
  url: string
  caption?: string
}

export type StandardsCaptureV1 = {
  version: typeof STANDARDS_CAPTURE_VERSION
  onboarding?: {
    interrupts?: string
    headOnly?: string
    weekAway?: string
  }
  videoUrl?: string | null
  /** `standard_media.id` for an uploaded walkthrough clip (private bucket). */
  walkthroughMediaId?: string | null
  photoUrls: string[]
  qualityStandards: string[]
  acceptableExamples: ExampleAsset[]
  unacceptableExamples: ExampleAsset[]
  assignedRoles: string[]
  competencyMarkers: string[]
}

export function emptyStandardsCapture(): StandardsCaptureV1 {
  return {
    version: STANDARDS_CAPTURE_VERSION,
    walkthroughMediaId: null,
    photoUrls: [],
    qualityStandards: [],
    acceptableExamples: [],
    unacceptableExamples: [],
    assignedRoles: [],
    competencyMarkers: [],
  }
}

export const COMPETENCY_QUICK_ADD = [
  "Food safety sign-off",
  "Cash handling cleared",
  "Opening without owner",
  "Closing without owner",
  "Guest recovery",
] as const
