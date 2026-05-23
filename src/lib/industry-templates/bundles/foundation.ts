/** Counts installed during industry onboarding (every vertical). */
export const FOUNDATION_SOP_COUNT = 5
export const FOUNDATION_TRAINING_COUNT = 3
export const FOUNDATION_INTERRUPTION_COUNT = 5
export const FOUNDATION_ISSUE_COUNT = 3

export function foundationSopIds(ids: readonly string[]): readonly string[] {
  return ids.slice(0, FOUNDATION_SOP_COUNT)
}
