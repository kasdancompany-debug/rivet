/** Owner onboarding intake — persisted locally and summarized for dependency assessments. */

export type DaysPerWeekBand = "0-2" | "3-4" | "5-6" | "7"
export type TriState = "yes" | "sometimes" | "no"
export type InterruptFrequency = "rarely" | "weekly" | "daily" | "constant"
export type AvoidedTimeOff = "yes" | "no" | "prefer_not"
export type StandardsMode = "documented" | "mixed" | "verbal"
export type QualityDependence = "yes" | "no" | "unsure"

export type OwnerOnboardingAnswers = {
  daysPerWeek: DaysPerWeekBand | null
  openWithoutYou: TriState | null
  closeWithoutYou: TriState | null
  staffInterrupts: InterruptFrequency | null
  breaksWhenYouLeave: string
  avoidedTimeOff: AvoidedTimeOff | null
  standardsMode: StandardsMode | null
  qualityOnOnePerson: QualityDependence | null
}

export const ONBOARDING_STORAGE_KEY = "rivet.owner-onboarding.v2"

export type OwnerOnboardingStored = {
  version: 2
  answers: OwnerOnboardingAnswers
  completedAt: string | null
}

export function defaultOwnerOnboardingAnswers(): OwnerOnboardingAnswers {
  return {
    daysPerWeek: null,
    openWithoutYou: null,
    closeWithoutYou: null,
    staffInterrupts: null,
    breaksWhenYouLeave: "",
    avoidedTimeOff: null,
    standardsMode: null,
    qualityOnOnePerson: null,
  }
}
